/**
 * Case Workflow Module
 * 
 * Role-based case status transitions.
 */

export {
    transitionCase,
    getAllowedTransitions,
    isValidCaseStatus,
    isTransitionAllowed,
    CASE_STATES,
    type CaseStatus,
    type TransitionPayload,
    type TransitionResult,
} from './case-workflow';
