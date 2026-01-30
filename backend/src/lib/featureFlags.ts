/**
 * Feature Flags Configuration
 * 
 * Controls which features are enabled in the application.
 * All new features should be gated behind these flags.
 * 
 * Default: OFF (false) - must be explicitly enabled via environment variables
 */

export const featureFlags = {
    /**
     * Mistake Intelligence System
     * When enabled, logs user mistakes and calculates weakness profiles
     */
    mistakeIntelligence: process.env.FEATURE_MISTAKE_INTELLIGENCE === 'true',

    /**
     * Smart Practice
     * When enabled, provides personalized practice based on user weaknesses
     * Requires mistakeIntelligence to be enabled
     */
    smartPractice: process.env.FEATURE_SMART_PRACTICE === 'true',

    /**
     * Question Bank Intelligence
     * When enabled, tracks Question Bank mistakes for premium users
     * Lower weight (0.5) compared to Mock Tests (1.0)
     * Default: OFF - enable only after testing
     */
    qbIntelligence: process.env.FEATURE_QB_INTELLIGENCE === 'true',
};

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
    return featureFlags[feature];
}

/**
 * Check if Smart Practice is available
 * Requires both feature flags to be enabled
 */
export function isSmartPracticeAvailable(): boolean {
    return featureFlags.mistakeIntelligence && featureFlags.smartPractice;
}
