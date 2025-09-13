# Universal Token Social System

**Humans • Relations • Value/Math • Voting**

A defense-in-depth social layer that prioritizes human dignity, consent, and safety through cryptographic proofs, sovereign trust gates, and restorative processes.

## Core Philosophy

**No system can be literally 100% safe.** We design for maximal safety through:

- **Consent gates**: Survivor-controlled access and interaction limits
- **Least data**: Minimal disclosure with headers + commitments, not raw evidence  
- **Cryptographic proofs**: Tamper-evident records with offline verification
- **Restorative flows**: Repair-first approaches with controlled decay
- **Defense-in-depth**: Multiple safety layers with no single point of failure

## Architecture Principles

1. **Existence = Contribution**: Your presence here adds value to the network
2. **No Neutrality**: Safety requires active stance against harm
3. **Survivor-Gated**: Those affected control access, repair, and recovery processes
4. **Path Diversity**: Prevent domination through independent verification paths
5. **Bounded Impact**: Mathematical limits on individual influence
6. **Graceful Degradation**: System remains functional under attack or failure

## Core Components

### 🧑‍🤝‍🧑 People & Relations

- **Human Existence Records (HER)**: Self-sovereign cryptographic identity
- **Sponsor Networks**: Responsibility-weighted attestation chains  
- **Pairwise Trust**: Sovereign T_B(A) gates override global recommendations
- **Circle Meetings**: Small group trust building with consent and signatures

### 🧮 Math & Values

- **Ripple Networks**: 1/3ⁿ weighted responsibility propagation (bounded)
- **Trust Scoring**: S(A) with decay H and influence caps
- **Rating Budgets**: Equal μ allocation prevents wealth-based domination
- **Diversity Indices**: Path-independent verification measures
- **Safety Tiers**: Impact I = C×s×k determines friction levels, never erasure

### 🗳️ Voting & Consensus

- **Proposal System**: Structured questions with context and scope
- **Signed Ballots**: Cryptographic voting with stance ∈ [-1, +1]
- **Robust Aggregation**: Trimmed means resistant to brigading
- **Quorum Rules**: Unanimity/consensus/hybrid thresholds with path diversity

### 🛡️ Safety & Support

- **Issue Headers**: Severity s, confidence k, scope without doxxing
- **Sealed Evidence**: Encrypted blobs with merkle commitments
- **Repair Paths**: Survivor-controlled healing processes with decay
- **Support Routes**: Region-specific resources, escalation playbooks
- **Consent Management**: Revocation, cooldowns, anti-coercion timing

## Data Flow & Privacy

### What's Stored Where

```
Local Device:
├─ Full HER + private keys
├─ Pairwise trust gates (T_me(others))
├─ Issue evidence (encrypted, if survivor)
├─ Local audit log (who accessed what)
└─ Support resources (offline-capable)

Network (Content-Addressed):
├─ HER headers (no PII)
├─ Issue headers + merkle roots
├─ Signed ballots + aggregated results  
├─ Meeting records (pseudonymous if needed)
└─ Repair path status (survivor-controlled)

Never Stored:
├─ Raw evidence details
├─ Precise geolocation
├─ Biometric data (only hashes if chosen)
└─ Private correspondence
```

### Access Controls

1. **Pairwise Gates**: T_B(A) ∈ {allow, cautious, block} - B controls access from A
2. **Consent Switches**: Reversible sharing with cooldown periods  
3. **Survivor Priority**: Those affected control issue visibility and repair
4. **Rate Limits**: Anti-spam and safety throttles per interaction type
5. **Local Heuristics**: Abuse detection runs on-device only

## Safety Guarantees & Limits

### What We Protect Against

✅ **Sybil attacks**: Sponsor network topology + ripple decay  
✅ **Brigading**: Trimmed aggregation + path diversity requirements  
✅ **Coercion**: Cooldown periods + local-only detection heuristics  
✅ **Doxxing**: Headers only, sealed evidence, content addressing  
✅ **Platform capture**: Multi-layer replication (IPFS/Arweave/DNS/Torrent)  
✅ **Economic domination**: Equal budgets, influence caps, diversity indices

### What We Cannot Fully Prevent

⚠️ **Determined attackers**: With enough resources, motivated harm is possible  
⚠️ **Social engineering**: Human psychology vulnerabilities persist  
⚠️ **State-level actors**: Advanced persistent threats exceed our scope  
⚠️ **Physical world harm**: Digital safety tools have real-world limits  
⚠️ **Perfect privacy**: Zero-knowledge proofs add complexity/performance costs

### Our Commitment

- **Transparent limitations**: We document what we can and cannot protect
- **Continuous improvement**: Regular security audits and protocol updates
- **Community governance**: Safety policies evolve with survivor input  
- **Open source**: All safety mechanisms are auditable and forkable
- **Graceful exit**: Data export tools for migration to better systems

## Quick Start

```bash
# Initialize your social identity
utk social init --sponsors alice,bob,charlie

# Set pairwise trust levels  
utk social trust-set --target QmSomeCID --level cautious

# File a safety issue (headers only)
utk social issue-create --type safety --severity 0.8 --confidence 0.9

# Vote on a proposal
utk social vote --proposal QmProposalCID --stance 0.6

# Request in-person meeting (with consent)
utk social invite --type in_person --duration 2h --location "coffee shop"

# Check your trust dial
utk social trust-dial --show-evidence
```

## Contributing to Safety

We welcome contributions that strengthen human dignity and safety:

1. **Security audits** of cryptographic implementations
2. **UX research** on consent flows and abuse reporting
3. **Mathematical proofs** of system bounds and properties
4. **Support resources** for specific regions or communities
5. **Educational materials** on digital safety and consent

### Red Lines

We will not implement features that:
- Enable surveillance or stalking
- Require sacrificing survivor agency
- Create single points of control or failure
- Encourage addictive or compulsive usage patterns
- Violate mathematical bounds on individual influence

## License & Governance

Dual licensed under Apache-2.0 and CC-BY-SA-4.0. Safety policies and protocols are governed through the proposal system with heightened consensus requirements for changes affecting survivor agency or privacy guarantees.

---

*Building safer communities through mathematics, cryptography, and human-centered design.*