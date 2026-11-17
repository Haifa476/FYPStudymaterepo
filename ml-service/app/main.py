"""StudyMate ML service (FastAPI) – 25% build: service skeleton only.

Implemented : GET /health
NOT implemented (planned): POST /predict – risk classification. It returns HTTP 501 so no
caller can mistake a placeholder for a real prediction.

Integration plan (future):
  Express backend --HTTP/JSON--> POST /predict (RiskFeatures) --> RiskPrediction
  The backend stores the result in risk_predictions and shows it on the dashboard.
  If this service is down or slow, the backend keeps working (timeout + graceful fallback).
"""
from fastapi import FastAPI
from fastapi.responses import JSONResponse

from .schemas import RiskFeatures

app = FastAPI(title="StudyMate ML Service", version="0.25.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "studymate-ml", "model_loaded": False}


@app.post("/predict")
def predict(_features: RiskFeatures):
    return JSONResponse(
        status_code=501,
        content={
            "error": "not_implemented",
            "detail": "Risk prediction model has not been trained yet (planned work).",
        },
    )
