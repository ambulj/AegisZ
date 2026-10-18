# ChronoShield Project Roadmap

## Milestone 1: Core Platform & Security Demonstration

### Phase 0: Repository Scaffold, Core Services & Governance Baseline
- [ ] Docker Compose orchestration (PostgreSQL, Redis, Keycloak, OPA, Backend, Frontend)
- [ ] Keycloak realm export with predefined roles: CISO, Auditor, DataSteward, Analyst
- [ ] OPA Rego policies implementing role-based and attribute-based access controls
- [ ] Multi-arch GitHub Actions CI config (targeting Linux x86_64 and s390x)
- [ ] Core Python package setup (FastAPI, SQLAlchemy, Pydantic v2, linting/typing configs)

### Phase 1: Cryptographic Asset Scanner & CycloneDX 1.6 CBOM
- [ ] AST and regex scanners for Python, Java, JavaScript, YAML, and Nginx configurations
- [ ] TLS endpoint active prober (ciphers, key sizes, TLS versions)
- [ ] Taxonomy classifier: quantum-vulnerable, quantum-weakened, quantum-safe, broken-today
- [ ] CycloneDX 1.6 Cryptographic Bill of Materials (CBOM) JSON serializer
- [ ] Fixture repositories and automated scanner verification tests

### Phase 2: Synthetic Data Engine, Presidio PII Classifier & Data-Flow Graph
- [ ] Faker-based synthetic data generator (medical records, financial data, auth tokens, Indian PII)
- [ ] Custom Presidio pattern & context recognizers for Aadhaar, PAN, and ABHA ID
- [ ] Dynamic, editable shelf-life policy matrix (e.g., medical 50y, national ID 70y, session token 1d)
- [ ] Data-flow graph correlating data stores, sensitivity tiers, and protecting crypto assets (metadata only)

### Phase 3: Mosca's Inequality Monte Carlo Risk Engine
- [ ] Mosca inequality formulation: $X$ (migration duration), $Y$ (shelf-life), $Z$ (quantum adversary timeline)
- [ ] Configurable triangular distribution for $Z$ with explicit assumption labels
- [ ] 10,000-sample Monte Carlo simulation calculating exposure probability $P(\text{exposure})$
- [ ] Composite priority score: $P(\text{exposure}) \times \text{Sensitivity} \times \text{Exposure Surface}$
- [ ] Dual-timeline projection engine: "Crypto Expiry vs Data Shelf-Life Expiry" per data flow

### Phase 4: HNDL Anomaly Detection & IBM Z Telum Compatibility
- [ ] Synthetic log generator with injected HNDL attack scenarios (3am bulk export, 50x spike, TLS downgrade, slow exfiltration)
- [ ] UNSW-NB15 network attack log parser and normalization pipeline
- [ ] Isolation Forest and PyTorch Autoencoder anomaly detectors with sensitivity-weighted scoring
- [ ] SHAP (SHapley Additive exPlanations) attribution for every flagged anomaly
- [ ] Model ONNX export pipeline with documentation on IBM Z Telum II On-Chip AI / zDLC integration

### Phase 5: Security Core, Redaction Proxy, Differential Privacy & ML-DSA Audit Chain
- [ ] Keycloak JWT Bearer authentication and OPA ABAC decision middleware
- [ ] Presidio redaction proxy stripping all sensitive entities prior to downstream processing
- [ ] Differential privacy engine for low-privilege (Analyst) aggregated queries (Laplace mechanism)
- [ ] Tamper-evident SHA-256 hash-chained audit ledger with ML-DSA (FIPS 204) quantum-resistant signatures
- [ ] Public `/api/v1/audit/verify` verification endpoint with cryptographic chain validation

### Phase 6: Secure RAG Assistant & Prompt Injection Red-Teaming
- [ ] Local IBM Granite LLM integration via Ollama with ChromaDB vector embeddings
- [ ] Context pre-filtering enforcing OPA policies before vector retrieval touches prompt assembly
- [ ] Assistant tool execution suite (`get_top_risks`, `explain_alert`, `generate_migration_plan`)
- [ ] Defense-in-depth: prompt injection classifier + post-generation Presidio PII scanner + source citations
- [ ] 20-sample prompt injection red-team test suite with automated block rate metric reporting

### Phase 7: Post-Quantum Cryptography Proof-of-Concept & Migration Benchmark
- [ ] Inter-service key exchange module using liboqs (FIPS 203 ML-KEM-768)
- [ ] Hybrid X25519 + ML-KEM-768 key encapsulation mechanism vs classical X25519
- [ ] Benchmark suite measuring handshake latency, ciphertext/key sizes, and computational overhead
- [ ] "Simulate Migration" API showing instantaneous Mosca risk score reduction after PQC rollout

### Phase 8: Full-Featured React Security-Ops Dashboard
- [ ] Dark, high-contrast security-operations UI (React, Vite, Tailwind CSS, Lucide icons)
- [ ] **Overview**: Global quantum exposure gauge, risk distribution, aggregate counts
- [ ] **Flows**: Interactive dual-timeline view comparing encryption lifespan against data longevity
- [ ] **Alerts**: Real-time HNDL anomaly cards with SHAP feature breakdown and raw log metadata
- [ ] **Assistant**: Secure chat with role-tailored answers, source citations, and injection rejection alerts
- [ ] **Audit**: Cryptographic ledger viewer with one-click ML-DSA chain verification status
- [ ] **Migration Simulator**: Interactive slider demonstrating live risk score drops post-PQC migration

### Phase 9: Documentation, IBM Z Architecture Mapping & End-to-End Demo
- [ ] Architectural blueprint, STRIDE threat model (`docs/threat_model.md`), and cryptographic assumptions
- [ ] IBM Z hardware mapping: Crypto Express 8S HSM, IBM Secure Execution for Linux, Telum AI Accelerator
- [ ] Test suite execution report (pytest, coverage, mypy)
- [ ] Deterministic end-to-end automated demo script (`make demo` / `python demo.py`)
