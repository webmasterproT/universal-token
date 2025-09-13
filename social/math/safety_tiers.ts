/**
 * Safety Tiers Algorithm
 * I = C × s × k (Impact = Connectedness × severity × confidence)
 * Determines friction levels, never erasure
 */

export interface SafetyTierResult {
  impactScore: number; // I = C × s × k
  tier: SafetyTier; // Friction level
  frictions: FrictionType[]; // Applied friction mechanisms
  decayTimer?: DecayTimer; // Automatic impact reduction
  appealable: boolean; // Whether decision can be appealed
}

export enum SafetyTier {
  NONE = 0,        // No additional friction
  LOW = 1,         // Minimal friction (rate limits, warnings)
  MEDIUM = 2,      // Moderate friction (cooldowns, verification required)
  HIGH = 3,        // Significant friction (limited interactions)
  CRITICAL = 4     // Maximum friction (severe interaction limits)
}

export enum FrictionType {
  RATE_LIMIT = 'rate_limit',           // Slow down actions
  VERIFICATION = 'verification',        // Require additional verification
  COOLDOWN = 'cooldown',               // Time delays between actions
  VISIBILITY_LIMIT = 'visibility',     // Limit content visibility
  INTERACTION_LIMIT = 'interaction',   // Limit interaction types
  REVIEW_REQUIRED = 'review',          // Require human review
  WARNING_LABEL = 'warning',           // Add warning labels
  SUPPORTER_REQUIRED = 'supporter'     // Require supporter/sponsor presence
}

export interface DecayTimer {
  halfLifeHours: number; // Time for impact to reduce by half
  startTime: Date; // When decay started
  initialImpact: number; // Original impact score
  currentMultiplier: number; // Current decay multiplier [0, 1]
}

export interface SafetyTierOptions {
  // Tier thresholds (impact scores that trigger each tier)
  tierThresholds?: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  // Decay settings
  decayHalfLife?: number; // Hours for impact to decay by half
  enableDecay?: boolean; // Whether to apply automatic decay
  // Bounds
  maxImpactScore?: number; // Cap on impact score
  minConnectednessForImpact?: number; // Minimum connectedness to have impact
}

const DEFAULT_OPTIONS: Required<SafetyTierOptions> = {
  tierThresholds: {
    low: 0.1,
    medium: 0.3,
    high: 0.6,
    critical: 0.85
  },
  decayHalfLife: 168, // 1 week
  enableDecay: true,
  maxImpactScore: 1.0,
  minConnectednessForImpact: 0.05
};

/**
 * Calculate safety tier based on issue parameters
 */
export function calculateSafetyTier(
  connectedness: number, // C ∈ [0, 1] - reporter connectedness
  severity: number, // s ∈ [0, 1] - issue severity
  confidence: number, // k ∈ [0, 1] - reporter confidence
  options: SafetyTierOptions = {}
): SafetyTierResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Bound inputs
  const boundedC = Math.max(0, Math.min(1, connectedness));
  const boundedS = Math.max(0, Math.min(1, severity));
  const boundedK = Math.max(0, Math.min(1, confidence));
  
  // Early return if connectedness too low
  if (boundedC < opts.minConnectednessForImpact) {
    return {
      impactScore: 0,
      tier: SafetyTier.NONE,
      frictions: [],
      appealable: false
    };
  }
  
  // Calculate raw impact score: I = C × s × k
  const rawImpact = boundedC * boundedS * boundedK;
  const impactScore = Math.min(rawImpact, opts.maxImpactScore);
  
  // Determine tier based on thresholds
  const tier = determineTier(impactScore, opts.tierThresholds);
  
  // Determine frictions for this tier
  const frictions = determineFrictions(tier, impactScore);
  
  // Set up decay timer if enabled
  const decayTimer = opts.enableDecay ? {
    halfLifeHours: opts.decayHalfLife,
    startTime: new Date(),
    initialImpact: impactScore,
    currentMultiplier: 1.0
  } : undefined;
  
  return {
    impactScore,
    tier,
    frictions,
    decayTimer,
    appealable: tier >= SafetyTier.MEDIUM // Medium+ tiers are appealable
  };
}

/**
 * Update impact score based on decay timer
 */
export function updateDecayedImpact(result: SafetyTierResult): SafetyTierResult {
  if (!result.decayTimer) return result;
  
  const { halfLifeHours, startTime, initialImpact } = result.decayTimer;
  const hoursElapsed = (Date.now() - startTime.getTime()) / (1000 * 60 * 60);
  
  // Calculate exponential decay: I(t) = I₀ * (1/2)^(t/h)
  const decayMultiplier = Math.pow(0.5, hoursElapsed / halfLifeHours);
  const currentImpact = initialImpact * decayMultiplier;
  
  // Update tier based on decayed impact
  const newTier = determineTier(currentImpact, DEFAULT_OPTIONS.tierThresholds);
  const newFrictions = determineFrictions(newTier, currentImpact);
  
  return {
    ...result,
    impactScore: currentImpact,
    tier: newTier,
    frictions: newFrictions,
    decayTimer: {
      ...result.decayTimer,
      currentMultiplier: decayMultiplier
    }
  };
}

/**
 * Batch calculate safety tiers for multiple issues
 */
export function batchCalculateSafetyTiers(
  issues: Array<{
    id: string;
    connectedness: number;
    severity: number;
    confidence: number;
  }>,
  options: SafetyTierOptions = {}
): Map<string, SafetyTierResult> {
  const results = new Map<string, SafetyTierResult>();
  
  for (const issue of issues) {
    const result = calculateSafetyTier(
      issue.connectedness,
      issue.severity,
      issue.confidence,
      options
    );
    results.set(issue.id, result);
  }
  
  return results;
}

/**
 * Calculate aggregate safety tier for multiple issues about same subject
 */
export function calculateAggregateSafetyTier(
  subjectIssues: SafetyTierResult[],
  options: SafetyTierOptions = {}
): SafetyTierResult {
  if (subjectIssues.length === 0) {
    return {
      impactScore: 0,
      tier: SafetyTier.NONE,
      frictions: [],
      appealable: false
    };
  }
  
  // Update all issues for decay
  const currentIssues = subjectIssues.map(updateDecayedImpact);
  
  // Use maximum impact (worst case) but with diversity adjustment
  const maxImpact = Math.max(...currentIssues.map(r => r.impactScore));
  const avgImpact = currentIssues.reduce((sum, r) => sum + r.impactScore, 0) / currentIssues.length;
  
  // Diversity penalty: multiple diverse issues increase overall impact
  const diversityFactor = Math.min(1.2, 1 + (currentIssues.length - 1) * 0.1);
  const aggregateImpact = Math.min(maxImpact * diversityFactor, 1.0);
  
  const tier = determineTier(aggregateImpact, DEFAULT_OPTIONS.tierThresholds);
  const frictions = determineFrictions(tier, aggregateImpact);
  
  // Aggregate is appealable if any component issue is appealable
  const appealable = currentIssues.some(r => r.appealable);
  
  return {
    impactScore: aggregateImpact,
    tier,
    frictions,
    appealable
  };
}

/**
 * Determine safety tier from impact score
 */
function determineTier(
  impactScore: number,
  thresholds: { low: number; medium: number; high: number; critical: number }
): SafetyTier {
  if (impactScore >= thresholds.critical) return SafetyTier.CRITICAL;
  if (impactScore >= thresholds.high) return SafetyTier.HIGH;
  if (impactScore >= thresholds.medium) return SafetyTier.MEDIUM;
  if (impactScore >= thresholds.low) return SafetyTier.LOW;
  return SafetyTier.NONE;
}

/**
 * Determine friction mechanisms for safety tier
 */
function determineFrictions(tier: SafetyTier, impactScore: number): FrictionType[] {
  const frictions: FrictionType[] = [];
  
  switch (tier) {
    case SafetyTier.CRITICAL:
      frictions.push(
        FrictionType.INTERACTION_LIMIT,
        FrictionType.REVIEW_REQUIRED,
        FrictionType.SUPPORTER_REQUIRED,
        FrictionType.VISIBILITY_LIMIT,
        FrictionType.WARNING_LABEL
      );
      // Fall through to add lower-tier frictions
    
    case SafetyTier.HIGH:
      frictions.push(
        FrictionType.VERIFICATION,
        FrictionType.COOLDOWN
      );
      // Fall through
    
    case SafetyTier.MEDIUM:
      frictions.push(
        FrictionType.RATE_LIMIT,
        FrictionType.WARNING_LABEL
      );
      // Fall through
    
    case SafetyTier.LOW:
      frictions.push(FrictionType.RATE_LIMIT);
      break;
    
    case SafetyTier.NONE:
    default:
      // No frictions
      break;
  }
  
  return Array.from(new Set(frictions)); // Remove duplicates
}

/**
 * Get human-readable description of safety tier
 */
export function describeSafetyTier(result: SafetyTierResult): string {
  const tierDescriptions = {
    [SafetyTier.NONE]: 'No restrictions',
    [SafetyTier.LOW]: 'Minor friction (rate limiting)',
    [SafetyTier.MEDIUM]: 'Moderate friction (cooldowns, warnings)',
    [SafetyTier.HIGH]: 'Significant friction (limited interactions)',
    [SafetyTier.CRITICAL]: 'Maximum friction (severe interaction limits)'
  };
  
  let description = tierDescriptions[result.tier];
  
  if (result.decayTimer && result.decayTimer.currentMultiplier < 1.0) {
    const decayPercent = Math.round((1 - result.decayTimer.currentMultiplier) * 100);
    description += ` (${decayPercent}% decayed)`;
  }
  
  if (result.appealable) {
    description += ' - Appealable through community process';
  }
  
  return description;
}

/**
 * Calculate time until impact decays to specific level
 */
export function calculateDecayTime(
  currentImpact: number,
  targetImpact: number,
  halfLifeHours: number
): number {
  if (currentImpact <= targetImpact) return 0;
  
  // Solve: target = current * (1/2)^(t/h)
  // t = h * log₂(current/target)
  return halfLifeHours * Math.log2(currentImpact / targetImpact);
}

/**
 * Validate safety tier configuration
 */
export function validateSafetyConfig(options: SafetyTierOptions): string[] {
  const errors: string[] = [];
  
  if (options.tierThresholds) {
    const t = options.tierThresholds;
    if (t.low >= t.medium) errors.push('Low threshold must be less than medium');
    if (t.medium >= t.high) errors.push('Medium threshold must be less than high');
    if (t.high >= t.critical) errors.push('High threshold must be less than critical');
    if (t.critical > 1.0) errors.push('Critical threshold cannot exceed 1.0');
    if (t.low < 0) errors.push('Low threshold cannot be negative');
  }
  
  if (options.decayHalfLife !== undefined && options.decayHalfLife <= 0) {
    errors.push('Decay half-life must be positive');
  }
  
  if (options.maxImpactScore !== undefined && options.maxImpactScore > 1.0) {
    errors.push('Max impact score cannot exceed 1.0');
  }
  
  return errors;
}