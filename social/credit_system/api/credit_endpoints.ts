/**
 * Credit System API Endpoints
 * REST endpoints for credit operations: earn, spend, escalate, branch management
 */

import { 
  EarnEvent, 
  SpendEvent, 
  CreditBalance, 
  BranchApproval,
  calculateCreditAward,
  validateEarnEvent,
  validateBranchApproval,
  updateCreditBalance,
  calculateTrimmedMean,
  getDefaultCreditParameters
} from '../math/credit_flow.js';

import {
  Branch,
  EscalationScore,
  CrossBranchContract,
  calculateEscalationScore,
  selectNeighborBranches,
  validateEscalationRequest,
  createCrossBranchContract,
  getDefaultEscalationParameters
} from '../math/cross_branch.js';

export interface CreditAPIRequest {
  requester: string;        // HER CID making the request
  timestamp: number;
  signature: string;        // Ed25519 signature over request
}

export interface EarnCreditRequest extends CreditAPIRequest {
  helper: string;           // Who performed the action
  action: {
    type: string;
    base_award: number;
    description: string;
  };
  subject_set: string[];    // People helped
  evidence_confidence: number;
  diversity_factor: number;
  witnesses: string[];      // Verification witnesses
  evidence_commitments?: any[]; // Optional sealed evidence
}

export interface SpendCreditRequest extends CreditAPIRequest {
  spend_type: 'local' | 'xbranch' | 'global';
  amount: number;
  purpose: string;
  branch_votes: {           // Votes from branch members
    voter: string;
    vote: number;           // Vote value
    signature: string;
  }[];
}

export interface EscalationRequest extends CreditAPIRequest {
  issue_id: string;         // Issue requiring escalation
  requesting_branch: string;
  proposed_tasks: string[];
  timebox_hours: number;
  max_neighbors?: number;
}

export interface BranchContractRequest extends CreditAPIRequest {
  contract_id: string;
  action: 'approve' | 'reject' | 'complete' | 'dispute';
  branch_id: string;
  completion_evidence?: any[]; // For completion
}

// ============================================================================
// POST /credit/earn - Submit earn event for credits
// ============================================================================

export async function handleEarnCredit(request: EarnCreditRequest): Promise<{
  success: boolean;
  credit_award?: number;
  earn_event?: EarnEvent;
  error?: string;
}> {
  try {
    const params = getDefaultCreditParameters();
    
    // Validate request signature
    const signatureValid = await validateRequestSignature(request);
    if (!signatureValid) {
      return { success: false, error: 'Invalid request signature' };
    }
    
    // Calculate proximity score (would need connectedness service)
    const proximity_score = await calculateProximityScore(request.helper, request.subject_set);
    
    // Get branch average credits
    const branch_avg_credits = await getBranchAverageCredits(request.helper);
    
    // Create earn event
    const earn_event: EarnEvent = {
      helper: request.helper,
      action: {
        type: request.action.type as any,
        base_award: request.action.base_award,
        description: request.action.description
      },
      subject_set: request.subject_set,
      evidence_confidence: request.evidence_confidence,
      diversity_factor: request.diversity_factor,
      proximity_score,
      branch_avg_credits,
      timestamp: request.timestamp,
      witnesses: request.witnesses
    };
    
    // Validate earn event
    const validation = validateEarnEvent(earn_event, params);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }
    
    // Calculate credit award
    const credit_award = calculateCreditAward(earn_event, params);
    
    // Store earn event (would persist to storage)
    await storeEarnEvent({ ...earn_event, credit_award });
    
    // Update helper's credit balance
    await updateHelperCreditBalance(request.helper, credit_award);
    
    return {
      success: true,
      credit_award,
      earn_event: { ...earn_event, credit_award }
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to process earn request: ${error.message}` 
    };
  }
}

// ============================================================================
// POST /credit/spend - Request to spend credits (requires branch approval)
// ============================================================================

export async function handleSpendCredit(request: SpendCreditRequest): Promise<{
  success: boolean;
  spend_event?: SpendEvent;
  branch_approval?: BranchApproval;
  error?: string;
}> {
  try {
    const params = getDefaultCreditParameters();
    
    // Validate request signature
    const signatureValid = await validateRequestSignature(request);
    if (!signatureValid) {
      return { success: false, error: 'Invalid request signature' };
    }
    
    // Get requester's branch
    const branch = await getBranchByMember(request.requester);
    if (!branch) {
      return { success: false, error: 'Requester not found in any branch' };
    }
    
    // Calculate path diversity from votes
    const path_diversity = await calculatePathDiversity(request.branch_votes.map(v => v.voter));
    
    // Create branch approval
    const branch_approval: BranchApproval = {
      branch_id: branch.id,
      voters: request.branch_votes.map(v => v.voter),
      votes: request.branch_votes.map(v => v.vote),
      participation_rate: request.branch_votes.length / branch.members.length,
      path_diversity_score: path_diversity,
      trimmed_mean: calculateTrimmedMean(request.branch_votes.map(v => v.vote)),
      approved: false, // Will be set below
      approval_timestamp: request.timestamp,
      branch_signature: '' // Would be generated
    };
    
    // Determine approval based on quorum rules
    const approval_validation = validateBranchApproval(
      branch_approval, 
      branch.members.length,
      params.alpha || 0.4,
      params.q || 3,
      params.tau || 0.6
    );
    
    branch_approval.approved = approval_validation.valid;
    
    if (!branch_approval.approved) {
      return { 
        success: false, 
        error: `Branch approval failed: ${approval_validation.reason}`,
        branch_approval 
      };
    }
    
    // Check requester has enough credits
    const requester_balance = await getCreditBalance(request.requester);
    if (requester_balance.balance < request.amount) {
      return { 
        success: false, 
        error: `Insufficient credits: ${requester_balance.balance} < ${request.amount}` 
      };
    }
    
    // Create spend event
    const spend_event: SpendEvent = {
      requester: request.requester,
      spend_type: request.spend_type,
      amount: request.amount,
      purpose: request.purpose,
      branch_approval,
      timestamp: request.timestamp
    };
    
    // Store spend event and update balance
    await storeSpendEvent(spend_event);
    await updateRequesterCreditBalance(request.requester, -request.amount);
    
    return {
      success: true,
      spend_event,
      branch_approval
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to process spend request: ${error.message}` 
    };
  }
}

// ============================================================================
// POST /credit/escalate - Request cross-branch escalation
// ============================================================================

export async function handleEscalation(request: EscalationRequest): Promise<{
  success: boolean;
  escalation_score?: EscalationScore;
  neighbor_branches?: any[];
  contract_proposal?: CrossBranchContract;
  error?: string;
}> {
  try {
    const params = getDefaultEscalationParameters();
    
    // Validate request signature
    const signatureValid = await validateRequestSignature(request);
    if (!signatureValid) {
      return { success: false, error: 'Invalid request signature' };
    }
    
    // Get requesting branch
    const requesting_branch = await getBranch(request.requesting_branch);
    if (!requesting_branch) {
      return { success: false, error: 'Requesting branch not found' };
    }
    
    // Get issue details
    const issue = await getIssue(request.issue_id);
    if (!issue) {
      return { success: false, error: 'Issue not found' };
    }
    
    // Calculate connectedness for branch members to issue subjects
    const connectedness_map = await getConnectednessMap(
      requesting_branch.members, 
      issue.subject_set
    );
    
    // Calculate escalation score
    const escalation_score = calculateEscalationScore(
      requesting_branch, 
      issue, 
      connectedness_map, 
      params
    );
    
    if (!escalation_score.triggered) {
      return { 
        success: false, 
        error: `Escalation not triggered: score ${escalation_score.total_score.toFixed(3)} < ${params.Theta_esc}`,
        escalation_score 
      };
    }
    
    // Find and score neighbor branches
    const candidate_branches = await getCandidateBranches(request.requesting_branch);
    const branch_connectedness = await getBranchConnectednessMap(candidate_branches, issue.subject_set);
    
    const neighbor_scores = selectNeighborBranches(
      candidate_branches,
      issue,
      branch_connectedness,
      params
    );
    
    const recommended_neighbors = neighbor_scores.filter(n => n.recommended);
    
    // Create contract proposal
    const contract_proposal = createCrossBranchContract(
      request.requesting_branch,
      recommended_neighbors.map(n => n.branch_id),
      issue,
      request.proposed_tasks,
      request.timebox_hours,
      params.c_xbranch || 5 // Default cross-branch cost
    );
    
    // Store escalation request
    await storeEscalationRequest({
      issue_id: request.issue_id,
      requesting_branch: request.requesting_branch,
      escalation_score,
      neighbor_selection: neighbor_scores,
      contract_proposal,
      timestamp: request.timestamp
    });
    
    return {
      success: true,
      escalation_score,
      neighbor_branches: recommended_neighbors,
      contract_proposal
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to process escalation: ${error.message}` 
    };
  }
}

// ============================================================================
// POST /credit/contract - Manage cross-branch contracts
// ============================================================================

export async function handleBranchContract(request: BranchContractRequest): Promise<{
  success: boolean;
  contract?: CrossBranchContract;
  error?: string;
}> {
  try {
    // Validate request signature
    const signatureValid = await validateRequestSignature(request);
    if (!signatureValid) {
      return { success: false, error: 'Invalid request signature' };
    }
    
    // Get existing contract
    const contract = await getContract(request.contract_id);
    if (!contract) {
      return { success: false, error: 'Contract not found' };
    }
    
    // Verify requester is authorized for this branch
    const branch = await getBranch(request.branch_id);
    if (!branch || !branch.members.includes(request.requester)) {
      return { success: false, error: 'Requester not authorized for this branch' };
    }
    
    let updated_contract = { ...contract };
    
    switch (request.action) {
      case 'approve':
        // Add branch signature to contract
        updated_contract.signatures[request.branch_id] = request.signature;
        
        // Check if all required signatures collected
        const all_signed = updated_contract.helping_branches.every(
          branch_id => updated_contract.signatures[branch_id]
        );
        
        if (all_signed) {
          updated_contract.status = 'active';
        }
        break;
        
      case 'reject':
        updated_contract.status = 'failed';
        break;
        
      case 'complete':
        // Verify completion evidence
        if (request.completion_evidence && request.completion_evidence.length > 0) {
          updated_contract.status = 'completed';
          
          // Award credits to helpers
          await distributeContractCredits(updated_contract);
        } else {
          return { success: false, error: 'Completion evidence required' };
        }
        break;
        
      case 'dispute':
        updated_contract.status = 'disputed';
        break;
        
      default:
        return { success: false, error: 'Invalid contract action' };
    }
    
    // Store updated contract
    await storeContract(updated_contract);
    
    return {
      success: true,
      contract: updated_contract
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to handle contract action: ${error.message}` 
    };
  }
}

// ============================================================================
// GET /credit/balance/:her_cid - Get credit balance for a human
// ============================================================================

export async function handleGetBalance(her_cid: string): Promise<{
  success: boolean;
  balance?: CreditBalance;
  error?: string;
}> {
  try {
    const balance = await getCreditBalance(her_cid);
    
    if (!balance) {
      return { success: false, error: 'Balance not found' };
    }
    
    return {
      success: true,
      balance
    };
    
  } catch (error) {
    return { 
      success: false, 
      error: `Failed to get balance: ${error.message}` 
    };
  }
}

// ============================================================================
// Helper Functions (would be implemented with actual data layer)
// ============================================================================

async function validateRequestSignature(request: CreditAPIRequest): Promise<boolean> {
  // TODO: Implement Ed25519 signature validation
  return true;
}

async function calculateProximityScore(helper: string, subject_set: string[]): Promise<number> {
  // TODO: Use connectedness service to calculate C(helper, S)
  return 0.5; // Placeholder
}

async function getBranchAverageCredits(member: string): Promise<number> {
  // TODO: Look up branch and calculate average credits
  return 50; // Placeholder
}

async function getBranchByMember(member: string): Promise<Branch | null> {
  // TODO: Look up which branch this member belongs to
  return null;
}

async function calculatePathDiversity(voters: string[]): Promise<number> {
  // TODO: Calculate path diversity score for voters
  return 3; // Placeholder
}

async function getCreditBalance(her_cid: string): Promise<CreditBalance> {
  // TODO: Load credit balance from storage
  return {
    human: her_cid,
    balance: 50,
    last_updated_epoch: 1,
    earn_history: [],
    spend_history: []
  };
}

async function getBranch(branch_id: string): Promise<Branch | null> {
  // TODO: Load branch definition from storage
  return null;
}

async function getIssue(issue_id: string): Promise<any> {
  // TODO: Load issue from safety system
  return null;
}

async function getConnectednessMap(members: string[], subjects: string[]): Promise<Map<string, number>> {
  // TODO: Calculate connectedness for all member-subject pairs
  return new Map();
}

async function getCandidateBranches(excluding_branch: string): Promise<Branch[]> {
  // TODO: Get list of branches that could help with escalation
  return [];
}

async function getBranchConnectednessMap(branches: Branch[], subjects: string[]): Promise<Map<string, number>> {
  // TODO: Calculate branch-level connectedness to subjects
  return new Map();
}

async function storeEarnEvent(event: EarnEvent): Promise<void> {
  // TODO: Persist earn event to storage
}

async function storeSpendEvent(event: SpendEvent): Promise<void> {
  // TODO: Persist spend event to storage  
}

async function storeEscalationRequest(request: any): Promise<void> {
  // TODO: Persist escalation request to storage
}

async function storeContract(contract: CrossBranchContract): Promise<void> {
  // TODO: Persist contract to storage
}

async function getContract(contract_id: string): Promise<CrossBranchContract | null> {
  // TODO: Load contract from storage
  return null;
}

async function updateHelperCreditBalance(helper: string, award: number): Promise<void> {
  // TODO: Add credits to helper's balance
}

async function updateRequesterCreditBalance(requester: string, amount: number): Promise<void> {
  // TODO: Subtract credits from requester's balance
}

async function distributeContractCredits(contract: CrossBranchContract): Promise<void> {
  // TODO: Distribute credit rewards to helping branches
}