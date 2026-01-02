/**
 * Region Module Index
 * 
 * Exports all region-related functionality
 * 
 * @module lib/region
 */

export {
    RegionAssignmentEngine,
    regionAssignmentEngine,
    RegionAssignmentError,
    type GeographyData,
    type Region,
    type CaseCreateInput,
} from './RegionAssignmentEngine';

export {
    DCAAllocationEngine,
    dcaAllocationEngine,
    DCAAllocationError,
    type DCA,
    type RegionDCAAssignment,
    type CaseForAllocation,
    type AllocationResult,
} from './DCAAllocationEngine';

export {
    RegionRBAC,
    regionRBAC,
    type UserWithRegions,
    type RegionAccess,
    type AccessCheckResult,
} from './RegionRBAC';
