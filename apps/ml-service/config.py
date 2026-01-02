"""
ML Service Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Supabase Configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

# API Configuration
API_PREFIX = "/api/v1"
CORS_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    # Production URLs
    "https://fedex-dca-control-tower.vercel.app",
    "https://*.vercel.app",
    "*",  # Allow all origins for API access
]

# ML Configuration
PRIORITY_WEIGHTS = {
    "amount": 0.35,
    "days_past_due": 0.30,
    "segment": 0.20,
    "history": 0.15,
}

SEGMENT_SCORES = {
    "ENTERPRISE": 100,
    "LARGE": 80,
    "MEDIUM": 60,
    "SMALL": 40,
    "MICRO": 20,
}

RECOVERY_BASE_RATES = {
    "0-30": 0.85,
    "31-60": 0.70,
    "61-90": 0.55,
    "91-180": 0.35,
    "180+": 0.15,
}
