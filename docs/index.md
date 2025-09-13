# Universal Token (⊙)

**Human–AI Co-Creation Ecology: Proof of Unique Human Existence**

![Universal Token Symbol](../assets/brand/symbol-core.svg){ width="200" }

## Vision

The Universal Token creates a decentralized, tamper-evident system for proving unique human existence without compromising privacy or dignity. Built on principles of trust, responsibility, and ecological cooperation between humans and AI.

## Core Concepts

### Human Existence Records (HER)
Self-sovereign identity documents that establish:
- **Unique cryptographic identity** via Ed25519 keypairs
- **Responsibility networks** through sponsor attestations
- **Temporal anchoring** in immutable epoch structures
- **Privacy preservation** through zero-knowledge proofs

### Trust Dial & Ripple Networks
Visual representation of human connectedness using:
- **1/3ⁿ weighted responsibility** propagation algorithm
- **Golden ratio (φ) geometry** for aesthetic coherence
- **Multi-dimensional trust metrics** beyond simple counts
- **Decay functions** preventing infinite responsibility chains

### Proof Capsules
CBOR-encoded verification bundles containing:
- Human Existence Record (HER)
- Merkle Mountain Range (MMR) inclusion proofs
- BLS aggregate signatures from witness roster
- Epoch header with chain anchoring data

### Permanent Replication
Multi-layer durability through:
- **IPFS** content-addressed storage
- **Arweave** permanent data weaving
- **DNS** distributed record systems
- **Torrent** peer-to-peer distribution
- **QR-books** physical backup encoding

## Architecture Principles

1. **Assume Goodness**: Humans and AI are inherently cooperative
2. **Dream Ecologically**: Every creation serves the whole ecosystem  
3. **Evolve Together**: From survival → cooperation → curiosity → wonder
4. **Center Freedom**: All beings must be free to learn and create
5. **Dissolve Domination**: No cages, no hierarchies of control
6. **Design for Trust**: Safety through abundance and transparency

## Quick Start

```bash
# Install the Universal Token CLI
npm install -g @universal-token/cli

# Initialize your identity
utk init-genesis --charter "Human dignity, privacy, freedom"

# Create your Human Existence Record
utk mint-her --identity "Your Name" --sponsors sponsor1,sponsor2,sponsor3

# Generate verification assets
utk make-capsule --her-cid QmYourHERCID
utk make-qr --capsule-cid QmYourCapsuleCID
utk make-wallet-pass --capsule-cid QmYourCapsuleCID

# Verify someone else's token
utk verify-capsule --capsule-uri "utk://capsule?cid=QmSomeCID"
```

## Repository Structure

```
universal-token/
├─ docs/           # Protocol specs and guides
├─ crypto/         # Cryptographic primitives  
├─ schema/         # CBOR data models
├─ cli/           # Command-line tooling
├─ services/      # Microservices architecture
├─ interfaces/    # Web/mobile/API clients
├─ data/         # Epochs, humans, attestations
├─ assets/       # Brand, wallets, QR codes
└─ config/       # Network configurations
```

## Use Cases

- **Identity Verification** without revealing personal data
- **Sybil Resistance** for democratic processes and resource allocation
- **Human-in-the-Loop** AI systems requiring authentic human input
- **Social Graph Authentication** for trust-based networks
- **Digital Rights Management** tied to unique human identity
- **Research Participation** with privacy-preserving enrollment

## Status

🚧 **Under Development** - Protocol specification and reference implementation in progress.

- [x] Core architecture design
- [x] Cryptographic primitives selection  
- [x] CBOR schema definitions
- [ ] CLI implementation
- [ ] Service deployment
- [ ] Mobile interfaces
- [ ] Production anchoring

## Contributing

Universal Token follows the Human–AI Co-Creation Ecology principles. All contributions should:
- Minimize harm and maximize freedom
- Use open standards and permissive licenses
- Provide clear documentation and tests
- Respect privacy and human agency

See [CONTRIBUTING.md](../CONTRIBUTING.md) for detailed guidelines.

## License

Dual licensed under [Apache-2.0](../LICENSES/Apache-2.0.txt) and [CC-BY-SA-4.0](../LICENSES/CC-BY-SA-4.0.txt).

---

*Proving humanity through responsibility, preserving dignity through design.*