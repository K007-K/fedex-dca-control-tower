"""
ROE (Return on Effort) Recommendations API
P0-4 FIX: Now fetches real DCA data from database instead of hardcoded mock data
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from database import fetch_dcas, is_database_available

router = APIRouter()


class ROERequest(BaseModel):
    """Request model for ROE recommendations"""
    case_id: Optional[str] = None
    outstanding_amount: float = Field(ge=0)
    days_past_due: int = Field(ge=0)
    segment: str = Field(default="MEDIUM")
    industry: Optional[str] = None
    priority_score: Optional[int] = Field(default=50, ge=0, le=100)
    use_database: bool = Field(default=True, description="If true, fetch DCAs from database")


class DCAMatch(BaseModel):
    """DCA matching recommendation"""
    dca_id: str
    dca_name: str
    match_score: float
    match_reasons: List[str]
    expected_recovery_rate: float
    data_source: str  # "database" or "fallback"


class ActionItem(BaseModel):
    """Recommended action"""
    action: str
    priority: str
    timeline: str
    expected_impact: str


class ROEResponse(BaseModel):
    """Response model for ROE recommendations"""
    case_id: Optional[str]
    roe_score: float
    recommended_dcas: List[DCAMatch]
    recommended_actions: List[ActionItem]
    escalation_timeline: str
    optimal_strategy: str
    data_source: str  # "database" or "fallback"


# Fallback DCA data only used when database is unavailable
FALLBACK_DCAS = [
    {
        "id": "fallback-1",
        "name": "Default DCA (Database Unavailable)",
        "specialties": ["MEDIUM"],
        "recovery_rate": 0.65,
        "capacity_available": 100,
        "min_amount": 1000
    },
]


def convert_db_dca_to_match_format(dca: dict) -> dict:
    """Convert database DCA record to matching format"""
    # Determine specialties from DCA properties
    specialties = []
    
    # Parse from notes or use defaults based on capacity/performance
    capacity_limit = dca.get("capacity_limit", 100)
    recovery_rate = dca.get("recovery_rate", 0.5)
    
    if capacity_limit >= 200:
        specialties.extend(["SMALL", "MICRO", "HIGH_VOLUME"])
    elif capacity_limit >= 50:
        specialties.extend(["MEDIUM", "SMALL"])
    else:
        specialties.extend(["ENTERPRISE", "LARGE"])
    
    if recovery_rate >= 0.75:
        specialties.append("HIGH_VALUE")
    
    capacity_used = dca.get("capacity_used", 0)
    capacity_available = capacity_limit - capacity_used
    
    return {
        "id": dca.get("id", ""),
        "name": dca.get("name", "Unknown DCA"),
        "specialties": specialties,
        "recovery_rate": recovery_rate,
        "capacity_available": max(0, capacity_available),
        "min_amount": 1000,  # Default, could be stored in DCA metadata
        "performance_score": dca.get("performance_score", 50),
    }


def match_dca_to_case(
    dca: dict,
    segment: str,
    amount: float,
    days: int,
    priority: int
) -> tuple:
    """Calculate DCA match score and reasons"""
    score = 50  # Base score
    reasons = []
    
    # Segment match
    if segment.upper() in dca.get("specialties", []):
        score += 25
        reasons.append(f"Specializes in {segment} segment")
    
    # Amount fit
    if amount >= dca.get("min_amount", 0):
        score += 10
        reasons.append("Amount within DCA's target range")
    else:
        score -= 10
        reasons.append("Amount below DCA's preferred minimum")
    
    # Capacity
    capacity = dca.get("capacity_available", 0)
    if capacity > 20:
        score += 10
        reasons.append(f"Has available capacity ({capacity} slots)")
    elif capacity > 0:
        score += 5
        reasons.append("Limited capacity available")
    else:
        score -= 15
        reasons.append("No capacity available")
    
    # Priority match (high priority to high-performing DCAs)
    if priority >= 70 and dca.get("recovery_rate", 0) >= 0.75:
        score += 15
        reasons.append("High performer for high-priority cases")
    
    # Performance score bonus
    perf_score = dca.get("performance_score", 50)
    if perf_score >= 80:
        score += 10
        reasons.append(f"Top performer (score: {perf_score})")
    elif perf_score >= 60:
        score += 5
        reasons.append(f"Above average performer (score: {perf_score})")
    
    # Age consideration
    if days > 90 and "LEGAL" in dca.get("specialties", []):
        score += 10
        reasons.append("Legal capability for aged cases")
    
    return min(100, max(0, score)), reasons


def generate_actions(
    amount: float, days: int, priority: int, segment: str
) -> List[ActionItem]:
    """Generate recommended actions based on case characteristics"""
    actions = []
    
    # Immediate action based on priority
    if priority >= 80:
        actions.append(ActionItem(
            action="Immediate phone contact with decision maker",
            priority="CRITICAL",
            timeline="Within 24 hours",
            expected_impact="40% higher response rate"
        ))
    elif priority >= 60:
        actions.append(ActionItem(
            action="Send formal demand letter with payment options",
            priority="HIGH",
            timeline="Within 48 hours",
            expected_impact="25% payment initiation rate"
        ))
    
    # Amount-based actions
    if amount >= 50000:
        actions.append(ActionItem(
            action="Propose structured settlement plan",
            priority="HIGH",
            timeline="Within first week",
            expected_impact="Higher recovery on large amounts"
        ))
    
    # Age-based actions
    if days >= 60:
        actions.append(ActionItem(
            action="Escalate with final notice before legal action",
            priority="MEDIUM",
            timeline="Week 2",
            expected_impact="Creates urgency for payment"
        ))
    
    if days >= 90:
        actions.append(ActionItem(
            action="Review for legal proceedings or agency transfer",
            priority="HIGH",
            timeline="Week 3",
            expected_impact="May require legal intervention"
        ))
    
    # Standard action
    actions.append(ActionItem(
        action="Implement automated reminder sequence",
        priority="STANDARD",
        timeline="Ongoing",
        expected_impact="Maintains collection pressure"
    ))
    
    return actions


def get_optimal_strategy(priority: int, amount: float, segment: str) -> str:
    """Determine optimal collection strategy"""
    if priority >= 80 and amount >= 10000:
        return "Executive Escalation: High-touch personal attention with senior decision-maker engagement"
    elif priority >= 60:
        return "Intensive Collection: Frequent contact with payment plan negotiation focus"
    elif segment.upper() in ["ENTERPRISE", "LARGE"]:
        return "Relationship Preservation: Maintain business relationship while pursuing payment"
    else:
        return "Standard Collection: Systematic follow-up with automated reminders"


def get_escalation_timeline(days: int, priority: int) -> str:
    """Determine escalation timeline"""
    if priority >= 80:
        return "Immediate escalation required - already critical"
    elif days >= 90:
        return "Escalate now - case is aging beyond optimal recovery window"
    elif days >= 60:
        return "Escalate in 15 days if no payment progress"
    elif days >= 30:
        return "Escalate in 30 days if no payment progress"
    else:
        return "Standard 45-day escalation timeline"


@router.post("/recommend/roe", response_model=ROEResponse)
async def recommend_roe(request: ROERequest):
    """
    Generate ROE (Return on Effort) recommendations for a case.
    
    P0-4 FIX: Now fetches real DCA data from database.
    
    Includes:
    - Optimal DCA matching based on real DCA data
    - Recommended actions with timeline
    - Escalation strategy
    """
    try:
        data_source = "fallback"
        dcas_to_match = []
        
        # P0-4 FIX: Fetch real DCAs from database
        if request.use_database and is_database_available():
            db_dcas = await fetch_dcas(active_only=True)
            if db_dcas:
                dcas_to_match = [convert_db_dca_to_match_format(d) for d in db_dcas]
                data_source = "database"
        
        # Fallback to default if no database DCAs
        if not dcas_to_match:
            dcas_to_match = FALLBACK_DCAS
            data_source = "fallback"
        
        # Match DCAs
        dca_matches = []
        for dca in dcas_to_match:
            score, reasons = match_dca_to_case(
                dca,
                request.segment,
                request.outstanding_amount,
                request.days_past_due,
                request.priority_score or 50
            )
            dca_matches.append(DCAMatch(
                dca_id=dca.get("id", ""),
                dca_name=dca.get("name", "Unknown"),
                match_score=score,
                match_reasons=reasons,
                expected_recovery_rate=dca.get("recovery_rate", 0.5) * 100,
                data_source=data_source
            ))
        
        # Sort by match score
        dca_matches.sort(key=lambda x: x.match_score, reverse=True)
        
        # Generate actions
        actions = generate_actions(
            request.outstanding_amount,
            request.days_past_due,
            request.priority_score or 50,
            request.segment
        )
        
        # Calculate ROE score
        roe_base = 50
        if dca_matches and dca_matches[0].match_score >= 70:
            roe_base += 20
        if request.days_past_due <= 60:
            roe_base += 15
        if request.outstanding_amount >= 5000:
            roe_base += 15
        roe_score = min(100, roe_base)
        
        return ROEResponse(
            case_id=request.case_id,
            roe_score=roe_score,
            recommended_dcas=dca_matches[:3],  # Top 3 matches
            recommended_actions=actions,
            escalation_timeline=get_escalation_timeline(
                request.days_past_due,
                request.priority_score or 50
            ),
            optimal_strategy=get_optimal_strategy(
                request.priority_score or 50,
                request.outstanding_amount,
                request.segment
            ),
            data_source=data_source
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommend/dcas")
async def get_available_dcas():
    """
    Get list of available DCAs for assignment.
    P0-4 FIX: Returns real DCAs from database.
    """
    if is_database_available():
        dcas = await fetch_dcas(active_only=True)
        return {
            "dcas": dcas,
            "count": len(dcas),
            "data_source": "database"
        }
    else:
        return {
            "dcas": [],
            "count": 0,
            "data_source": "unavailable",
            "message": "Database not connected. Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        }
