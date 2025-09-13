/**
 * Credit System Client SDK
 * 
 * Provides a simple interface for applications to interact with the credit system.
 * Handles authentication, request signing, and API communication.
 */

import { 
  EarnCreditRequest, 
  SpendCreditRequest, 
  EscalationRequest,
  BranchContractRequest,
  handleEarnCredit,
  handleSpendCredit,
  handleEscalation,
  handleBranchContract,
  handleGetBalance
} from '../api/credit_endpoints.js';

import { CreditBalance, CreditParameters } from '../math/credit_flow.js';
import { triggerCreditIntegration } from '../integrations/safety_system_hooks.js';

export interface CreditClientConfig {
  api_base_url?: string;
  private_key: string;    // Ed25519 private key for signing
  public_key: string;     // Ed25519 public key
  her_cid: string;        // Human Existence Record CID
}

export class CreditClient {
  private config: CreditClientConfig;
  private api_url: string;

  constructor(config: CreditClientConfig) {
    this.config = config;
    this.api_url = config.api_base_url || 'http://localhost:3000';
  }

  // ============================================================================
  // Credit Operations
  // ============================================================================

  /**
   * Earn credits for helping someone or contributing to the community
   */
  async earnCredits(params: {
    action_type: string;
    base_award: number;
    description: string;
    people_helped: string[];
    evidence_confidence: number;
    diversity_factor: number;
    witnesses?: string[];
    evidence_urls?: string[];
  }): Promise<{
    success: boolean;
    credit_award?: number;
    error?: string;
  }> {
    const timestamp = Date.now();
    
    const request: EarnCreditRequest = {
      requester: this.config.her_cid,
      helper: this.config.her_cid,
      action: {
        type: params.action_type,
        base_award: params.base_award,
        description: params.description
      },
      subject_set: params.people_helped,
      evidence_confidence: params.evidence_confidence,
      diversity_factor: params.diversity_factor,
      witnesses: params.witnesses || [],
      evidence_commitments: params.evidence_urls,
      timestamp,
      signature: await this.signRequest({ requester: this.config.her_cid, timestamp })
    };

    try {
      const response = await handleEarnCredit(request);
      
      if (response.success && response.credit_award) {
        console.log(`✅ Earned ${response.credit_award} credits for: ${params.description}`);
      }
      
      return {
        success: response.success,
        credit_award: response.credit_award,
        error: response.error
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to earn credits: ${error.message}`
      };
    }
  }

  /**
   * Spend credits (requires branch approval)
   */
  async spendCredits(params: {
    amount: number;
    purpose: string;
    spend_type?: 'local' | 'xbranch' | 'global';
    branch_votes: Array<{
      voter: string;
      vote: number;
      signature: string;
    }>;
  }): Promise<{
    success: boolean;
    spend_event?: any;
    error?: string;
  }> {
    const timestamp = Date.now();
    
    const request: SpendCreditRequest = {
      requester: this.config.her_cid,
      spend_type: params.spend_type || 'local',
      amount: params.amount,
      purpose: params.purpose,
      branch_votes: params.branch_votes,
      timestamp,
      signature: await this.signRequest({ requester: this.config.her_cid, timestamp })
    };

    try {
      const response = await handleSpendCredit(request);
      
      if (response.success) {
        console.log(`💳 Spent ${params.amount} credits for: ${params.purpose}`);
      }
      
      return {
        success: response.success,
        spend_event: response.spend_event,
        error: response.error
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to spend credits: ${error.message}`
      };
    }
  }

  /**
   * Request escalation to other branches
   */
  async requestEscalation(params: {
    issue_id: string;
    requesting_branch: string;
    proposed_tasks: string[];
    timebox_hours: number;
    max_neighbors?: number;
  }): Promise<{
    success: boolean;
    contract_proposal?: any;
    error?: string;
  }> {
    const timestamp = Date.now();
    
    const request: EscalationRequest = {
      requester: this.config.her_cid,
      issue_id: params.issue_id,
      requesting_branch: params.requesting_branch,
      proposed_tasks: params.proposed_tasks,
      timebox_hours: params.timebox_hours,
      max_neighbors: params.max_neighbors,
      timestamp,
      signature: await this.signRequest({ requester: this.config.her_cid, timestamp })
    };

    try {
      const response = await handleEscalation(request);
      
      if (response.success) {
        console.log(`🚀 Escalation requested for issue ${params.issue_id}`);
      }
      
      return {
        success: response.success,
        contract_proposal: response.contract_proposal,
        error: response.error
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to request escalation: ${error.message}`
      };
    }
  }

  /**
   * Manage cross-branch contracts
   */
  async manageContract(params: {
    contract_id: string;
    action: 'approve' | 'reject' | 'complete' | 'dispute';
    branch_id: string;
    completion_evidence?: any[];
  }): Promise<{
    success: boolean;
    contract?: any;
    error?: string;
  }> {
    const timestamp = Date.now();
    
    const request: BranchContractRequest = {
      requester: this.config.her_cid,
      contract_id: params.contract_id,
      action: params.action,
      branch_id: params.branch_id,
      completion_evidence: params.completion_evidence,
      timestamp,
      signature: await this.signRequest({ requester: this.config.her_cid, timestamp })
    };

    try {
      const response = await handleBranchContract(request);
      
      if (response.success) {
        console.log(`📋 Contract ${params.contract_id} ${params.action} successful`);
      }
      
      return {
        success: response.success,
        contract: response.contract,
        error: response.error
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to manage contract: ${error.message}`
      };
    }
  }

  /**
   * Get credit balance for current user or someone else
   */
  async getBalance(her_cid?: string): Promise<{
    success: boolean;
    balance?: CreditBalance;
    error?: string;
  }> {
    const target = her_cid || this.config.her_cid;
    
    try {
      const response = await handleGetBalance(target);
      
      return {
        success: response.success,
        balance: response.balance,
        error: response.error
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to get balance: ${error.message}`
      };
    }
  }

  // ============================================================================
  // Social System Integration Helpers
  // ============================================================================

  /**
   * Trigger credit integration for social system events
   * Used internally by social safety system
   */
  async triggerSocialIntegration(event_type: string, event_data: any) {
    try {
      const integration_result = await triggerCreditIntegration(event_type, event_data);
      
      // Process earn credit requests
      for (const earn_request of integration_result.credit_requests || []) {
        // Sign the request with the helper's key (would need proper key management)
        earn_request.signature = await this.signRequest({
          requester: earn_request.requester,
          timestamp: earn_request.timestamp
        });
        
        const result = await handleEarnCredit(earn_request);
        
        if (result.success) {
          console.log(`🎯 Auto-awarded ${result.credit_award} credits for ${earn_request.action.type}`);
        } else {
          console.warn(`⚠️ Auto-award failed: ${result.error}`);
        }
      }
      
      // Process spend requests (would need branch voting first)
      for (const spend_request of integration_result.spend_requests || []) {
        console.log(`💰 Spend request initiated: ${spend_request.purpose} (${spend_request.amount} credits)`);
        // Note: Spend requests need branch voting before they can be processed
      }
      
      // Process escalation requests
      for (const escalation_request of integration_result.escalation_requests || []) {
        escalation_request.signature = await this.signRequest({
          requester: escalation_request.requester,
          timestamp: escalation_request.timestamp
        });
        
        const result = await handleEscalation(escalation_request);
        
        if (result.success) {
          console.log(`🚀 Auto-escalation initiated for issue ${escalation_request.issue_id}`);
        } else {
          console.warn(`⚠️ Auto-escalation failed: ${result.error}`);
        }
      }
      
      return integration_result;
      
    } catch (error) {
      console.error('Social integration failed:', error);
      return {
        integration_type: 'error',
        error: error.message
      };
    }
  }

  // ============================================================================
  // Convenience Methods
  // ============================================================================

  /**
   * Quick helper for common actions
   */
  async helpedSomeone(params: {
    person_helped: string;
    help_type: 'support' | 'technical' | 'emotional' | 'resource' | 'advocacy';
    description: string;
    quality_rating?: number; // 1-5 scale
  }) {
    const base_awards = {
      support: 4,
      technical: 6, 
      emotional: 4,
      resource: 5,
      advocacy: 7
    };
    
    return await this.earnCredits({
      action_type: `help_${params.help_type}`,
      base_award: base_awards[params.help_type],
      description: params.description,
      people_helped: [params.person_helped],
      evidence_confidence: params.quality_rating ? params.quality_rating / 5 : 0.7,
      diversity_factor: 1.0,
      witnesses: [params.person_helped]
    });
  }

  /**
   * Quick helper for organizing events
   */
  async organizedEvent(params: {
    event_type: 'meeting' | 'workshop' | 'support_group' | 'community_gathering';
    participants: string[];
    duration_hours: number;
    description: string;
  }) {
    const base_awards = {
      meeting: 4,
      workshop: 8,
      support_group: 6,
      community_gathering: 5
    };
    
    return await this.earnCredits({
      action_type: `organize_${params.event_type}`,
      base_award: Math.round(base_awards[params.event_type] * Math.min(2, params.duration_hours)),
      description: params.description,
      people_helped: params.participants,
      evidence_confidence: 0.9, // Event organization is highly verifiable
      diversity_factor: Math.min(1.6, 1.0 + params.participants.length * 0.1),
      witnesses: params.participants.slice(0, 3)
    });
  }

  /**
   * Quick helper for requesting help
   */
  async requestHelp(params: {
    help_type: 'technical' | 'resource' | 'advocacy';
    estimated_hours: number;
    description: string;
    branch_id: string;
  }) {
    // This would trigger the spending flow with branch approval
    const cost = Math.min(20, params.estimated_hours * 2);
    
    console.log(`🙋 Help request: ${params.description} (estimated cost: ${cost} credits)`);
    console.log('Note: This requires branch approval before credits are spent.');
    
    return {
      estimated_cost: cost,
      requires_branch_approval: true,
      help_type: params.help_type,
      description: params.description
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async signRequest(data: { requester: string; timestamp: number }): Promise<string> {
    // TODO: Implement actual Ed25519 signing
    // For now, return a placeholder signature
    const message = `${data.requester}:${data.timestamp}`;
    return `ed25519_signature_${Buffer.from(message).toString('hex').slice(0, 16)}`;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a credit client instance
 */
export function createCreditClient(config: CreditClientConfig): CreditClient {
  return new CreditClient(config);
}

/**
 * Create a client from environment variables (for server-side use)
 */
export function createCreditClientFromEnv(): CreditClient {
  const config = {
    api_base_url: process.env.CREDIT_API_URL,
    private_key: process.env.CREDIT_PRIVATE_KEY!,
    public_key: process.env.CREDIT_PUBLIC_KEY!,
    her_cid: process.env.HER_CID!
  };
  
  if (!config.private_key || !config.public_key || !config.her_cid) {
    throw new Error('Missing required environment variables: CREDIT_PRIVATE_KEY, CREDIT_PUBLIC_KEY, HER_CID');
  }
  
  return new CreditClient(config);
}

// ============================================================================
// Usage Examples
// ============================================================================

/*
// Basic usage:
const client = createCreditClient({
  private_key: 'ed25519_private_key_here',
  public_key: 'ed25519_public_key_here', 
  her_cid: 'bafk...user_her_cid'
});

// Earn credits for helping someone:
await client.helpedSomeone({
  person_helped: 'bafk...friend_her_cid',
  help_type: 'technical',
  description: 'Helped debug their website issue',
  quality_rating: 4
});

// Check balance:
const balance = await client.getBalance();
console.log(`Current balance: ${balance.balance?.balance} credits`);

// Organize a community event:
await client.organizedEvent({
  event_type: 'workshop',
  participants: ['bafk...p1', 'bafk...p2', 'bafk...p3'],
  duration_hours: 2,
  description: 'Web development workshop for beginners'
});
*/