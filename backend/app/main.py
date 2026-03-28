import os
import datetime
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from google import genai
from google.genai import types
import json

import firebase_admin
from firebase_admin import credentials, firestore

app = FastAPI(title="Hemora API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase (relies on Application Default Credentials in GCP/local)
try:
    firebase_admin.initialize_app()
    db = firestore.client()
    print("Firestore connected.")
except Exception as e:
    print(f"Warning: Firestore init failed: {e}")
    db = None

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class Metric(BaseModel):
    name: str
    value: float
    unit: str
    min_normal: float
    max_normal: float
    status: str  # "Low", "Normal", "High"
    delta: Optional[float] = None
    delta_direction: Optional[str] = None # "up", "down", "none"

class AnalysisResult(BaseModel):
    extracted_metrics: List[Metric]
    insights: List[str]
    recommendations: List[str]
    risk_level: str  # "Low", "Moderate", "High"

class HealthResponse(BaseModel):
    status: str
    message: str

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok", "message": "Hemora API is running"}

@app.get("/api/history")
async def get_history(user_id: str = Query(...)):
    if not db:
        raise HTTPException(status_code=500, detail="Database not configured.")
    try:
        docs = db.collection('reports').where('user_id', '==', user_id).stream()
        history = []
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            history.append(data)
        history.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        return {"history": history}
    except Exception as e:
        print(f"Error fetching history: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_data(file: UploadFile = File(...), user_id: str = Form("anonymous")):
    try:
        content = await file.read()
        mime_type = file.content_type or "image/jpeg"
        
        # 1. Fetch previous history
        historical_context = ""
        if db:
            docs = db.collection('reports').where('user_id', '==', user_id).stream()
            reports_list = [d.to_dict() for d in docs]
            if reports_list:
                last_report = sorted(reports_list, key=lambda x: x.get('created_at', ''), reverse=True)[0]
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
        Set the `delta` (absolute difference) and `delta_direction` ("up", "down", or "none") for each matching metric. If a metric has no previous history, leave delta null.
        Then, provide 2-3 personalized insights in active voice about what the numbers mean, explicitly mentioning improvements or declines if they exist.
        Next, provide 2-3 specific, actionable recommendations.
        Finally, assign an overall risk_level of "Low", "Moderate", or "High".
        """

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[
                prompt,
                types.Part.from_bytes(
                    data=content,
                    mime_type=mime_type,
                )
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalysisResult,
                temperature=0.1,
            ),
        )
        
        result_json = json.loads(response.text)
        
        # 2. Save to Firestore
        if db:
            db.collection('reports').add({
                "user_id": user_id,
                "created_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
                "filename": file.filename,
                "analysis": result_json
            })

        return result_json
        
    except Exception as e:
        print(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
