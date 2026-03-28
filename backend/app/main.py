from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Hemora API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins, adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    message: str

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok", "message": "Hemora API is running"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    # Stub for future processing
    return {"filename": file.filename, "status": "received"}

@app.post("/api/analyze")
async def analyze_data():
    # Stub for Gemini integration
    return {
        "insights": [
            "Your hemoglobin has steadily declined over 4 months.",
            "Glucose levels are within optimal range."
        ], 
        "recommendations": [
            "Consider a diet rich in iron (spinach, lentils) to address hemoglobin.",
            "Schedule a follow-up test in 3 months."
        ],
        "risk_level": "moderate"
    }
