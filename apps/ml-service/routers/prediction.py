"""
Recovery Prediction API
Predicts recovery probability and timeline for cases
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timedelta

from config import RECOVERY_BASE_RATES

router = APIRouter()


class RecoveryRequest(BaseModel):
    """Request model for recovery prediction"""
    case_id: Optional[str] = None
    outstanding_amount: float = Field(ge=0)
    days_past_due: int = Field(ge=0)
    segment: str = Field(default="MEDIUM")
    dca_recovery_rate: Optional[float] = Field(default=0.65, ge=0, le=1)
    previous_payments: int = Field(default=0, ge=0)


class RecoveryPrediction(BaseModel):
    """Response model for recovery prediction"""
    case_id: Optional[str]
    recovery_probability: float
    expected_recovery_amount: float
    expected_timeline_days: int
    confidence_level: str
    risk_factors: List[str]
    positive_factors: List[str]
    recommended_strategy: str


def get_age_bracket(days: int) -> str:
    """Get age bracket for recovery rate lookup"""
    if days <= 30:
        return "0-30"
    elif days <= 60:
        return "31-60"
    elif days <= 90:
        return "61-90"
    elif days <= 180:
        return "91-180"
    else:
        return "180+"


def calculate_recovery_probability(
    days_past_due: int,
    segment: str,
    dca_rate: float,
    previous_payments: int
) -> float:
    """Calculate recovery probability using multiple factors"""
    # Base rate from age bracket
    bracket = get_age_bracket(days_past_due)
    base_rate = RECOVERY_BASE_RATES[bracket]
    
    # Segment modifier
    segment_modifiers = {
        "ENTERPRISE": 1.2,
        "LARGE": 1.1,
        "MEDIUM": 1.0,
        "SMALL": 0.9,
        "MICRO": 0.8,
    }
    segment_mod = segment_modifiers.get(segment.upper(), 1.0)
    
    # DCA performance modifier
    dca_mod = 0.7 + (dca_rate * 0.6)  # Range: 0.7 to 1.3
    
    # Payment history modifier
    if previous_payments >= 3:
        history_mod = 1.2
    elif previous_payments >= 1:
        history_mod = 1.1
    else:
        history_mod = 1.0
    
    # Calculate final probability
    probability = base_rate * segment_mod * dca_mod * history_mod
    return min(0.95, max(0.05, probability))


def calculate_timeline(days_past_due: int, probability: float) -> int:
    """Estimate days to recovery"""
    if probability >= 0.8:
        return 15 + (days_past_due // 10)
    elif probability >= 0.6:
        return 30 + (days_past_due // 5)
    elif probability >= 0.4:
        return 60 + (days_past_due // 3)
    else:
        return 90 + days_past_due


def get_confidence_level(probability: float, days: int) -> str:
    """Determine confidence in prediction"""
    if days <= 60 and probability >= 0.6:
        return "HIGH"
    elif days <= 120 or probability >= 0.4:
        return "MEDIUM"
    else:
        return "LOW"


def identify_factors(
    days: int, segment: str, dca_rate: float, payments: int
) -> tuple:
    """Identify risk and positive factors"""
    risk_factors = []
    positive_factors = []
    
    # Days analysis
    if days > 180:
        risk_factors.append("Case is significantly aged (180+ days)")
    elif days > 90:
        risk_factors.append("Case is aging (90+ days)")
    elif days <= 30:
        positive_factors.append("Recent case with high recovery potential")
    
    # Segment analysis
    if segment.upper() in ["ENTERPRISE", "LARGE"]:
        positive_factors.append(f"{segment} customer - higher recovery likelihood")
    elif segment.upper() in ["MICRO", "SMALL"]:
        risk_factors.append(f"{segment} customer - may have limited payment capacity")
    
    # DCA analysis
    if dca_rate >= 0.7:
        positive_factors.append("Assigned to high-performing DCA")
    elif dca_rate < 0.5:
        risk_factors.append("DCA has below-average recovery rate")
    
    # Payment history
    if payments >= 2:
        positive_factors.append("Customer has made recent payments")
    elif payments == 0:
        risk_factors.append("No payment history on this case")
    
    return risk_factors, positive_factors


def get_strategy(probability: float, days: int, segment: str) -> str:
    """Recommend collection strategy"""
    if probability >= 0.7:
        return "Standard collection with payment plan offering"
    elif probability >= 0.5:
        if segment.upper() in ["ENTERPRISE", "LARGE"]:
            return "Relationship-based approach with executive escalation option"
        return "Intensified collection with settlement negotiation"
    elif probability >= 0.3:
        return "Aggressive collection strategy with legal notice consideration"
    else:
        return "Evaluate for write-off or sale to specialized agency"


@router.post("/predict/recovery", response_model=RecoveryPrediction)
async def predict_recovery(request: RecoveryRequest):
    """
    Predict recovery probability for a case.
    
    Uses historical patterns and case characteristics to estimate:
    - Recovery probability (0-100%)
    - Expected recovery amount
    - Timeline to recovery
    """
    try:
        # Calculate probability
        probability = calculate_recovery_probability(
            request.days_past_due,
            request.segment,
            request.dca_recovery_rate or 0.65,
            request.previous_payments
        )
        
        # Calculate expected amount
        expected_amount = request.outstanding_amount * probability
        
        # Calculate timeline
        timeline = calculate_timeline(request.days_past_due, probability)
        
        # Get factors
        risk_factors, positive_factors = identify_factors(
            request.days_past_due,
            request.segment,
            request.dca_recovery_rate or 0.65,
            request.previous_payments
        )
        
        return RecoveryPrediction(
            case_id=request.case_id,
            recovery_probability=round(probability * 100, 1),
            expected_recovery_amount=round(expected_amount, 2),
            expected_timeline_days=timeline,
            confidence_level=get_confidence_level(probability, request.days_past_due),
            risk_factors=risk_factors,
            positive_factors=positive_factors,
            recommended_strategy=get_strategy(
                probability, request.days_past_due, request.segment
            )
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/predict/batch")
async def predict_recovery_batch(cases: List[RecoveryRequest]):
    """Predict recovery for multiple cases"""
    results = []
    for case in cases:
        result = await predict_recovery(case)
        results.append(result)
    
    # Calculate aggregates
    total_outstanding = sum(c.outstanding_amount for c in cases)
    total_expected = sum(r.expected_recovery_amount for r in results)
    avg_probability = sum(r.recovery_probability for r in results) / len(results)
    
    return {
        "results": results,
        "count": len(results),
        "summary": {
            "total_outstanding": round(total_outstanding, 2),
            "total_expected_recovery": round(total_expected, 2),
            "average_recovery_probability": round(avg_probability, 1),
        }
    }
