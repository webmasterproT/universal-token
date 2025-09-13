/**
 * Cross-Branch Escalation System
 * Implements section 5: escalation scoring and neighbor selection
 * Creates predictable triggers for cross-branch help when needed
 */

export interface Branch {
  id: string;                    // Branch identifier
  members: string[];             // HER CIDs of members
  avg_credits: number;           // Average credit balance
  diversity_score: number;       // ρ ∈ [0,1] stance diversity
  open_needs_count: number;      // Unfulfilled help requests
  current_load: number;          // Active contracts/obligations
  location_hint?: string;        // Geographic region (optional)
}

export interface EscalationParameters {
  // Escalation score weights
  gamma1: number;                // local impact weight (e.g., 0.6)
  gamma2: number;                // unsatisfied need weight (e.g., 0.3)  
  gamma3: number;                // low diversity weight (e.g., 0.1)
  
  // Escalation trigger
  Theta_esc: number;             // escalation threshold (e.g., 0.35)
  
  // Neighbor selection weights
  lambda1: number;               // connectedness weight (e.g., 0.6)
  lambda2: number;               // scarcity bonus weight (e.g., 0.3)
  lambda3: number;               // load penalty weight (e.g., 0.1)
  
  // Selection parameters
  max_neighbors: number;         // maximum branches to invite (e.g., 5)
  theta: number;                 // scarcity midpoint (e.g., 0.5)
}

export interface Issue {
  id: string;
  subject_set: string[];         // People affected by issue
  severity: number;              // s ∈ [0,1]
  confidence: number;            // k ∈ [0,1]
  reporter: string;              // HER CID of reporter
  focal_branch: string;          // Primary branch handling issue
}

export interface EscalationScore {
  branch_id: string;
  issue_id: string;
  local_impact: number;          // γ₁ × I_B₀(X)
  need_pressure: number;         // γ₂ × (OpenNeeds/|B|)
  diversity_penalty: number;     // γ₃ × (1-ρ)
  total_score: number;           // Combined escalation score
  triggered: boolean;            // Whether escalation is triggered
}

export interface NeighborScore {
  branch_id: string;
  connectedness: number;         // C(B,S)
  scarcity_bonus: number;        // σ(θ - CR̄_B)
  load_penalty: number;          // Current load factor
  total_score: number;           // Combined neighbor score
  recommended: boolean;          // Whether to invite this branch
}

export interface CrossBranchContract {
  contract_id: string;
  requesting_branch: string;
  helping_branches: string[];
  issue_id: string;
  scope: string[];               // Subject set
  tasks: string[];               // Required actions
  timebox_hours: number;         // Contract duration
  evidence_requirements: string; // What evidence is needed
  credit_rewards: number;        // Credits for helpers
  status: 'proposed' | 'active' | 'completed' | 'failed';
  signatures: Record<string, string>; // Branch approvals
  created_at: number;
  expires_at: number;
}

/**
 * Calculate escalation score for a branch/issue combination
 * Formula: E(B₀,X) = γ₁×I_B₀(X) + γ₂×(OpenNeeds/|B|) + γ₃×(1-ρ_B₀)
 */
export function calculateEscalationScore(
  branch: Branch,
  issue: Issue,
  connectedness_map: Map<string, number>, // member -> subject connectedness
  params: EscalationParameters
): EscalationScore {
  // Calculate local impact: I_B₀(X) = (1/|B|) × Σ C(u,S) × s × k
  let total_member_impact = 0;
  for (const member of branch.members) {
    let member_connectedness = 0;
    
    // Calculate union connectedness for this member to subject set
    for (const subject of issue.subject_set) {
      const key = `${member}->${subject}`;
      const pairwise = connectedness_map.get(key) || 0;
      member_connectedness = Math.max(member_connectedness, pairwise);
    }
    
    total_member_impact += member_connectedness * issue.severity * issue.confidence;
  }
  
  const local_impact = branch.members.length > 0 
    ? (total_member_impact / branch.members.length) 
    : 0;
  
  // Calculate need pressure: OpenNeeds/|B|
  const need_pressure = branch.members.length > 0 
    ? (branch.open_needs_count / branch.members.length) 
    : 0;
  
  // Calculate diversity penalty: 1 - ρ_B₀
  const diversity_penalty = 1 - Math.max(0, Math.min(1, branch.diversity_score));
  
  // Weighted components
  const weighted_impact = params.gamma1 * local_impact;
  const weighted_need = params.gamma2 * need_pressure;
  const weighted_diversity = params.gamma3 * diversity_penalty;
  
  const total_score = weighted_impact + weighted_need + weighted_diversity;
  const triggered = total_score >= params.Theta_esc;
  
  return {
    branch_id: branch.id,
    issue_id: issue.id,
    local_impact: weighted_impact,
    need_pressure: weighted_need,
    diversity_penalty: weighted_diversity,
    total_score,
    triggered
  };
}

/**
 * Score and select neighbor branches for escalation
 * Formula: Score(B,X) = λ₁×C(B,S) + λ₂×σ(θ-CR̄_B) - λ₃×Load(B)
 */
export function selectNeighborBranches(
  candidate_branches: Branch[],
  issue: Issue,
  branch_connectedness: Map<string, number>, // branch -> subject set connectedness
  params: EscalationParameters
): NeighborScore[] {
  const scored_branches = candidate_branches.map(branch => {
    // Calculate branch connectedness to subject set
    const connectedness_key = `${branch.id}->${issue.subject_set.join(',')}`;
    const connectedness = branch_connectedness.get(connectedness_key) || 0;
    
    // Calculate scarcity bonus: σ(θ - CR̄_B)
    const scarcity_input = params.theta - (branch.avg_credits / 100); // Assuming C_max = 100
    const scarcity_bonus = sigmoid(scarcity_input);
    
    // Load penalty (normalized to [0,1])
    const load_penalty = Math.max(0, Math.min(1, branch.current_load / 10)); // Assuming max load = 10
    
    // Weighted score
    const weighted_connectedness = params.lambda1 * connectedness;
    const weighted_scarcity = params.lambda2 * scarcity_bonus;
    const weighted_load_penalty = params.lambda3 * load_penalty;
    
    const total_score = weighted_connectedness + weighted_scarcity - weighted_load_penalty;
    
    return {
      branch_id: branch.id,
      connectedness,
      scarcity_bonus,
      load_penalty,
      total_score,
      recommended: false // Will be set below
    };
  });
  
  // Sort by total score (descending) and take top N
  scored_branches.sort((a, b) => b.total_score - a.total_score);
  
  // Mark top branches as recommended
  const top_count = Math.min(params.max_neighbors, scored_branches.length);
  for (let i = 0; i < top_count; i++) {
    scored_branches[i].recommended = true;
  }
  
  return scored_branches;
}

/**
 * Calculate branch connectedness to subject set
 * C(B,S) = (1/|B|) × Σ C(u,S) for u ∈ B
 */
export function calculateBranchConnectedness(
  branch: Branch,
  subject_set: string[],
  pairwise_connectedness: Map<string, number>
): number {
  if (branch.members.length === 0 || subject_set.length === 0) return 0;
  
  let total_connectedness = 0;
  for (const member of branch.members) {
    // Calculate union connectedness for this member
    let member_union_connectedness = 0;
    let product = 1.0;
    
    for (const subject of subject_set) {
      const key = `${member}->${subject}`;
      const pairwise = pairwise_connectedness.get(key) || 0;
      product *= (1 - Math.max(0, Math.min(1, pairwise)));
    }
    
    member_union_connectedness = 1 - product;
    total_connectedness += member_union_connectedness;
  }
  
  return total_connectedness / branch.members.length;
}

/**
 * Create cross-branch contract proposal
 */
export function createCrossBranchContract(
  requesting_branch: string,
  helping_branches: string[],
  issue: Issue,
  tasks: string[],
  timebox_hours: number,
  credit_rewards: number
): CrossBranchContract {
  const contract_id = generateContractId(requesting_branch, issue.id);
  const now = Date.now();
  
  return {
    contract_id,
    requesting_branch,
    helping_branches,
    issue_id: issue.id,
    scope: issue.subject_set,
    tasks,
    timebox_hours,
    evidence_requirements: 'Survivor-approved outcome with witness attestations',
    credit_rewards,
    status: 'proposed',
    signatures: {},
    created_at: now,
    expires_at: now + (timebox_hours * 60 * 60 * 1000)
  };
}

/**
 * Validate escalation request
 */
export function validateEscalationRequest(
  escalation_score: EscalationScore,
  requester_credits: number,
  escalation_cost: number,
  branch_approval: any // BranchApproval from credit_flow.ts
): { valid: boolean; reason?: string } {
  // Check escalation trigger
  if (!escalation_score.triggered) {
    return { 
      valid: false, 
      reason: `Escalation score ${escalation_score.total_score.toFixed(3)} below threshold` 
    };
  }
  
  // Check requester has enough credits
  if (requester_credits < escalation_cost) {
    return { 
      valid: false, 
      reason: `Insufficient credits: ${requester_credits} < ${escalation_cost}` 
    };
  }
  
  // Check branch approval
  if (!branch_approval.approved) {
    return { 
      valid: false, 
      reason: 'Branch quorum did not approve escalation' 
    };
  }
  
  return { valid: true };
}

/**
 * Calculate branch diversity score from member stances
 */
export function calculateBranchDiversity(
  member_stances: number[], // Stance values from recent votes/issues
  method: 'variance' | 'entropy' = 'variance'
): number {
  if (member_stances.length <= 1) return 1.0;
  
  if (method === 'variance') {
    const mean = member_stances.reduce((sum, stance) => sum + stance, 0) / member_stances.length;
    const variance = member_stances.reduce((sum, stance) => sum + Math.pow(stance - mean, 2), 0) / member_stances.length;
    
    // Normalize variance to [0,1] range (assuming stances are in [-1,1])
    const max_variance = 1.0; // Maximum possible variance for [-1,1] range
    return Math.min(1.0, variance / max_variance);
  }
  
  if (method === 'entropy') {
    // Discretize stances into bins and calculate Shannon entropy
    const bins = 5; // Number of bins
    const bin_counts = new Array(bins).fill(0);
    
    for (const stance of member_stances) {
      const normalized = (stance + 1) / 2; // Map [-1,1] to [0,1]
      const bin = Math.min(bins - 1, Math.floor(normalized * bins));
      bin_counts[bin]++;
    }
    
    // Calculate entropy
    let entropy = 0;
    for (const count of bin_counts) {
      if (count > 0) {
        const p = count / member_stances.length;
        entropy -= p * Math.log2(p);
      }
    }
    
    // Normalize to [0,1]
    const max_entropy = Math.log2(bins);
    return entropy / max_entropy;
  }
  
  return 0;
}

/**
 * Get default escalation parameters (section 10)
 */
export function getDefaultEscalationParameters(): EscalationParameters {
  return {
    gamma1: 0.6,
    gamma2: 0.3,
    gamma3: 0.1,
    Theta_esc: 0.35,
    lambda1: 0.6,
    lambda2: 0.3,
    lambda3: 0.1,
    max_neighbors: 5,
    theta: 0.5
  };
}

/**
 * Sigmoid function for scarcity bonus
 */
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Generate unique contract ID
 */
function generateContractId(branch_id: string, issue_id: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `contract_${branch_id}_${issue_id}_${timestamp}_${random}`;
}

/**
 * Example worked calculation (section 11)
 */
export function workedExample(): {
  branch: Branch;
  issue: Issue;
  escalation_score: EscalationScore;
  neighbor_selection: NeighborScore[];
} {
  const params = getDefaultEscalationParameters();
  
  // Branch B_0 with 10 members, average credits 8
  const branch: Branch = {
    id: 'branch_b0',
    members: Array.from({length: 10}, (_, i) => `member_${i}`),
    avg_credits: 8,
    diversity_score: 0.3, // Low diversity (echo chamber)
    open_needs_count: 5,
    current_load: 2
  };
  
  // Issue X with severity 0.7, confidence 0.8
  const issue: Issue = {
    id: 'issue_x',
    subject_set: ['subject_1', 'subject_2'],
    severity: 0.7,
    confidence: 0.8,
    reporter: 'reporter_1',
    focal_branch: 'branch_b0'
  };
  
  // Mock connectedness (each member has 0.4 average connectedness)
  const connectedness_map = new Map<string, number>();
  for (const member of branch.members) {
    for (const subject of issue.subject_set) {
      connectedness_map.set(`${member}->${subject}`, 0.4);
    }
  }
  
  const escalation_score = calculateEscalationScore(branch, issue, connectedness_map, params);
  
  // Mock neighbor branches
  const candidate_branches: Branch[] = [
    { id: 'neighbor_1', members: ['n1_m1', 'n1_m2'], avg_credits: 12, diversity_score: 0.8, open_needs_count: 2, current_load: 1 },
    { id: 'neighbor_2', members: ['n2_m1', 'n2_m2'], avg_credits: 6, diversity_score: 0.6, open_needs_count: 3, current_load: 4 }
  ];
  
  const branch_connectedness = new Map<string, number>();
  branch_connectedness.set(`neighbor_1->${issue.subject_set.join(',')}`, 0.6);
  branch_connectedness.set(`neighbor_2->${issue.subject_set.join(',')}`, 0.3);
  
  const neighbor_selection = selectNeighborBranches(candidate_branches, issue, branch_connectedness, params);
  
  return {
    branch,
    issue,
    escalation_score,
    neighbor_selection
  };
}