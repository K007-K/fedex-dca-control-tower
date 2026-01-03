/**
 * Actor Model Types
 * 
 * Unified actor model for the FedEx DCA Control Tower.
 * Every request must resolve to an Actor (either SYSTEM or HUMAN).
 * 
 * SECURITY PRINCIPLES:
 * - SYSTEM actors are NOT users (no email/password auth)
 * - SYSTEM actors authenticate via service-to-service auth (JWT + secret)
 * - SYSTEM requests are distinguishable from HUMAN requests
 * - All actor types are audit-logged
 */

// ===========================================
// ACTOR TYPE DEFINITIONS
// ===========================================

/**
 * Actor type enum - determines the nature of the request originator
 */
export type ActorType = 'SYSTEM' | 'HUMAN';

/**
 * Source of record creation
 * - SYSTEM: Created by automated process
 * - MANUAL: Created by human user via UI
 */
export type CreatedSource = 'SYSTEM' | 'MANUAL';

// ===========================================
// ACTOR INTERFACES
// ===========================================

/**
 * Base actor interface - unified representation of request originator
 */
export interface Actor {
    /** Type of actor: SYSTEM or HUMAN */
    actor_type: ActorType;

    /** Unique identifier: user_id for HUMAN, service_id for SYSTEM */
    actor_id: string;

    /** User role (null for SYSTEM actors) */
    actor_role: string | null;

    /** Accessible region IDs (null for global access or SYSTEM) */
    region_scope: string[] | null;
}

/**
 * Human actor - authenticated user from UI
 */
export interface HumanActor extends Actor {
    actor_type: 'HUMAN';
    actor_role: string;  // Always has a role
    email: string;
    organization_id: string | null;
    dca_id: string | null;
}

/**
 * System actor - automated service
 */
export interface SystemActor extends Actor {
    actor_type: 'SYSTEM';
    actor_role: null;  // Never has a role
    service_name: string;
    allowed_operations: string[];
    is_active: boolean;
}

// ===========================================
// REQUEST CONTEXT
// ===========================================

/**
 * Request context enriched with actor metadata
 * This is attached to every authenticated request
 */
export interface RequestContext {
    /** The actor making the request */
    actor: Actor;

    /** Source of the request */
    source: CreatedSource;

    /** Unique request identifier for tracing */
    request_id: string;

    /** ISO timestamp of request */
    timestamp: string;

    /** Client IP address */
    ip_address: string;

    /** User agent string */
    user_agent: string;
}

/**
 * Extended request context for SYSTEM actors
 */
export interface SystemRequestContext extends RequestContext {
    actor: SystemActor;
    source: 'SYSTEM';
    service_name: string;
}

/**
 * Extended request context for HUMAN actors
 */
export interface HumanRequestContext extends RequestContext {
    actor: HumanActor;
    source: 'MANUAL';
}

// ===========================================
// TYPE GUARDS
// ===========================================

/**
 * Type guard: Check if actor is SYSTEM
 */
export function isSystemActor(actor: Actor): actor is SystemActor {
    return actor.actor_type === 'SYSTEM';
}

/**
 * Type guard: Check if actor is HUMAN
 */
export function isHumanActor(actor: Actor): actor is HumanActor {
    return actor.actor_type === 'HUMAN';
}

/**
 * Type guard: Check if context is SYSTEM request
 */
export function isSystemRequest(ctx: RequestContext): ctx is SystemRequestContext {
    return ctx.source === 'SYSTEM' && isSystemActor(ctx.actor);
}

/**
 * Type guard: Check if context is HUMAN request
 */
export function isHumanRequest(ctx: RequestContext): ctx is HumanRequestContext {
    return ctx.source === 'MANUAL' && isHumanActor(ctx.actor);
}

// ===========================================
// SERVICE ACTOR DATABASE TYPE
// ===========================================

/**
 * Service actor as stored in database
 */
export interface ServiceActorRecord {
    id: string;
    service_name: string;
    description: string | null;
    is_active: boolean;
    allowed_operations: string[];
    ip_whitelist: string[] | null;
    created_at: string;
    updated_at: string;
    last_used_at: string | null;
}

// ===========================================
// CONSTANTS
// ===========================================

/**
 * Header name for SYSTEM authentication
 */
export const SYSTEM_AUTH_HEADER = 'X-Service-Auth';

/**
 * Header prefix for SYSTEM auth token
 */
export const SYSTEM_AUTH_PREFIX = 'Bearer ';

/**
 * Request ID header (for tracing)
 */
export const REQUEST_ID_HEADER = 'X-Request-Id';

/**
 * Reserved service names that cannot be registered
 */
export const RESERVED_SERVICE_NAMES = [
    'admin',
    'user',
    'human',
    'anonymous',
    'guest',
    'root',
    'system',  // Generic 'system' is reserved; use specific service names
] as const;
