# ChronoShield - Quantum-Safe Data Flow & HNDL Risk Intelligence Platform

## What This Is
ChronoShield is an enterprise-grade, security-by-design AI platform engineered for the IBM Z Datathon theme "Secure & Responsible AI". It detects "Harvest Now, Decrypt Later" (HNDL) exposure where classical encryption expires before sensitive data shelf-life terminates ($X + Y > Z$), detects active exfiltration anomalies using ML with SHAP explanations, enforces strict OPA ABAC and Presidio PII redaction, provides an IBM Granite-powered local RAG assistant, and proves mitigation via hybrid post-quantum cryptography (X25519 + ML-KEM-768) and ML-DSA signed audit trails.

## Core Value
Identify cryptographic debt and quantum vulnerability timelines across enterprise assets and data flows before adversaries can exploit them, providing mathematically sound risk scoring (Mosca's Inequality via Monte Carlo) and verified hybrid quantum-safe migration pathways mapped to IBM Z architectures.

## Stated Constraints & Architecture
- **IBM Z Alignment**: Portable LinuxONE/s390x multi-arch compatibility, Crypto Express HSM / SoftHSM mapping, IBM Z Telum II / zDLC ONNX inference portability, IBM Granite LLM integration.
- **Privacy & Safety**: Synthetic data only (Faker + custom Presidio recognizers: Aadhaar, PAN, ABHA ID). Zero raw PII in LLMs, logs, or UI. OPA policy filtering before RAG retrieval.
- **PQC Standards**: NIST FIPS 203 (ML-KEM-768) and FIPS 204 (ML-DSA-65) with liboqs / liboqs-python.
- **Immutable Audit**: SHA-256 hash-chained log signed entry-by-entry with ML-DSA and an independent verification endpoint.

## Requirements

### Validated
(None yet — greenfield project)

### Active
- [ ] Phase 0: Repo scaffold, docker-compose, Keycloak OIDC realm/roles, OPA ABAC policies, CI workflow
- [ ] Phase 1: Cryptographic AST/regex scanner + TLS prober -> CycloneDX 1.6 CBOM with quantum risk taxonomy
- [ ] Phase 2: Synthetic data generator, Presidio PII detection (custom Aadhaar/PAN/ABHA), shelf-life policy table, data-flow graph
- [ ] Phase 3: Mosca inequality Monte Carlo engine ($X + Y > Z$, 10k draws), priority scoring, dual-timeline data
- [ ] Phase 4: Synthetic HNDL log generator, Isolation Forest + PyTorch Autoencoder anomaly detection, SHAP explainers, ONNX export
- [ ] Phase 5: Security core with Keycloak JWT auth, OPA ABAC middleware, Presidio redaction proxy, differential privacy, ML-DSA signed hash chain
- [ ] Phase 6: Secure local RAG assistant (IBM Granite via Ollama / mockable fallback, ChromaDB, tool calling, prompt injection red-teaming)
- [ ] Phase 7: PQC benchmark & proof-of-concept (classical vs hybrid X25519+ML-KEM-768 via liboqs, migration simulation)
- [ ] Phase 8: Full-stack dark-mode React dashboard (Overview, Flows dual-timeline, Alerts with SHAP, Assistant, Audit verifier, Live migration slider)
- [ ] Phase 9: Comprehensive documentation, STRIDE threat model, IBM Z platform mapping, test suite, and automated `make demo` script

### Out of Scope
- Production HSM physical provisioning (simulated via SoftHSM2 and mapped to IBM Crypto Express in docs).
- Proprietary closed-source cloud LLMs (strictly local IBM Granite via Ollama).

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Hybrid Key Exchange (X25519 + ML-KEM-768) | NIST & BSI recommend hybrid mode for transition safety | Pending Phase 7 |
| CycloneDX 1.6 CBOM | Industry standard cryptographic bill of materials format | Pending Phase 1 |
| Dual Anomaly ML (IsoForest + PyTorch Autoencoder) | Shallow tree speed + deep reconstruction error capture subtle exfil patterns | Pending Phase 4 |
| OPA ABAC Prior to RAG Retrieval | Guarantees context never leaks unauthorized records even if LLM hallucinated | Pending Phase 5/6 |
| ML-DSA Signed Hash Chain | Quantum-resistant non-repudiation for audit trail integrity | Pending Phase 5 |

---
*Last updated: 2026-10-18 after initialization*
