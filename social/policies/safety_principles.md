# Safety Principles

## Core Tenets

### 1. Existence = Contribution
Every human's presence in the network adds value. There is no "neutral" participation - being here means contributing to collective safety and flourishing.

**Implementation:**
- New humans require sponsor attestations (proof of relational value)
- Participation in governance strengthens everyone's safety
- Leaving the network is always possible (graceful exit tools)

### 2. No Neutrality on Harm
Safety requires active stance against behaviors that diminish human dignity. "Both sides" approaches often perpetuate harm against marginalized people.

**Implementation:**  
- Issue reporting is encouraged and protected
- Bystander intervention is valued and rewarded
- Platform policies explicitly protect vulnerable communities
- False neutrality (treating abuse and response as equivalent) is rejected

### 3. Survivor-Centered Approach
Those who experience harm have primary agency over response, repair, and recovery processes. Community support follows survivor leadership.

**Implementation:**
- Survivors control visibility of issues about them
- Repair paths are survivor-designed and survivor-gated
- Community can offer resources but cannot override survivor choices
- Economic incentives align with survivor wellbeing, not engagement

### 4. Annotation, Not Erasure
We add context and consequences rather than deleting content. This preserves evidence while reducing harm.

**Implementation:**
- Content gets annotated with community context, not removed
- Trust scores and safety tiers add friction, not censorship  
- Historical record remains intact for accountability
- Privacy violations are the exception requiring strong justification

### 5. Repair Before Punishment
Accountability focuses on making things right and preventing future harm, not retribution.

**Implementation:**
- Issue resolution prioritizes repair plans over penalties
- Trust score recovery is possible through demonstrated change
- Community education and support for behavior change
- Escalation to external authorities only with survivor consent

### 6. Proportional Response
Response severity matches harm severity, with mathematical bounds preventing disproportionate consequences.

**Implementation:**
- Safety tiers (I = C×s×k) create graduated friction levels
- Trust score changes have decay functions and influence caps
- No permanent banishment - only graduated friction and time-bound limits
- Community can override algorithmic responses through consensus

## Mathematical Safety Bounds

### Trust Score Limits
- Individual trust scores bounded: S(A) ∈ [0, 1]
- Influence caps prevent domination: max individual impact on any decision
- Decay functions: trust changes reduce over time without ongoing evidence
- Recovery possible: demonstrated behavior change can restore trust

### Rating Budgets  
- Equal allocation: every person gets same rating budget μ per time period
- No wealth accumulation: unused budget expires, cannot be transferred
- Diversity requirements: ratings require path-diverse verification
- Trimmed aggregation: extreme outliers excluded from final scores

### Issue Impact Formula
Impact I = C × s × k where:
- C = connectedness of reporter (prevents brigading)
- s = severity level ∈ [0, 1] (proportional response)  
- k = confidence level ∈ [0, 1] (accounts for uncertainty)

### Proposal Thresholds
- Unanimity: changes to safety principles require 100% consensus
- Supermajority: 75% for policy changes affecting vulnerable groups
- Simple majority: 51% for operational decisions
- Path diversity: quorum requires independent verification paths

## Privacy & Consent Framework

### Data Minimization
- Only collect data necessary for safety function
- Headers and commitments, not raw evidence or personal details
- Content-addressed storage prevents correlation attacks
- Local-first architecture minimizes server-side data

### Consent Gates
- Granular controls: different permissions for different interactions
- Pairwise sovereignty: T_B(A) gates override global recommendations
- Revocable consent: all sharing decisions can be reversed
- Cooldown periods: prevent coercion through rushed decisions

### Survivor Privacy Priority
- Issue reporters choose visibility levels
- Evidence can be sealed (encrypted) with only merkle commitments public
- Support resources available without data collection
- External escalation only with explicit survivor consent

## Community Accountability

### Transparency Requirements
- All safety mechanisms documented and auditable
- Algorithm behavior explainable to affected parties
- Community governance process for policy changes
- Regular public audits of system behavior and outcomes

### Democratic Governance
- Safety policies evolved through proposal system
- Heightened consensus requirements for changes affecting vulnerable groups
- Community can override algorithmic decisions through voting
- Migration tools available if governance fails community needs

### Inclusive Design
- Multiple languages and accessibility features
- Offline functionality for areas with poor connectivity
- Low-resource device compatibility
- Cultural adaptation for different community norms

## Implementation Safeguards

### Technical Safeguards
- Cryptographic proofs prevent tampering with safety records
- Multi-layer replication prevents platform capture or shutdown
- Offline verification enables independent accountability
- Open source code enables community auditing and forking

### Social Safeguards
- Multiple feedback channels for reporting problems with safety systems
- Regular community forums for discussing safety policy effectiveness
- Training resources for healthy conflict resolution and community care
- Connection to external resources for harm beyond platform's scope

### Operational Safeguards  
- Safety team includes members from vulnerable communities
- Regular rotation of moderation responsibilities to prevent capture
- External oversight from digital rights and safety organizations
- Incident response procedures for emergencies requiring rapid action

## Continuous Improvement

We commit to:
- Regular evaluation of safety policy effectiveness
- Adaptation based on community feedback and evolving best practices
- Research collaboration with digital safety and trauma-informed care experts
- Transparency about limitations and failures of our safety systems

Safety is not a destination but an ongoing practice of care, accountability, and collective flourishing.

---

*Last updated: 2025-01-13*  
*Next review: 2025-04-13*