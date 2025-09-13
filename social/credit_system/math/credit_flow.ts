/**
 * Credit Flow System
 * Implements sections 3-7: earning, spending, decay, and conservation
 * Purpose: Incentivize care labor without creating domination
 */

export interface CreditParameters {
  // Caps and limits
  C_max: number;              // per-human soft cap (e.g., 100)
  I_max_per_epoch: number;    // global issuance cap per epoch
  S_max_per_epoch: number;    // global spend cap per epoch
  
  // Earning multipliers
  beta0: number;              // base earn multiplier (e.g., 0.6)
  beta1: number;              // proximity multiplier (e.g., 0.4)
  theta: number;              // scarcity midpoint (e.g., 0.5)
  
  // Spend costs
  c_local: number;            // local help cost (e.g., 2)
  c_xbranch: number;          // cross-branch escalation cost (e.g., 5)
  c_global: number;           // global escalation cost (e.g., 10)
  
  // Decay parameters
  H_c_days: number;           // credit half-life in days (e.g., 180)
  delta: number;              // decay base (0.5 for half-life)
}

export interface EarnableAction {
  type: 'mediation' | 'support_response' | 'replication' | 'other';
  base_award: number;         // w_a > 0
  description: string;
}

export interface EarnEvent {
  helper: string;             // Helper's HER CID
  action: EarnableAction;
  subject_set: string[];      // Set S of people helped
  evidence_confidence: number; // k ∈ [0,1]
  diversity_factor: number;   // ρ ∈ [0,1] 
  proximity_score: number;    // C(helper, S)
  branch_avg_credits: number; // Average credits in helper's branch
  timestamp: number;
  witnesses: string[];        // Witness HER CIDs for verification
}

export interface SpendEvent {
  requester: string;          // Requester's HER CID
  spend_type: 'local' | 'xbranch' | 'global';
  amount: number;             // Credits to burn
  purpose: string;            // Description of need
  branch_approval: BranchApproval;
  timestamp: number;
}

export interface BranchApproval {
  branch_id: string;
  voters: string[];           // HER CIDs of voters
  votes: number[];            // Vote values (can be weighted)
  participation_rate: number; // |V| / |B|
  path_diversity_score: number; // Independent path sets
  trimmed_mean: number;       // Final approval score
  approved: boolean;
}

export interface CreditBalance {
  human: string;              // HER CID
  balance: number;            // Current credits
  last_updated_epoch: number;
  earn_history: EarnEvent[];
  spend_history: SpendEvent[];
}

/**
 * Calculate credit award for an earn event
 * Formula: ΔCR_h = w_a × k × ρ × (β₀ + β₁ × C(h,S)) × σ(θ - CR̄_B(h))
 */
export function calculateCreditAward(
  event: EarnEvent,
  params: CreditParameters
): number {
  const { action, evidence_confidence, diversity_factor, proximity_score, branch_avg_credits } = event;
  const { beta0, beta1, theta } = params;
  
  // Base components
  const base_award = action.base_award;
  const confidence = Math.max(0, Math.min(1, evidence_confidence));
  const diversity = Math.max(0, Math.min(1, diversity_factor));
  
  // Proximity factor: β₀ + β₁ × C(h,S)
  const proximity_factor = beta0 + beta1 * Math.max(0, Math.min(1, proximity_score));
  
  // Scarcity bonus: σ(θ - CR̄_B(h))
  const scarcity_input = theta - (branch_avg_credits / params.C_max);
  const scarcity_bonus = sigmoid(scarcity_input);
  
  // Combined formula
  const award = base_award * confidence * diversity * proximity_factor * scarcity_bonus;
  
  return Math.max(0, award);
}

/**
 * Apply credit decay based on time elapsed
 * Formula: CR_i(t+1) = min(C_max, CR_i(t) × δ^(Δt/H_c) + earnings - spends)
 */
export function applyCreditDecay(
  balance: CreditBalance,
  current_epoch: number,
  epoch_duration_hours: number,
  params: CreditParameters
): number {
  const epochs_elapsed = current_epoch - balance.last_updated_epoch;
  const hours_elapsed = epochs_elapsed * epoch_duration_hours;
  const days_elapsed = hours_elapsed / 24;
  
  // Exponential decay: δ^(Δt/H_c)
  const decay_multiplier = Math.pow(params.delta, days_elapsed / params.H_c_days);
  const decayed_balance = balance.balance * decay_multiplier;
  
  return Math.max(0, Math.min(params.C_max, decayed_balance));
}

/**
 * Calculate union connectedness C(h,S) = 1 - ∏(1 - C(h,s))
 * Where C(h,s) is pairwise connectedness between helper h and subject s
 */
export function calculateUnionConnectedness(
  helper: string,
  subject_set: string[],
  pairwise_connectedness: Map<string, number>
): number {
  if (subject_set.length === 0) return 0;
  
  let product = 1.0;
  for (const subject of subject_set) {
    const key = `${helper}->${subject}`;
    const pairwise = pairwise_connectedness.get(key) || 0;
    product *= (1 - Math.max(0, Math.min(1, pairwise)));
  }
  
  return Math.max(0, Math.min(1, 1 - product));
}

/**
 * Validate earn event against anti-abuse rules
 */
export function validateEarnEvent(
  event: EarnEvent,
  params: CreditParameters
): { valid: boolean; reason?: string } {
  // Evidence confidence must be > 0
  if (event.evidence_confidence <= 0) {
    return { valid: false, reason: 'Evidence confidence must be positive' };
  }
  
  // Diversity factor must be > 0
  if (event.diversity_factor <= 0) {
    return { valid: false, reason: 'Diversity factor must be positive' };
  }
  
  // Must have at least one witness for verification
  if (event.witnesses.length === 0) {
    return { valid: false, reason: 'At least one witness required' };
  }
  
  // Subject set cannot be empty
  if (event.subject_set.length === 0) {
    return { valid: false, reason: 'Subject set cannot be empty' };
  }
  
  // Helper cannot be in their own subject set
  if (event.subject_set.includes(event.helper)) {
    return { valid: false, reason: 'Helper cannot earn credits for helping themselves' };
  }
  
  return { valid: true };
}

/**
 * Calculate trimmed mean for branch voting
 * Drops top/bottom 10% to resist brigading
 */
export function calculateTrimmedMean(votes: number[], trim_percent: number = 0.1): number {
  if (votes.length === 0) return 0;
  if (votes.length === 1) return votes[0];
  
  const sorted = [...votes].sort((a, b) => a - b);
  const trim_count = Math.floor(votes.length * trim_percent);
  
  // Remove trim_count from both ends
  const trimmed = sorted.slice(trim_count, sorted.length - trim_count);
  if (trimmed.length === 0) return sorted[Math.floor(sorted.length / 2)]; // fallback to median
  
  const sum = trimmed.reduce((acc, vote) => acc + vote, 0);
  return sum / trimmed.length;
}

/**
 * Validate branch spend approval against quorum rules
 */
export function validateBranchApproval(
  approval: BranchApproval,
  branch_size: number,
  required_participation: number = 0.4,  // α
  required_paths: number = 3,             // q
  required_approval: number = 0.6         // τ
): { valid: boolean; reason?: string } {
  // Check participation rate
  if (approval.participation_rate < required_participation) {
    return { 
      valid: false, 
      reason: `Participation ${approval.participation_rate.toFixed(2)} below required ${required_participation}` 
    };
  }
  
  // Check path diversity
  if (approval.path_diversity_score < required_paths) {
    return { 
      valid: false, 
      reason: `Path diversity ${approval.path_diversity_score} below required ${required_paths}` 
    };
  }
  
  // Check approval threshold
  if (approval.trimmed_mean < required_approval) {
    return { 
      valid: false, 
      reason: `Approval ${approval.trimmed_mean.toFixed(2)} below required ${required_approval}` 
    };
  }
  
  return { valid: true };
}

/**
 * Update credit balance with new earn/spend events
 */
export function updateCreditBalance(
  balance: CreditBalance,
  earn_events: EarnEvent[],
  spend_events: SpendEvent[],
  current_epoch: number,
  epoch_duration_hours: number,
  params: CreditParameters
): CreditBalance {
  // Apply decay first
  const decayed_balance = applyCreditDecay(balance, current_epoch, epoch_duration_hours, params);
  
  // Calculate total earnings
  const total_earnings = earn_events.reduce((sum, event) => {
    const validation = validateEarnEvent(event, params);
    if (!validation.valid) return sum; // Skip invalid events
    
    return sum + calculateCreditAward(event, params);
  }, 0);
  
  // Calculate total spends
  const total_spends = spend_events.reduce((sum, event) => sum + event.amount, 0);
  
  // Apply caps
  const new_balance = Math.max(0, Math.min(params.C_max, decayed_balance + total_earnings - total_spends));
  
  return {
    ...balance,
    balance: new_balance,
    last_updated_epoch: current_epoch,
    earn_history: [...balance.earn_history, ...earn_events],
    spend_history: [...balance.spend_history, ...spend_events]
  };
}

/**
 * Calculate global issuance and spending for epoch conservation
 */
export function calculateEpochConservation(
  all_earn_events: EarnEvent[],
  all_spend_events: SpendEvent[],
  params: CreditParameters
): {
  total_earned: number;
  total_spent: number;
  within_issuance_cap: boolean;
  within_spend_cap: boolean;
  unused_issuance: number;
} {
  const total_earned = all_earn_events.reduce((sum, event) => {
    return sum + calculateCreditAward(event, params);
  }, 0);
  
  const total_spent = all_spend_events.reduce((sum, event) => sum + event.amount, 0);
  
  const within_issuance_cap = total_earned <= params.I_max_per_epoch;
  const within_spend_cap = total_spent <= params.S_max_per_epoch;
  const unused_issuance = Math.max(0, params.I_max_per_epoch - total_earned);
  
  return {
    total_earned,
    total_spent,
    within_issuance_cap,
    within_spend_cap,
    unused_issuance
  };
}

/**
 * Sigmoid function for scarcity bonus calculation
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Get default credit parameters (section 10)
 */
export function getDefaultCreditParameters(): CreditParameters {
  return {
    C_max: 100,
    I_max_per_epoch: 0, // Will be set to 0.05 * |H| dynamically
    S_max_per_epoch: 0, // Will be set based on expected spend patterns
    beta0: 0.6,
    beta1: 0.4,
    theta: 0.5,
    c_local: 2,
    c_xbranch: 5,
    c_global: 10,
    H_c_days: 180,
    delta: 0.5
  };
}

/**
 * Calculate dynamic issuance cap based on active population
 */
export function calculateDynamicIssuanceCap(
  active_population: number,
  base_rate: number = 0.05
): number {
  return Math.floor(base_rate * active_population);
}