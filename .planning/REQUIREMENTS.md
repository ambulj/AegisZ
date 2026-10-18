# ChronoShield - Requirements Matrix

## Non-Negotiable Security Requirements
- [ ] **REQ-SEC-01**: Zero real personal data in development, testing, logs, or UI. Pure Faker-based synthetic data.
- [ ] **REQ-SEC-02**: Raw sensitive data values never reach the LLM or UI; only anonymized/tokenized metadata.
- [ ] **REQ-SEC-03**: All text dispatched to LLM passes through an active Presidio redaction proxy.
- [ ] **REQ-SEC-04**: Information retrieval is pre-filtered by OPA ABAC policies BEFORE context reaches the LLM prompt.
- [ ] **REQ-SEC-05**: Prompt-injection guardrail, output PII detector, and source citation engine attached to all assistant answers.
- [ ] **REQ-SEC-06**: Secrets managed strictly via environment variables/docker secrets; zero hardcoded secrets.
- [ ] **REQ-SEC-07**: Every query, alert view, and policy decision recorded in an ML-DSA signed SHA-256 hash-chained audit log.
- [ ] **REQ-SEC-08**: Complete STRIDE threat model documented in `docs/threat_model.md`.

## Functional Requirements by Phase
- [ ] **REQ-P0**: Repo scaffold, multi-service Docker Compose, Keycloak realm with roles (CISO, Auditor, DataSteward, Analyst), OPA rego policies, GitHub Actions CI.
- [ ] **REQ-P1**: Multi-language AST/regex crypto scanner (Python, Java, JS, YAML, Nginx) + TLS prober generating CycloneDX 1.6 CBOM with quantum taxonomy: quantum-vulnerable, quantum-weakened, quantum-safe, broken-today.
- [ ] **REQ-P2**: Synthetic data generator (Indian & global PII), custom Presidio recognizers (Aadhaar, PAN, ABHA ID), editable shelf-life policy matrix, data-flow graph mapping data stores to crypto assets.
- [ ] **REQ-P3**: Risk calculation engine executing Mosca's Inequality ($X + Y > Z$) via 10,000-iteration Monte Carlo with configurable triangular distribution for $Z$, outputting $P(\text{exposure})$, priority scores, and dual-timeline expiry models.
- [ ] **REQ-P4**: Synthetic HNDL log generator (3am bulk export, 50x spike, TLS downgrade, slow-and-low exfiltration), UNSW-NB15 dataset loader, Isolation Forest + PyTorch Autoencoder anomaly detector, SHAP feature importance, and ONNX export for IBM Z Telum.
- [ ] **REQ-P5**: Security enforcement core: Keycloak OIDC JWT validation, OPA ABAC middleware, Presidio redaction proxy, differential privacy aggregations (diffprivlib/Laplace mechanism) for lower-privileged roles, and SHA-256 + ML-DSA signed audit ledger with `/api/v1/audit/verify` verification.
- [ ] **REQ-P6**: Secure RAG assistant: local IBM Granite model via Ollama (with mockable fallback for environments without Ollama runtime), ChromaDB vector store, tools (`get_top_risks`, `explain_alert`, `generate_migration_plan`), 20-prompt injection red-team harness with automated block rate reporting.
- [ ] **REQ-P7**: PQC Proof-of-Concept & benchmark: classical (ECDH X25519) vs hybrid post-quantum (X25519 + ML-KEM-768) key exchange via liboqs, performance/payload metrics, and interactive migration simulation API updating flow risk profiles.
- [ ] **REQ-P8**: Full-featured React/Vite dashboard in dark security-ops aesthetic: Overview gauge, dual-timeline Flow visualizer, SHAP-explained Alerts view, RBAC-aware Assistant chat with citations, Audit ledger verifier, and interactive migration slider.
- [ ] **REQ-P9**: Production documentation, IBM Z architecture mapping (Crypto Express HSM, Secure Execution, Telum AI acceleration), pytest test suite with coverage reporting, and automated end-to-end `make demo` flow.
