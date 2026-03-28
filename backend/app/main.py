import os
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from google import genai
from google.genai import types
import json

app = FastAPI(title="Hemora API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class Metric(BaseModel):
    name: str
    value: float
    unit: str
    min_normal: float
    max_normal: float
    status: str  # "Low", "Normal", "High"

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

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    return {"filename": file.filename, "status": "received"}

@app.post("/api/analyze")
async def analyze_data(file: UploadFile = File(...)):
    try:
        content = await file.read()
        mime_type = file.content_type or "image/jpeg"
        
        prompt = """
        You are Hemora, an AI health assistant.
        Analyze the provided medical report (blood test, etc).
        Extract all the medical metrics you find with their exact values, units, and standard reference ranges. 
        Determine if the status of each is Low, Normal, or High based on the reference range.
        Then, provide 2-3 personalized insights in active voice about what the numbers mean,
        and 2-3 specific, actionable recommendations (real-world action plan).
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
        return json.loads(response.text)
        
    except Exception as e:
        print(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
