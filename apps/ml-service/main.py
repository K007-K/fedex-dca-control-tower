"""
FedEx DCA Control Tower - ML Service
FastAPI application for AI/ML predictions and recommendations
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import API_PREFIX, CORS_ORIGINS
from routers import priority, prediction, roe, dca_analysis

app = FastAPI(
    title="FedEx DCA Control Tower - ML Service",
    description="AI/ML powered insights for debt collection optimization",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(priority.router, prefix=API_PREFIX, tags=["Priority Scoring"])
app.include_router(prediction.router, prefix=API_PREFIX, tags=["Recovery Prediction"])
app.include_router(roe.router, prefix=API_PREFIX, tags=["ROE Recommendations"])
app.include_router(dca_analysis.router, prefix=API_PREFIX, tags=["DCA Analysis"])


@app.get("/")
async def root():
    return {
        "service": "FedEx DCA Control Tower ML Service",
        "status": "healthy",
        "version": "1.0.0",
        "endpoints": {
            "priority_scoring": f"{API_PREFIX}/priority/score",
            "recovery_prediction": f"{API_PREFIX}/predict/recovery",
            "roe_recommendations": f"{API_PREFIX}/recommend/roe",
            "dca_analysis": f"{API_PREFIX}/analyze/dca/{{dca_id}}",
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
