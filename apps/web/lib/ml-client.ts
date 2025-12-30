/**
 * ML Service API Client
 * Connects to the FastAPI ML service for AI-powered insights
 */

const ML_SERVICE_URL = process.env.NEXT_PUBLIC_ML_SERVICE_URL || 'http://localhost:8000';

export interface PriorityScoreRequest {
    case_id?: string;
    outstanding_amount: number;
    days_past_due: number;
    segment: string;
    payment_history_score?: number;
}

export interface PriorityFactor {
    factor: string;
    score: number;
    weight: number;
    contribution: number;
}

export interface PriorityScoreResponse {
    case_id: string | null;
    priority_score: number;
    risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
    factors: PriorityFactor[];
    recommendation: string;
}

export interface RecoveryPredictionRequest {
    case_id?: string;
    outstanding_amount: number;
    days_past_due: number;
    segment: string;
    dca_recovery_rate?: number;
    previous_payments?: number;
}

export interface RecoveryPredictionResponse {
    case_id: string | null;
    recovery_probability: number;
    expected_recovery_amount: number;
    expected_timeline_days: number;
    confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
    risk_factors: string[];
    positive_factors: string[];
    recommended_strategy: string;
}

export interface ROERequest {
    case_id?: string;
    outstanding_amount: number;
    days_past_due: number;
    segment: string;
    priority_score?: number;
}

export interface DCAMatch {
    dca_id: string;
    dca_name: string;
    match_score: number;
    match_reasons: string[];
    expected_recovery_rate: number;
}

export interface ActionItem {
    action: string;
    priority: string;
    timeline: string;
    expected_impact: string;
}

export interface ROEResponse {
    case_id: string | null;
    roe_score: number;
    recommended_dcas: DCAMatch[];
    recommended_actions: ActionItem[];
    escalation_timeline: string;
    optimal_strategy: string;
}

export interface DCAAnalysisResponse {
    dca_id: string;
    dca_name: string;
    overall_score: number;
    performance_grade: string;
    strengths: string[];
    weaknesses: string[];
}

class MLClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = ML_SERVICE_URL;
    }

    async getPriorityScore(request: PriorityScoreRequest): Promise<PriorityScoreResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/priority/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        if (!response.ok) throw new Error('Failed to get priority score');
        return response.json();
    }

    async getRecoveryPrediction(request: RecoveryPredictionRequest): Promise<RecoveryPredictionResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/predict/recovery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        if (!response.ok) throw new Error('Failed to get recovery prediction');
        return response.json();
    }

    async getROERecommendations(request: ROERequest): Promise<ROEResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/recommend/roe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });
        if (!response.ok) throw new Error('Failed to get ROE recommendations');
        return response.json();
    }

    async analyzeDCA(dcaId: string): Promise<DCAAnalysisResponse> {
        const response = await fetch(`${this.baseUrl}/api/v1/analyze/dca/${dcaId}`);
        if (!response.ok) throw new Error('Failed to analyze DCA');
        return response.json();
    }

    async healthCheck(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return response.ok;
        } catch {
            return false;
        }
    }
}

export const mlClient = new MLClient();
