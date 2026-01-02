/**
 * Region Assignment Engine
 * 
 * Enterprise-grade auto-assignment of regions based on customer geography.
 * This engine resolves the appropriate region for a case based on:
 * 1. Customer billing address
 * 2. Account master geography
 * 3. Shipment origin/destination (future integration)
 * 
 * @module lib/region/RegionAssignmentEngine
 */

import { createClient } from '@/lib/supabase/server';

// ===========================================
// TYPES
// ===========================================

export interface GeographyData {
    country: string;       // ISO 3166-1 alpha-2: 'IN', 'US'
    state?: string;        // State/province code: 'MH', 'CA'
    city?: string;         // City name
    postalCode?: string;   // Postal/ZIP code
}

export interface Region {
    id: string;
    region_code: string;
    name: string;
    default_currency: string;
    timezone: string;
    escalation_matrix_id?: string;
    default_sla_template_id?: string;
}

export interface GeographyRule {
    id: string;
    region_id: string;
    rule_name: string;
    country_code: string | null;
    state_code: string | null;
    city_pattern: string | null;
    postal_code_pattern: string | null;
    priority: number;
    region?: Region;
}

export interface CustomerContact {
    address?: {
        country?: string;
        state?: string;
        city?: string;
        postal_code?: string;
        street?: string;
    };
    country?: string;
    state?: string;
    city?: string;
    postal_code?: string;
}

export interface CaseCreateInput {
    customer_contact?: CustomerContact;
    customer_country?: string;
    customer_state?: string;
    customer_city?: string;
}

export class RegionAssignmentError extends Error {
    constructor(message: string, public readonly code: string = 'REGION_ASSIGNMENT_FAILED') {
        super(message);
        this.name = 'RegionAssignmentError';
    }
}

// ===========================================
// REGION ASSIGNMENT ENGINE
// ===========================================

export class RegionAssignmentEngine {

    /**
     * Assigns region based on authoritative geography data.
     * Priority: Customer billing address > Account geography > Default
     * 
     * @param caseData - Case creation input with customer information
     * @returns Resolved region
     * @throws RegionAssignmentError if no matching region found
     */
    async assignRegion(caseData: CaseCreateInput): Promise<Region> {
        // 1. Extract geography from case data
        const geography = this.extractGeography(caseData);

        if (!geography.country) {
            throw new RegionAssignmentError(
                'Cannot assign region: No country information provided',
                'MISSING_COUNTRY'
            );
        }

        // 2. Find matching region based on geography rules
        const region = await this.resolveRegion(geography);

        if (!region) {
            throw new RegionAssignmentError(
                `No matching region found for country: ${geography.country}`,
                'NO_MATCHING_REGION'
            );
        }

        return region;
    }

    /**
     * Resolves region from geography data using configurable rules.
     */
    async resolveRegion(geography: GeographyData): Promise<Region | null> {
        const supabase = await createClient();

        // Query geography rules ordered by specificity and priority
        const { data: rules, error } = await supabase
            .from('geography_region_rules')
            .select(`
                *,
                region:regions(*)
            `)
            .eq('is_active', true)
            .order('priority', { ascending: true });

        if (error) {
            console.error('Failed to fetch geography rules:', error);
            return null;
        }

        // Find best matching rule
        const matchingRule = this.findBestMatch(rules as GeographyRule[], geography);

        return matchingRule?.region || null;
    }

    /**
     * Gets all active regions.
     */
    async getAllRegions(): Promise<Region[]> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('regions')
            .select('*')
            .eq('status', 'ACTIVE')
            .is('deleted_at', null)
            .order('name');

        if (error) {
            console.error('Failed to fetch regions:', error);
            return [];
        }

        return data || [];
    }

    /**
     * Gets a region by ID.
     */
    async getRegionById(regionId: string): Promise<Region | null> {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('regions')
            .select('*')
            .eq('id', regionId)
            .single();

        if (error) {
            console.error('Failed to fetch region:', error);
            return null;
        }

        return data;
    }

    /**
     * Extracts geography data from case input.
     * Handles multiple possible data structures.
     */
    private extractGeography(caseData: CaseCreateInput): GeographyData {
        const contact = caseData.customer_contact;

        // Try to extract from nested address object
        if (contact?.address) {
            return {
                country: contact.address.country || caseData.customer_country || '',
                state: contact.address.state || caseData.customer_state,
                city: contact.address.city || caseData.customer_city,
                postalCode: contact.address.postal_code,
            };
        }

        // Try flat structure in customer_contact
        if (contact) {
            return {
                country: contact.country || caseData.customer_country || '',
                state: contact.state || caseData.customer_state,
                city: contact.city || caseData.customer_city,
                postalCode: contact.postal_code,
            };
        }

        // Fallback to direct case fields
        return {
            country: caseData.customer_country || '',
            state: caseData.customer_state,
            city: caseData.customer_city,
        };
    }

    /**
     * Finds the best matching rule using specificity scoring.
     * More specific rules (with more matching criteria) win.
     */
    private findBestMatch(rules: GeographyRule[], geography: GeographyData): GeographyRule | null {
        // Score each rule based on how many criteria match
        const scoredRules = rules
            .filter(rule => this.ruleMatches(rule, geography))
            .map(rule => ({
                rule,
                score: this.calculateMatchScore(rule, geography),
            }))
            .sort((a, b) => {
                // Higher score wins, then lower priority wins
                if (b.score !== a.score) return b.score - a.score;
                return a.rule.priority - b.rule.priority;
            });

        return scoredRules[0]?.rule || null;
    }

    /**
     * Checks if a rule matches the given geography.
     */
    private ruleMatches(rule: GeographyRule, geography: GeographyData): boolean {
        // Country must match if specified
        if (rule.country_code && rule.country_code !== geography.country) {
            return false;
        }

        // State must match if specified
        if (rule.state_code && rule.state_code !== geography.state) {
            return false;
        }

        // City pattern must match if specified
        if (rule.city_pattern && geography.city) {
            const pattern = rule.city_pattern.replace(/%/g, '.*');
            const regex = new RegExp(pattern, 'i');
            if (!regex.test(geography.city)) {
                return false;
            }
        }

        // Postal code pattern must match if specified
        if (rule.postal_code_pattern && geography.postalCode) {
            const pattern = rule.postal_code_pattern.replace(/%/g, '.*');
            const regex = new RegExp(pattern, 'i');
            if (!regex.test(geography.postalCode)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Calculates specificity score for a rule match.
     * More specific matches get higher scores.
     */
    private calculateMatchScore(rule: GeographyRule, geography: GeographyData): number {
        let score = 0;

        // Country match: +10 points
        if (rule.country_code && rule.country_code === geography.country) {
            score += 10;
        }

        // State match: +20 points (more specific)
        if (rule.state_code && rule.state_code === geography.state) {
            score += 20;
        }

        // City pattern match: +30 points
        if (rule.city_pattern && geography.city) {
            score += 30;
        }

        // Postal code match: +40 points (most specific)
        if (rule.postal_code_pattern && geography.postalCode) {
            score += 40;
        }

        return score;
    }
}

// Singleton instance
export const regionAssignmentEngine = new RegionAssignmentEngine();
