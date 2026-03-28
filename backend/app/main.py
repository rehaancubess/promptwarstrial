import os
import datetime
import json
import asyncio
import base64
import logging

from dotenv import load_dotenv

load_dotenv()

from fastapi import (
    FastAPI,
    UploadFile,
    File,
    HTTPException,
    Query,
    Depends,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from pydantic import BaseModel
from typing import List, Optional
from google import genai
from google.genai import types

import firebase_admin
from firebase_admin import firestore, auth as firebase_auth

# ─── ADK imports ──────────────────────────────────────────────────────────────
from google.adk.runners import Runner
from google.adk.agents import LiveRequestQueue
from google.adk.agents.run_config import RunConfig, StreamingMode
from google.adk.sessions import InMemorySessionService
from google.genai import types as genai_types

from app.voice_agent import root_agent

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── FastAPI app ──────────────────────────────────────────────────────────────
app = FastAPI(title="Hemora API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://hemora-frontend-713215250376.us-central1.run.app",
        "https://hemora-frontend-5ogiqxpdea-uc.a.run.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup Gzip for efficiency
app.add_middleware(GZipMiddleware, minimum_size=1000)

security = HTTPBearer()

# ─── Firebase Init ────────────────────────────────────────────────────────────
try:
    firebase_admin.initialize_app(options={'projectId': 'hemora-4d321'})
    db = firestore.client()
    logger.info("Firestore connected.")
except Exception as e:
    logger.warning(f"Firestore init failed: {e}")
    db = None


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify Firebase ID token and return user UID."""
    if not db:
        logger.warning("Skipping auth check — Firestore not initialized.")
        return "fake-user-id"
    try:
        decoded_token = firebase_auth.verify_id_token(credentials.credentials)
        return decoded_token["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=401, detail=f"Invalid authentication credentials: {e}"
        )


def verify_ws_token(token: str) -> Optional[str]:
    """Verify a Firebase ID token from WebSocket query param. Returns uid or None."""
    if not db or not token:
        return "fake-user-id"
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        return None


# ─── Gemini genai client (for report analysis) ────────────────────────────────
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# ─── ADK session service (in-memory for now) ─────────────────────────────────
session_service = InMemorySessionService()


# ─── Pydantic models ─────────────────────────────────────────────────────────
class Metric(BaseModel):
    """A single medical metric extracted from a report."""

    name: str
    value: float
    unit: str
    min_normal: float
    max_normal: float
    status: str  # "Low", "Normal", "High"
    delta: Optional[float] = None
    delta_direction: Optional[str] = None  # "up", "down", "none"


class AnalysisResult(BaseModel):
    """Full analysis result from the Gemini model."""

    extracted_metrics: List[Metric]
    insights: List[str]
    recommendations: List[str]
    risk_level: str  # "Low", "Moderate", "High"


class HealthResponse(BaseModel):
    status: str
    message: str


# ─── HTTP Endpoints ───────────────────────────────────────────────────────────
@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok", "message": "Hemora API is running"}


@app.get("/api/history")
async def get_history(user_id: str = Depends(get_current_user)):
    if not db:
        return {"history": []}
    try:
        docs = (
            db.collection("reports")
            .where("user_id", "==", user_id)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .stream()
        )
        history = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            history.append(data)
        return {"history": history}
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch history.")


@app.post("/api/analyze")
async def analyze_data(
    file: UploadFile = File(...), user_id: str = Depends(get_current_user)
):
    try:
        if int(file.size or 0) > 10 * 1024 * 1024:
            raise HTTPException(400, "File too large. Maximum size is 10MB.")

        content = await file.read()
        mime_type = file.content_type or "image/jpeg"

        # 1. Fetch the single most recent report for historical context
        historical_context = ""
        if db:
            docs = (
                db.collection("reports")
                .where("user_id", "==", user_id)
                .order_by("created_at", direction=firestore.Query.DESCENDING)
                .limit(1)
                .stream()
            )
            reports_list = [d.to_dict() for d in docs]
            if reports_list:
                last_report = reports_list[0]
                historical_context = "PREVIOUS REPORT METRICS:\n"
                for m in last_report.get("analysis", {}).get("extracted_metrics", []):
                    historical_context += f"- {m['name']}: {m['value']} {m['unit']}\n"

        prompt = f"""
        You are Hemora, an AI health assistant.
        Analyze the provided new medical report.
        Extract all the medical metrics you find with their exact values, units, and standard reference ranges.
        Determine if the status of each is Low, Normal, or High based on the reference range.

        {historical_context}

        IMPORTANT: If historical metrics were provided above, compare the new values against the old values.
        Set the `delta` (absolute difference) and `delta_direction` ("up", "down", or "none") for each matching metric.
        If a metric has no previous history, leave delta null.
        Then, provide 2-3 personalized insights in active voice about what the numbers mean.
        Next, provide 2-3 specific, actionable recommendations.
        Finally, assign an overall risk_level of "Low", "Moderate", or "High".
        """

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                prompt,
                types.Part.from_bytes(data=content, mime_type=mime_type),
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalysisResult,
                temperature=0.1,
            ),
        )

        result_json = json.loads(response.text)

        # 2. Persist to Firestore
        if db:
            db.collection("reports").add(
                {
                    "user_id": user_id,
                    "created_at": datetime.datetime.now(
                        datetime.timezone.utc
                    ).isoformat(),
                    "filename": file.filename,
                    "analysis": result_json,
                }
            )

        return result_json

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        raise HTTPException(
            status_code=500, detail="Analysis failed. Please try again."
        )


# ─── WebSocket Voice Doctor Endpoint ─────────────────────────────────────────
@app.websocket("/ws/voice")
async def voice_websocket(websocket: WebSocket, token: str = Query(default="")):
    """
    Real-time bi-directional voice endpoint powered by Google ADK.

    Protocol:
    - Client sends binary frames: raw 16-bit PCM audio at 16kHz
    - Client sends JSON text frames: {"type": "end_of_turn"} to signal end of user speech
    - Server sends JSON text frames:
        {"type": "audio", "data": "<base64 PCM 24kHz>"}
        {"type": "text", "data": "<transcript chunk>"}
        {"type": "status", "data": "connected"|"thinking"|"speaking"|"done"}
    """
    # 1. Auth check
    user_id = verify_ws_token(token)
    if not user_id:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await websocket.accept()
    logger.info(f"Voice WebSocket connected: user={user_id}")

    try:
        await websocket.send_json({"type": "status", "data": "connected"})

        # 2. Optionally fetch user context to prime the agent
        health_context = ""
        if db:
            try:
                docs = (
                    db.collection('reports')
                    .where('user_id', '==', user_id)
                    .order_by('created_at', direction=firestore.Query.ASCENDING)
                    .stream()
                )
                reports = [d.to_dict() for d in docs]
                if reports:
                    health_context = "\n\nUSER'S FULL HEALTH HISTORY AND METRIC REPORTS (Oldest to Newest):\n"
                    for i, r in enumerate(reports):
                        health_context += f"--- REPORT {i+1} (Date: {r.get('created_at', 'Unknown')}) ---\n"
                        metrics = r.get("analysis", {}).get("extracted_metrics", [])
                        for m in metrics:
                            health_context += f"- {m['name']}: {m['value']} {m['unit']} (Status: {m['status']})\n"
            except Exception as e:
                logger.warning(f"Could not fetch health context: {e}")

        # 3. Set up ADK session and runner
        APP_NAME = "hemora_voice"
        session = await session_service.create_session(
            app_name=APP_NAME,
            user_id=user_id,
        )

        run_config = RunConfig(
            streaming_mode=StreamingMode.BIDI,
            response_modalities=["AUDIO"],
            speech_config=genai_types.SpeechConfig(
                voice_config=genai_types.VoiceConfig(
                    prebuilt_voice_config=genai_types.PrebuiltVoiceConfig(
                        voice_name="Aoede"
                    )
                )
            ),
        )

        # Inject user health context as the first system message if available
        initial_message = f"You are now connected to user ID {user_id}. {health_context}\nGreet them briefly and let them know you're ready to help."

        runner = Runner(
            app_name=APP_NAME,
            agent=root_agent,
            session_service=session_service,
        )
        live_request_queue = LiveRequestQueue()

        async def send_initial_context():
            """Send initial greeting context to the agent."""
            content = genai_types.Content(
                role="user", parts=[genai_types.Part(text=initial_message)]
            )
            live_request_queue.send_content(content=content)

        async def browser_to_agent():
            """Receive audio bytes from browser, forward to ADK agent."""
            try:
                while True:
                    message = await websocket.receive()
                    if message["type"] == "websocket.disconnect":
                        break
                    elif message["type"] == "websocket.receive":
                        if "bytes" in message and message["bytes"]:
                            # Raw PCM audio chunk from browser
                            blob = genai_types.Blob(
                                mime_type="audio/pcm;rate=16000",
                                data=message["bytes"],
                            )
                            live_request_queue.send_realtime(blob)
                        elif "text" in message and message["text"]:
                            data = json.loads(message["text"])
                            if data.get("type") == "end_of_turn":
                                live_request_queue.send_content(
                                    content=genai_types.Content(
                                        role="user",
                                        parts=[genai_types.Part(text="<end_of_turn>")],
                                    )
                                )
                            elif data.get("type") == "text_message":
                                # Allow text messages too (fallback)
                                content = genai_types.Content(
                                    role="user",
                                    parts=[genai_types.Part(text=data.get("text", ""))],
                                )
                                live_request_queue.send_content(content=content)
            except WebSocketDisconnect:
                pass
            finally:
                live_request_queue.close()

        async def agent_to_browser():
            """Receive agent responses and forward to browser."""
            try:
                async for event in runner.run_live(
                    user_id=user_id,
                    session_id=session.id,
                    live_request_queue=live_request_queue,
                    run_config=run_config,
                ):
                    if not event:
                        continue

                    # Stream audio chunks
                    if getattr(event, "content", None):
                        for part in getattr(event.content, "parts", []):
                            if getattr(part, "inline_data", None) and getattr(
                                part.inline_data, "data", None
                            ):
                                audio_b64 = base64.b64encode(
                                    part.inline_data.data
                                ).decode("utf-8")
                                await websocket.send_json(
                                    {"type": "audio", "data": audio_b64}
                                )
                            if getattr(part, "text", None):
                                await websocket.send_json(
                                    {"type": "text", "data": part.text}
                                )

                    # Turn complete signal
                    if getattr(event, "turn_complete", False):
                        await websocket.send_json({"type": "status", "data": "done"})

            except WebSocketDisconnect:
                pass
            except Exception as e:
                logger.error(f"Agent-to-browser error: {e}")
                try:
                    await websocket.send_json({"type": "error", "data": str(e)})
                except Exception:
                    pass

        # 4. Run all tasks concurrently
        await send_initial_context()
        await asyncio.gather(browser_to_agent(), agent_to_browser())

    except WebSocketDisconnect:
        logger.info(f"Voice WebSocket disconnected: user={user_id}")
    except Exception as e:
        logger.error(f"Voice WebSocket error: {e}")
        try:
            await websocket.send_json(
                {"type": "error", "data": "Internal server error"}
            )
            await websocket.close()
        except Exception:
            pass
