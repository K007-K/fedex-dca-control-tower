"""
Priority Scoring API
Calculates case priority scores based on multiple factors
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import math

from config import PRIORITY_WEIGHTS, SEGMENT_SCORES

router = APIRouter()


class PriorityRequest(BaseModel):
    """Request model for priority scoring"""
    case_id: Optional[str] = None
    outstanding_amount: float = Field(ge=0)
    days_past_due: int = Field(ge=0)
    segment: str = Field(default="MEDIUM")
    payment_history_score: Optional[float] = Field(default=50, ge=0, le=100)


class PriorityFactor(BaseModel):
    """Individual factor contribution"""
    factor: str
    score: float
    weight: float
    contribution: float


class PriorityResponse(BaseModel):
    """Response model for priority scoring"""
    case_id: Optional[str]
    priority_score: int
    risk_level: str
    factors: List[PriorityFactor]
    recommendation: str


def calculate_amount_score(amount: float) -> float:
    """Score based on outstanding amount (log scale)"""
    if amount <= 0:
        return 0
    # Log scale: $1000 = 50, $10000 = 75, $100000 = 100
    score = min(100, 25 * math.log10(max(amount, 1)) - 25)
    return max(0, score)


def calculate_days_score(days: int) -> float:
    """Score based on days past due"""
    if days <= 0:
        return 0
    elif days <= 30:
        return days * 2  # 0-60
    elif days <= 60:
        return 60 + (days - 30)  # 60-90
    elif days <= 90:
        return 90 + (days - 60) * 0.33  # 90-100
    else:
        return 100


def calculate_segment_score(segment: str) -> float:
    """Score based on customer segment"""
    return SEGMENT_SCORES.get(segment.upper(), 50)


def get_risk_level(score: int) -> str:
    """Determine risk level from score"""
    if score >= 80:
        return "CRITICAL"
    elif score >= 60:
        return "HIGH"
    elif score >= 40:
        return "MEDIUM"
    elif score >= 20:
        return "LOW"
    else:
        return "MINIMAL"


def get_recommendation(score: int, days: int) -> str:
    """Generate recommendation based on priority"""
    if score >= 80:
        return "Immediate escalation required. Assign to top-performing DCA with legal capability."
    elif score >= 60:
        return "High priority case. Assign to experienced DCA with aggressive collection strategy."
    elif score >= 40:
        return "Standard collection process. Monitor for payment plan compliance."
    elif score >= 20:
        return "Low risk. Automated reminders may be sufficient."
    else:
        return "Minimal intervention needed. Continue standard follow-up."


@router.post("/priority/score", response_model=PriorityResponse)
async def calculate_priority(request: PriorityRequest):
    """
    Calculate priority score for a case based on multiple factors.
    
    The priority score (0-100) is calculated using:
    - Outstanding amount (35% weight)
    - Days past due (30% weight)  
    - Customer segment (20% weight)
    - Payment history (15% weight)
    """
    try:
        # Calculate individual factor scores
        amount_score = calculate_amount_score(request.outstanding_amount)
        days_score = calculate_days_score(request.days_past_due)
        segment_score = calculate_segment_score(request.segment)
        history_score = 100 - (request.payment_history_score or 50)  # Inverse: bad history = high priority
        
        # Apply weights
        factors = [
            PriorityFactor(
                factor="Outstanding Amount",
                score=round(amount_score, 1),
                weight=PRIORITY_WEIGHTS["amount"],
                contribution=round(amount_score * PRIORITY_WEIGHTS["amount"], 1)
            ),
            PriorityFactor(
                factor="Days Past Due",
                score=round(days_score, 1),
                weight=PRIORITY_WEIGHTS["days_past_due"],
                contribution=round(days_score * PRIORITY_WEIGHTS["days_past_due"], 1)
            ),
            PriorityFactor(
                factor="Customer Segment",
                score=round(segment_score, 1),
                weight=PRIORITY_WEIGHTS["segment"],
                contribution=round(segment_score * PRIORITY_WEIGHTS["segment"], 1)
            ),
            PriorityFactor(
                factor="Payment History Risk",
                score=round(history_score, 1),
                weight=PRIORITY_WEIGHTS["history"],
                contribution=round(history_score * PRIORITY_WEIGHTS["history"], 1)
            ),
        ]
        
        # Calculate total weighted score
        total_score = sum(f.contribution for f in factors)
        priority_score = min(100, max(0, int(total_score)))
        
        return PriorityResponse(
            case_id=request.case_id,
            priority_score=priority_score,
            risk_level=get_risk_level(priority_score),
            factors=factors,
            recommendation=get_recommendation(priority_score, request.days_past_due)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/priority/batch")
async def calculate_priority_batch(cases: List[PriorityRequest]):
    """Calculate priority scores for multiple cases"""
    results = []
    for case in cases:
        result = await calculate_priority(case)
        results.append(result)
    return {"results": results, "count": len(results)}
