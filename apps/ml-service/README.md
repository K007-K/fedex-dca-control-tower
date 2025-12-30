# ML Service

AI/ML powered insights service for the FedEx DCA Control Tower.

## Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Edit .env with your Supabase credentials
```

## Running

```bash
# Development
uvicorn main:app --reload --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/priority/score` | POST | Calculate case priority score |
| `/api/v1/predict/recovery` | POST | Predict recovery probability |
| `/api/v1/recommend/roe` | POST | Get ROE recommendations |
| `/api/v1/analyze/dca/{id}` | GET | Analyze DCA performance |

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
