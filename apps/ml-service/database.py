"""
Database connection module for ML Service
P0-4 FIX: Enables fetching real data from Supabase
"""
import os
from typing import Optional, List, Dict, Any
from functools import lru_cache

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    print("Warning: supabase package not installed. Run: pip install supabase")

from config import SUPABASE_URL, SUPABASE_KEY


_supabase_client: Optional[Any] = None


def get_supabase_client() -> Optional[Any]:
    """Get or create Supabase client singleton"""
    global _supabase_client
    
    if not SUPABASE_AVAILABLE:
        return None
        
    if _supabase_client is not None:
        return _supabase_client
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Warning: Supabase credentials not configured")
        return None
    
    try:
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        return _supabase_client
    except Exception as e:
        print(f"Error creating Supabase client: {e}")
        return None


async def fetch_dcas(active_only: bool = True) -> List[Dict[str, Any]]:
    """Fetch DCAs from database"""
    client = get_supabase_client()
    
    if not client:
        return []
    
    try:
        query = client.table('dcas').select('*')
        
        if active_only:
            query = query.eq('status', 'ACTIVE')
        
        response = query.execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching DCAs: {e}")
        return []


async def fetch_dca_by_id(dca_id: str) -> Optional[Dict[str, Any]]:
    """Fetch a single DCA by ID"""
    client = get_supabase_client()
    
    if not client:
        return None
    
    try:
        response = client.table('dcas').select('*').eq('id', dca_id).single().execute()
        return response.data
    except Exception as e:
        print(f"Error fetching DCA {dca_id}: {e}")
        return None


async def fetch_dca_performance_metrics(dca_id: str, period_days: int = 30) -> Dict[str, Any]:
    """
    Fetch real performance metrics for a DCA from database
    Aggregates from cases and sla_logs tables
    """
    client = get_supabase_client()
    
    if not client:
        return {}
    
    try:
        # Get DCA basic info
        dca = await fetch_dca_by_id(dca_id)
        if not dca:
            return {}
        
        # Get cases assigned to this DCA
        from datetime import datetime, timedelta
        start_date = (datetime.utcnow() - timedelta(days=period_days)).isoformat()
        
        cases_response = client.table('cases').select(
            'id, status, outstanding_amount, recovered_amount, created_at'
        ).eq('assigned_dca_id', dca_id).gte('created_at', start_date).execute()
        
        cases = cases_response.data or []
        
        # Calculate metrics
        total_cases = len(cases)
        total_outstanding = sum(c.get('outstanding_amount', 0) or 0 for c in cases)
        total_recovered = sum(c.get('recovered_amount', 0) or 0 for c in cases)
        
        # Recovery rate
        recovery_rate = 0.0
        if total_outstanding + total_recovered > 0:
            recovery_rate = total_recovered / (total_outstanding + total_recovered)
        
        # Get SLA compliance from sla_logs
        case_ids = [c['id'] for c in cases]
        if case_ids:
            sla_response = client.table('sla_logs').select(
                'status'
            ).in_('case_id', case_ids).execute()
            
            sla_logs = sla_response.data or []
            sla_met = len([s for s in sla_logs if s.get('status') == 'MET'])
            sla_total = len(sla_logs)
            sla_compliance = sla_met / sla_total if sla_total > 0 else 1.0
        else:
            sla_compliance = 1.0
        
        # Use DCA's stored metrics as well
        return {
            "name": dca.get('name', f'DCA {dca_id[:8]}'),
            "code": dca.get('code', ''),
            "recovery_rate": dca.get('recovery_rate', recovery_rate) or recovery_rate,
            "sla_compliance": sla_compliance,
            "performance_score": dca.get('performance_score', 0),
            "cases_handled": total_cases,
            "total_outstanding": total_outstanding,
            "total_recovered": total_recovered,
            "capacity_used": dca.get('capacity_used', 0),
            "capacity_limit": dca.get('capacity_limit', 0),
            "status": dca.get('status', 'UNKNOWN'),
        }
    except Exception as e:
        print(f"Error fetching DCA metrics: {e}")
        return {}


async def fetch_cases_for_dca_matching(
    segment: Optional[str] = None,
    min_amount: float = 0,
    max_amount: float = float('inf')
) -> List[Dict[str, Any]]:
    """Fetch cases for DCA matching algorithm"""
    client = get_supabase_client()
    
    if not client:
        return []
    
    try:
        query = client.table('cases').select(
            'id, case_number, customer_name, customer_segment, outstanding_amount, priority, status'
        ).eq('status', 'PENDING_ALLOCATION')
        
        if segment:
            query = query.eq('customer_segment', segment)
        
        if min_amount > 0:
            query = query.gte('outstanding_amount', min_amount)
        
        if max_amount < float('inf'):
            query = query.lte('outstanding_amount', max_amount)
        
        response = query.execute()
        return response.data or []
    except Exception as e:
        print(f"Error fetching cases: {e}")
        return []


def is_database_available() -> bool:
    """Check if database connection is available"""
    return get_supabase_client() is not None
