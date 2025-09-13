# Consent Policy

## Foundational Principles

**Consent is ongoing, revocable, and context-specific.** All interactions within the Universal Token social system must respect human agency and the right to change one's mind.

### Core Consent Values

1. **Informed**: People understand what they're agreeing to
2. **Voluntary**: No coercion, manipulation, or undue pressure  
3. **Specific**: Consent for one thing doesn't imply consent for others
4. **Revocable**: Can be withdrawn at any time
5. **Ongoing**: Must be maintained, not just obtained once

## Consent Gates & Pairwise Sovereignty

### T_B(A) Pairwise Trust Gates

Every person B controls their interaction level with every other person A:

- **Allow**: Full interaction capabilities
- **Cautious**: Limited interactions with additional friction
- **Block**: No direct interaction permitted

**Key Properties:**
- T_B(A) overrides global trust scores and recommendations
- Changes have cooldown periods to prevent coercion
- Local-only decisions (not broadcasted unless B chooses)
- Reversible at any time after cooldown period

### Gate Implementation

```
Interaction Request Flow:
1. A attempts to interact with B
2. System checks T_B(A) gate level
3. If "Block": interaction denied
4. If "Cautious": additional consent prompt shown to B
5. If "Allow": interaction proceeds normally
```

### Cooldown Periods

**Purpose**: Prevent coercion through repeated badgering or pressure

**Implementation:**
- Gate changes require 24-48 hour cooldown (severity-dependent)
- During cooldown, previous gate level remains in effect
- Emergency override available for safety situations (immediate block)
- Cooldown bypassed for upgrading trust level (cautious→allow, block→cautious)

## Data Sharing Consent

### Granular Permissions

Users control sharing at multiple levels:

1. **Profile Visibility**: name, emoji, region
2. **Relationship Data**: sponsor connections, circles
3. **Activity Data**: voting patterns, meeting participation  
4. **Trust Metrics**: connectedness scores, ripple influence
5. **Issue Involvement**: as reporter, witness, or subject

### Default Privacy Settings

**Conservative defaults** - users must opt-in to sharing:

- Profile: Name/emoji visible, region optional
- Relationships: Sponsor count visible, individual connections private
- Activity: Participation counts visible, specific votes private
- Trust: Aggregate scores visible, detailed breakdown private
- Issues: Header-only by default, full details require explicit consent

### Consent Revocation

**Implementation:**
- "Withdraw consent" button available on all sharing interfaces
- Data sharing stops within 24 hours of revocation
- Already-shared data marked for deletion/anonymization
- Network effects (trust scores) fade gracefully over decay period
- No penalties for withdrawing consent

## Issue Reporting & Evidence

### Survivor-Controlled Gates

For safety issues, survivors control:

1. **Visibility Level**: public header, trusted circles only, or fully private
2. **Evidence Sharing**: sealed (encrypted) or open commitments  
3. **Repair Process**: who can participate and what steps are included
4. **External Escalation**: if/when to involve external authorities

### Evidence Consent

**Sealed Evidence Model:**
- Only merkle commitments stored publicly
- Encrypted evidence stored locally or with trusted parties
- Decryption keys controlled by survivor
- Community sees headers (severity, confidence, scope) not details

**Open Evidence Requirements:**
- Explicit consent from all parties whose data is included
- Automatic expiration dates for evidence sharing
- Right to request redaction of personal details
- Appeals process for evidence disputes

## Meeting & Invitation Consent

### In-Person Meeting Requests

**Required Consent Elements:**
- Specific purpose and duration
- General location (region, not precise address)  
- Who else might be present
- Explicit "yes/no" response required (not silence=consent)

**Safety Protections:**
- Meeting location shared only after consent given
- Option to bring support person
- Revocation allowed up to 2 hours before meeting
- No negative consequences for declining invitations

### Support Requests

**"Ask for Help" Signals:**
- Broadcasted to trusted circles only (never public)
- Responders must be explicitly approved by requester
- Geographic constraints (within reasonable distance)
- Time limits and specific needs described

## Voting & Governance Consent

### Participation Consent

**Voting is Always Optional:**
- No requirements to vote on any proposal
- Abstention is a valid choice (not counted as "no")
- Anonymous voting option available
- Right to change vote during voting period

### Proposal Consent

**For Proposals Affecting Individuals:**
- Direct consent required from those most affected
- Granular consent for different aspects of proposals
- Sunset clauses requiring re-consent for long-term changes
- Appeal process for proposals made without proper consent

## Technical Implementation

### Consent Storage

**Local-First Architecture:**
- Consent preferences stored on user devices
- Encrypted backup to user-controlled cloud storage
- Consent history maintained for accountability
- Regular consent review prompts

### Consent Verification

**Cryptographic Proof:**
- Consent decisions signed with user's private key
- Timestamps and context included in consent records  
- Merkle commitments for consent audit trails
- Zero-knowledge proofs for sensitive consent decisions

### Consent UI/UX

**Design Principles:**
- Clear, plain language explanations
- Visual indicators of current consent state
- Easy access to consent revocation
- No dark patterns or consent manipulation
- Regular consent health checks

## Emergency Procedures

### Safety Override

**Immediate Protection:**
- Block gate can be set instantly in safety situations
- Emergency contact notifications available
- Support resources provided without data collection
- External escalation pathways clearly marked

### Consent Violations

**Response Protocol:**
1. Immediate suspension of violating interactions
2. Investigation with survivor leadership
3. Repair process designed by survivor
4. Community education about consent violations
5. System improvements to prevent similar violations

## Community Education

### Consent Culture Building

**Ongoing Education:**
- Regular workshops on consent practices
- Peer support networks for consent questions
- Clear examples of good consent practices
- Community accountability for consent culture

### Resource Provision

**Support Materials:**
- Multilingual consent guides
- Accessibility accommodations for consent processes
- Cultural adaptation for different consent norms
- Training for community moderators on consent issues

## Monitoring & Improvement

### Consent Metrics

**System Health Indicators:**
- Rate of consent withdrawals (lower is better)
- Time to consent revocation implementation
- User satisfaction with consent control tools
- Frequency of consent-related disputes

### Regular Review

**Continuous Improvement:**
- Quarterly review of consent policy effectiveness
- Community feedback on consent experience
- External audit of consent implementation
- Updates based on best practices and new threats

---

**Key Insight:** True consent requires not just the right to say "no," but the practical ability to say "no" without significant cost or consequence. Our system design prioritizes making consent withdrawal as easy as consent granting.

*Last updated: 2025-01-13*  
*Next review: 2025-04-13*