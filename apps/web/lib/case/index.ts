/**
 * Case Module Index
 * 
 * Exports all case-related services and utilities
 */

export { CaseStateMachine, CaseStateError, CASE_STATUS_TRANSITIONS, CASE_STATUS_METADATA } from './CaseStateMachine';
export type { TransitionValidationResult, TransitionContext } from './CaseStateMachine';

export { CaseActionService, caseActionService } from './CaseActionService';
export type { TimelineEvent, TimelineEventType, TimelineEventCategory, ActionResult, UserContext } from './CaseActionService';

export { BulkCaseOperations, bulkCaseOperations } from './BulkCaseOperations';
export type { BulkOperationResult, BulkStatusChangeInput, BulkAllocationInput } from './BulkCaseOperations';
