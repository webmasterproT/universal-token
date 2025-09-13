# Universal Human Genesis Ledger (UHGL) - RFC Specification

**Status**: Draft  
**Version**: 0.1.0  
**Authors**: Universal Token Contributors  
**Date**: 2025-01-13  

## Abstract

The Universal Human Genesis Ledger (UHGL) defines a decentralized protocol for proving unique human existence through responsibility networks, cryptographic attestations, and distributed permanence. This RFC specifies the core data structures, algorithms, and network protocols required for tamper-evident human identity verification without compromising privacy or dignity.

## 1. Introduction

### 1.1 Motivation

Existing identity systems rely on centralized authorities, vulnerable databases, or privacy-compromising biometrics. UHGL provides an alternative approach based on:

- **Responsibility networks**: Social attestation through sponsor relationships
- **Cryptographic sovereignty**: Self-owned keys and proofs
- **Distributed permanence**: Multi-layer replication across networks
- **Privacy preservation**: Minimal disclosure and zero-knowledge proofs

### 1.2 Terminology

- **HER**: Human Existence Record - core identity document
- **Capsule**: CBOR-encoded verification bundle with proofs
- **Epoch**: Time-bounded collection of HERs with consensus anchoring
- **Sponsor**: Existing human who attests to new human's unique existence
- **Ripple**: Weighted responsibility propagation through sponsor network
- **Trust Dial**: Visual representation of human connectedness metrics

### 1.3 Requirements Language

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

## 2. System Architecture

### 2.1 Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Human Layer   │    │  Protocol Layer │    │ Consensus Layer │
│                 │    │                 │    │                 │
│ • HER Creation  │────│ • CBOR Encoding │────│ • Epoch Building│
│ • Key Management│    │ • Proof Capsule │    │ • MMR Anchoring │
│ • Social Attest │    │ • URI Schemes   │    │ • BLS Signatures│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │Permanence Layer │
                    │                 │
                    │ • IPFS Storage  │
                    │ • Arweave Woven │
                    │ • DNS Records   │
                    │ • Torrent Seeds │
                    │ • QR-book Print │
                    └─────────────────┘
```

### 2.2 Trust Model

The system assumes:

1. **Sponsor honesty**: Majority of sponsors verify unique human existence
2. **Cryptographic security**: Ed25519, BLS12-381, BLAKE3 remain secure  
3. **Network persistence**: At least one replication layer remains accessible
4. **Consensus reliability**: Majority of witnesses sign valid epoch headers

Threats mitigated:
- **Sybil attacks**: Limited by sponsor network topology and decay functions
- **Collusion**: Bounded by responsibility ripple algorithms (1/3ⁿ weighting)
- **Censorship**: Multi-layer permanence across decentralized networks
- **Privacy invasion**: Minimal disclosure and content addressing

## 3. Data Structures

### 3.1 Human Existence Record (HER)

```cddl
HER = {
  version: uint,
  created_at: timestamp,
  owner_keys: [+ public_key],
  sponsors: sponsor_set,
  personalization: identity_data,
  responsibility: responsibility_data,
  signatures: [+ signature]
}

sponsor_set = {
  required_count: 1..10,
  sponsor_refs: [+ her_cid]
}

identity_data = {
  identity_line: tstr,
  ? bio_hash: bytes,
  ? location_region: tstr,
  ? timestamp_range: [timestamp, timestamp]
}

responsibility_data = {
  layer1: bytes,
  ? ripple_roots: [+ merkle_root]
}
```

### 3.2 Proof Capsule

```cddl
Capsule = {
  her_bytes: bytes,
  her_cid: cid,
  mmr_proof: [+ merkle_node],
  epoch_header: EpochHeader,
  bls_signature: bytes,
  roster_pub: [+ bls_public_key]
}

EpochHeader = {
  epoch_id: uint,
  mmr_root: merkle_root,
  prev_epoch: ? bytes,
  witness_count: uint,
  created_at: timestamp,
  chain_anchors: [+ ChainAnchor]
}

ChainAnchor = {
  chain_id: tstr,
  block_height: uint,
  tx_hash: bytes,
  confirmation_count: uint
}
```

### 3.3 Cryptographic Primitives

- **Hash Function**: BLAKE3 (256-bit output)
- **Signature Scheme**: Ed25519 for HER signing
- **Aggregate Signatures**: BLS12-381 for epoch consensus
- **Content Addressing**: CIDv1 with BLAKE3 multihash
- **Encoding**: CBOR (RFC 7049) for all structured data

## 4. Algorithms

### 4.1 Sponsor Verification

For HER creation, sponsors MUST:

1. **Verify unique existence**: Confirm applicant is unique human
2. **Generate attestation**: Sign attestation with Ed25519 key
3. **Submit to network**: Broadcast attestation to witness roster
4. **Maintain liveness**: Respond to challenge-response verification

```pseudocode
function verify_sponsors(her, sponsor_attestations):
    required = her.sponsors.required_count
    if len(sponsor_attestations) < required:
        return ERROR_INSUFFICIENT_SPONSORS
    
    for attestation in sponsor_attestations:
        if not verify_signature(attestation.signature, attestation.sponsor_key):
            return ERROR_INVALID_SIGNATURE
        if not is_valid_sponsor(attestation.sponsor_cid):
            return ERROR_INVALID_SPONSOR
    
    return SUCCESS
```

### 4.2 Responsibility Ripple Calculation

```pseudocode
function calculate_ripple(her_cid, depth=6):
    if depth <= 0:
        return {her_cid: 1.0}
    
    direct_sponsors = get_sponsors(her_cid)
    ripple_vector = {}
    
    for sponsor in direct_sponsors:
        weight = 1.0 / (3.0 ** depth)  # 1/3^n decay
        sponsor_ripple = calculate_ripple(sponsor, depth-1)
        
        for target, responsibility in sponsor_ripple.items():
            if target not in ripple_vector:
                ripple_vector[target] = 0.0
            ripple_vector[target] += weight * responsibility
    
    return ripple_vector
```

### 4.3 Epoch Consensus

```pseudocode
function build_epoch(her_submissions, witness_roster):
    # Build Merkle Mountain Range of all HERs
    mmr = MMR()
    for her in her_submissions:
        mmr.append(her.cid)
    
    # Create epoch header
    epoch_header = EpochHeader{
        epoch_id: current_epoch_id,
        mmr_root: mmr.root(),
        witness_count: len(witness_roster),
        created_at: current_timestamp(),
        chain_anchors: []  # Filled by anchoring service
    }
    
    # Collect BLS signatures from witness roster
    signatures = []
    for witness in witness_roster:
        sig = witness.sign_bls(canonical_bytes(epoch_header))
        signatures.append(sig)
    
    # Aggregate signatures
    aggregate_sig = bls_aggregate(signatures)
    
    # Anchor to external chains
    for chain in configured_chains:
        anchor = chain.submit_transaction(epoch_header.mmr_root)
        epoch_header.chain_anchors.append(anchor)
    
    return epoch_header, aggregate_sig
```

## 5. Network Protocols

### 5.1 URI Schemes

Universal Token resources use the `utk://` URI scheme:

```abnf
utk-uri = "utk://" resource-type "?" query-params
resource-type = "her" / "capsule" / "epoch" / "attestation"
query-params = param *("&" param)
param = param-name "=" param-value
param-name = 1*unreserved
param-value = 1*unreserved
```

Examples:
- `utk://her?cid=QmYourHERCID`
- `utk://capsule?cid=QmCapsuleCID&epoch=1234`
- `utk://epoch?id=1234&mmr_root=0x...`

### 5.2 Verification Protocol

```http
POST /verify HTTP/1.1
Host: verifier.utk.network
Content-Type: application/cbor

[CBOR-encoded Capsule]

HTTP/1.1 200 OK
Content-Type: application/json

{
  "valid": true,
  "her_cid": "QmYourHERCID",
  "epoch_id": 1234,
  "trust_metrics": {
    "connectedness": 0.75,
    "ripple_diversity": 0.82,
    "temporal_consistency": 0.91
  },
  "verification_time": "2025-01-13T12:00:00Z"
}
```

## 6. Security Considerations

### 6.1 Sybil Resistance

The protocol provides Sybil resistance through:

1. **Sponsor requirements**: New HERs require attestations from existing humans
2. **Network topology**: Responsibility ripples create natural clustering
3. **Decay functions**: 1/3ⁿ weighting limits infinite responsibility chains
4. **Temporal constraints**: Epoch boundaries prevent retroactive manipulation

### 6.2 Privacy Protection

Personal data is minimized through:

1. **Content addressing**: CIDs reveal no personal information
2. **Hash commitments**: Bio-hash binds identity without revealing details
3. **Selective disclosure**: Only necessary proofs included in capsules
4. **Local storage**: Full HER remains on user's devices

### 6.3 Availability Guarantees

Multi-layer replication ensures data availability:

1. **IPFS**: Content-addressed, peer-to-peer replication
2. **Arweave**: Permanent storage with economic incentives
3. **DNS**: Distributed name resolution with TXT records
4. **Torrent**: BitTorrent protocol for mass distribution
5. **QR-books**: Physical paper backup encoding

## 7. Implementation Guidelines

### 7.1 CLI Reference Implementation

The `utk` command-line tool provides:

- `utk init-genesis`: Initialize protocol parameters
- `utk mint-her`: Create Human Existence Record
- `utk make-capsule`: Build verification capsule with proofs
- `utk verify-capsule`: Verify capsule authenticity
- `utk make-qr`: Generate QR codes for sharing
- `utk make-wallet-pass`: Create Apple/Google wallet passes

### 7.2 Service Architecture

Microservices deployment:

- **Generator**: HER minting and capsule creation
- **Verifier**: Stateless capsule verification
- **Ripple**: Responsibility network analysis
- **Anchor**: Epoch building and chain anchoring
- **Media**: SVG generation and wallet pass creation

### 7.3 Integration Patterns

Partner systems integrate via:

```graphql
query IsHuman($cid: String!) {
  human(cid: $cid) {
    valid
    connectedness
    verifiedAt
    trustMetrics {
      rippleDiversity
      temporalConsistency
      socialGraphDepth
    }
  }
}
```

## 8. IANA Considerations

This document registers the `utk` URI scheme with the following properties:

- **Scheme name**: utk
- **Status**: Provisional
- **Applications**: Universal Token human identity verification
- **Contact**: Universal Token Contributors
- **Reference**: This RFC

## 9. References

### 9.1 Normative References

- RFC 2119: Key words for use in RFCs
- RFC 7049: Concise Binary Object Representation (CBOR)
- RFC 8152: CBOR Object Signing and Encryption (COSE)

### 9.2 Informative References

- IPFS: InterPlanetary File System
- Arweave: The Arweave Protocol
- BLS Signatures: BLS12-381 Curve Specification
- Ed25519: High-Speed High-Security Signatures

---

**Authors' Addresses**

Universal Token Contributors  
Email: contributors@universaltoken.org  
GitHub: https://github.com/tiation-repos/universal-token