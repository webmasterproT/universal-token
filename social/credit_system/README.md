# Universal Token Credit System

A mathematical credit system designed to incentivize care labor without creating domination. Credits flow to those who help others, with branch-based quorum approval for spending and automatic escalation to ensure "all are responsible for all."

## 🎯 Core Principles

- **Equal baseline worth**: No wealth multipliers or stake advantages
- **Non-transferable credits**: Cannot be traded or sold (soulbound to humans)
- **Care labor incentives**: Rewards support, mediation, repair work, community organization
- **Branch quorum approval**: Collective approval required for spending credits
- **Cross-branch escalation**: Issues that can't be resolved locally automatically escalate
- **Anti-domination safeguards**: Built-in protections against abuse and accumulation

## 📁 Directory Structure

```
social/credit_system/
├── README.md                           # This file
├── parameters.json                     # Default system parameters
├── math/
│   ├── credit_flow.ts                 # Core credit calculations (sections 3-7)
│   └── cross_branch.ts                # Escalation and neighbor selection (section 5)
├── schemas/cddl/
│   └── credit_transactions.cddl       # CBOR schemas for all credit operations
├── api/
│   └── credit_endpoints.ts            # REST API endpoints
├── client/
│   └── credit_sdk.ts                  # Client SDK for applications
└── integrations/
    └── safety_system_hooks.ts         # Integration with social safety system
```

## 🧮 Mathematical Model

### Credit Award Formula

When someone helps others, they earn credits based on:

```
ΔCR_h = w_a × k × ρ × (β₀ + β₁ × C(h,S)) × σ(θ - CR̄_B(h))
```

Where:
- `w_a`: Base award for action type (e.g., 3 for support, 8 for mediation)
- `k`: Evidence confidence (0-1, how verifiable the help was)
- `ρ`: Diversity factor (higher when helping diverse groups)
- `C(h,S)`: Connectedness between helper and helped people (0-1)
- `β₀, β₁`: Connection weighting (0.6, 0.4 default)
- `σ(θ - CR̄_B)`: Sigmoid scarcity bonus when branch needs credits

### Branch Quorum Requirements

To spend credits, your branch must approve via:
- **Participation**: ≥40% of members vote
- **Path diversity**: ≥3 different social paths represented  
- **Approval threshold**: Trimmed mean ≥0.6 (60% approval)

### Cross-Branch Escalation

Issues escalate when local branch capacity is exceeded:

```
E(B₀,X) = γ₁×I_B₀(X) + γ₂×(OpenNeeds/|B|) + γ₃×(1-ρ_B₀)
```

Triggers when E > 0.4 (threshold), automatically finding neighbor branches to help.

## 🚀 Quick Start

### 1. Basic Usage

```typescript
import { createCreditClient } from './client/credit_sdk.js';

const client = createCreditClient({
  private_key: 'your_ed25519_key',
  public_key: 'your_public_key', 
  her_cid: 'your_human_existence_record_cid'
});

// Earn credits for helping someone
await client.helpedSomeone({
  person_helped: 'friend_her_cid',
  help_type: 'technical',
  description: 'Helped debug their website',
  quality_rating: 4
});

// Check your balance
const balance = await client.getBalance();
console.log(`Balance: ${balance.balance?.balance} credits`);
```

### 2. Organizing Events

```typescript
// Earn credits for organizing community events
await client.organizedEvent({
  event_type: 'workshop',
  participants: ['person1_cid', 'person2_cid', 'person3_cid'],
  duration_hours: 2,
  description: 'Web development workshop for beginners'
});
```

### 3. Branch Spending (Requires Approval)

```typescript
// Request to spend credits (needs branch votes first)
await client.spendCredits({
  amount: 10,
  purpose: 'Fund technical support for community members',
  spend_type: 'local',
  branch_votes: [
    { voter: 'member1_cid', vote: 0.8, signature: 'sig1' },
    { voter: 'member2_cid', vote: 0.7, signature: 'sig2' },
    // ... more votes to reach quorum
  ]
});
```

## 🔗 Integration with Social Safety System

The credit system automatically integrates with existing social components:

```typescript
import { triggerCreditIntegration } from './integrations/safety_system_hooks.js';

// When someone resolves an issue, they automatically earn credits
const result = await triggerCreditIntegration('issue.resolved', {
  issue_id: 'issue_123',
  helpers: ['helper1_cid', 'helper2_cid'],
  resolution_type: 'mediation',
  subject_set: ['affected_person_cid']
});
```

### Automatic Credit Events

| Social Action | Credit Award | Integration Point |
|---------------|--------------|-------------------|
| Resolve support issue | 3-12 credits | `issue.resolved` |
| Provide emotional support | 4 credits | `support.provided` |
| Organize community meeting | 4-8 credits | `meeting.completed` |
| Mediate conflict | 8 credits | `issue.resolved` (mediation) |
| Participate in voting | 1 credit | `voting.participation` |

## 🛡️ Anti-Abuse Safeguards

- **Evidence requirements**: All credit awards need confidence scores and witnesses
- **Branch quorum**: No individual can spend credits alone
- **Path diversity**: Prevents voting cliques from dominating approvals  
- **Budget caps**: Per-human (100 credits) and per-epoch system limits
- **Decay mechanism**: Credits slowly decay to prevent hoarding
- **Appeal system**: Disputed actions can be escalated for review

## ⚙️ Default Parameters

Key system parameters (configurable):

```json
{
  "C_max": 100,          // Max credits per person
  "I_max": 10000,        // Max credits issued per epoch  
  "alpha": 0.4,          // Min participation rate for quorum
  "q": 3,                // Min path diversity
  "tau": 0.6,            // Approval threshold
  "delta": 0.98,         // Credit decay rate
  "Theta_esc": 0.4,      // Escalation trigger threshold
  "c_local": 2,          // Cost for local help
  "c_xbranch": 5,        // Cost for cross-branch help
  "c_global": 10         // Cost for global escalation
}
```

## 🏗️ Architecture

### Core Components

1. **Math Layer** (`math/`): Pure mathematical functions for credit calculations
2. **API Layer** (`api/`): REST endpoints for credit operations  
3. **Integration Layer** (`integrations/`): Hooks into social safety system
4. **Client Layer** (`client/`): Easy-to-use SDK for applications
5. **Schema Layer** (`schemas/`): CBOR/JSON data validation

### Key Interfaces

```typescript
// Credit earning event
interface EarnEvent {
  helper: string;
  action: { type: string; base_award: number; description: string };
  subject_set: string[];
  evidence_confidence: number;
  diversity_factor: number;
  proximity_score: number;
  branch_avg_credits: number;
}

// Branch approval for spending
interface BranchApproval {
  branch_id: string;
  voters: string[];
  votes: number[];
  participation_rate: number;
  path_diversity_score: number;
  trimmed_mean: number;
  approved: boolean;
}

// Cross-branch escalation contract
interface CrossBranchContract {
  requesting_branch: string;
  helping_branches: string[];
  issue: any;
  tasks: string[];
  timebox_hours: number;
  cost: number;
  status: 'proposed' | 'active' | 'completed' | 'failed' | 'disputed';
}
```

## 🧪 Testing & Validation

The system includes comprehensive mathematical validation:

```typescript
// Example validation from the worked micro-example
const validation = {
  branch_B0_size: 6,
  issue_connectedness: 0.5,
  open_needs_ratio: 0.4,
  expected_escalation_score: 0.43,
  escalation_triggered: true,
  neighbor_scores: [
    { branch: 'B1', score: 0.75, recommended: true },
    { branch: 'B2', score: 0.41, recommended: false }
  ]
};
```

## 🌐 Production Deployment

### Environment Variables

```bash
CREDIT_API_URL=https://your-api.com
CREDIT_PRIVATE_KEY=your_ed25519_private_key
CREDIT_PUBLIC_KEY=your_ed25519_public_key
HER_CID=your_human_existence_record_cid
```

### Integration Points

The credit system connects with:
- **Issue reporting system**: Auto-awards for helping resolve issues
- **Support request system**: Funding mechanism for resource-intensive help
- **Meeting coordination**: Credits for organizing and facilitating
- **Trust/voting systems**: Small rewards for democratic participation
- **Branch management**: Quorum approval and escalation pathways

## 📖 Mathematical Specification

This implementation is based on a comprehensive 12-section mathematical specification covering:

1. **Notation & Sets**: Human nodes, branches, connectedness measures
2. **Credits Purpose & Constraints**: Incentivize care labor without domination
3. **Credit Balances & Units**: Per-human caps, system issuance limits
4. **Earning Credits**: Action-based awards with proximity and scarcity bonuses
5. **Spending Credits**: Collective branch approval requirements
6. **Cross-Branch Escalation**: Automatic neighbor selection and contracts
7. **System-Level Conservation**: Epoch budgets and neutrality targets
8. **Credit Decay**: Soft demurrage to prevent hoarding
9. **Safeguards & Anti-Abuse**: Evidence, diversity, and appeal mechanisms
10. **"All Are Responsible for All"**: Mathematical emergence through ripple effects
11. **Parameter Set**: Tuned defaults for real-world operation
12. **Implementation Hooks**: Integration points with existing social systems

For the complete mathematical specification, see the original design document.

## 🤝 Contributing

The credit system is part of the Universal Token Human–AI Co-Creation Ecology. Contributions should:

- Maintain mathematical consistency with the specification
- Preserve anti-domination safeguards
- Include comprehensive test coverage
- Follow the existing TypeScript patterns
- Document changes to parameters or algorithms

## 📜 License

Dual licensed under Apache-2.0 and CC-BY-SA-4.0 to enable both commercial use and knowledge sharing.