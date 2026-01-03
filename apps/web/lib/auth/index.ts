export * from './rbac';
export * from './permissions';
export * from './mfa';
export * from './api-wrapper';
// Actor types are re-exported from api-wrapper, so only export non-duplicates here
export {
    type CreatedSource,
    type ServiceActorRecord,
    isHumanActor,
    isHumanRequest,
    SYSTEM_AUTH_PREFIX,
    RESERVED_SERVICE_NAMES,
} from './actor';
export {
    verifyServiceToken,
    getServiceActor,
    extractServiceToken,
    authenticateSystemRequest,
    generateServiceToken,
    validateIpWhitelist,
    serviceCanPerform,
    type SystemAuthResult,
} from './system-auth';
export {
    isFromBrowser,
    detectSpoofingAttempt,
    logSpoofingAttempt,
    guard,
    recordFailedAttempt,
    isIpBlocked,
    clearFailedAttempts,
    cleanupExpiredRecords,
    type SpoofingCheckResult,
    type GuardResult,
} from './system-guard';

