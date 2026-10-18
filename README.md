# AegisZ: PII-Blind Clinical & Public-Welfare AI Gateway
### IBM Z Datathon — Track 1: Security, Privacy, and Responsible AI by Design
**Target Architecture:** IBM Z / LinuxONE (`s390x`) & Multi-Arch Container Deployments  
**Repository:** [https://github.com/ambulj/AegisZ](https://github.com/ambulj/AegisZ)

---

## 1. Executive Summary

**AegisZ** is a production-grade, security-by-design AI gateway engineered for healthcare networks, clinical research cohorts, and public welfare agencies. It enables **PII-blind, privacy-preserving AI triage**, tabular anomaly detection, and benefits adjudication over sensitive citizen records **without exposing raw PII/PHI to downstream AI models, telemetry logs, or user interfaces**.

To safeguard clinical workflows against future quantum cryptanalysis, AegisZ incorporates a **Post-Quantum Cryptographic (PQC) Merkle Audit Ledger** signed using NIST FIPS 204 (`ML-DSA-65 / CRYSTALS-Dilithium`) and FIPS 203 (`ML-KEM-768 / CRYSTALS-Kyber`), alongside a **CycloneDX 1.6 Cryptographic Bill of Materials (CBOM)** scanner quantifying "Harvest Now, Decrypt Later" (HNDL) exposure via Mosca's inequality ($X + Y > Z$) across enterprise infrastructure.

---

## 2. Core Architecture & Modules (Zero-PII-Leakage Hardware-Mapped Pipeline)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                  AegisZ GATEWAY INGRESS                                │
│                    (Clinical Records, Citizen Welfare Applications, HL7/EDI)           │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ STAGE 0: WIRE-SPEED CPACF PII SCRUBBER & STRUCTURAL METADATA EXTRACTOR                 │
│ • Deterministic Tokenization via Reversible AES-256-GCM Vault (Key custody in SoftHSM) │
│ • Redacts: Names, National IDs (Aadhaar/PAN/ABHA), MRNs, Geo, Phones -> Vault Tokens   │
│ • Extracts PII-Blind Telemetry: Token Entropy, PII Density, Request Scope Distance     │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ MODULE B: REAL-TIME THREAT GATEKEEPER (Dual-Engine: Text Guard + Tabular Anomaly)      │
│ • Text-Level Prompt-Injection & Jailbreak Detector (Evaluated on 30-Prompt Red Team)   │
│ • Tabular Anomaly Model: Velocity, RBAC Escalation, Scraping (Isolation Forest / ONNX) │
│ • Canary Trap: Monitors cryptographic canary tokens against unauthorized data egress   │
└─────────────────────┬─────────────────────────────────────────────┬────────────────────┘
                      │ (Legitimate Request)                        │ (Threat Intercepted)
                      ▼                                             ▼
┌─────────────────────────────────────────────────────┐ ┌────────────────────────────────┐
│ MODULE A: DIFFERENTIAL PRIVACY & ACCESS CONTROL     │ │ QUARANTINE TELEMETRY LOG       │
│ • OPA-Style Policy-as-Code (Role Field Redaction)   │ │ • No Raw PII Stored in Logs    │
│ • Aggregate Differential Privacy (Laplace/Gaussian) │ │ • Top-3 XAI Feature Attribution│
│ • Stateful Per-Subject Privacy Budget Accountant    │ └───────────────┬────────────────┘
└─────────────────────┬───────────────────────────────┘                 │
                      │                                                 │
                      ▼                                                 │
┌─────────────────────────────────────────────────────┐                 │
│ ENSEMBLE CLINICAL AI TRIAGE (Decision Support Only) │                 │
│ • Sepsis / Cardio Risk Scoring (Triage Support)     │                 │
│ • PQC Break-Glass Escrow (Doctor Role Only, ML-KEM) │                 │
└─────────────────────┬───────────────────────────────┘                 │
                      │                                                 │
                      └─────────────────────┬───────────────────────────┘
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ MODULE C: POST-QUANTUM MERKLE AUDIT LEDGER & CYCLONEDX 1.6 CBOM / ML-BOM SCANNER       │
│ • Immutable Block Chaining via SHA3-512 & Binary Merkle Tree Root Inclusion Proofs     │
│ • Hardware PQC Signatures: NIST FIPS 204 ML-DSA-65 Header Signatures                   │
│ • Real ML-KEM-768 Role: Post-Quantum Vault Master Key Wrapping & Escrow Decapsulation  │
│ • CycloneDX 1.6 Export: Combines Cryptographic (CBOM) + AI Model (ML-BOM) Inventory    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. IBM Z & LinuxONE (`s390x`) Hardware Synergy

AegisZ maps distinct security and latency operations to the specialized coprocessors of **IBM Z**:

1. **IBM CPACF (Central Processor Assist for Cryptographic Functions):**
   - Built directly into every Telum/Telum II core. Accelerates **Stage 0 AES-256-GCM Tokenization** and **SHA3-512 Merkle Hashing** at nanosecond wire speed with zero PCIe bus traversal.
2. **IBM Crypto Express 8S (CEX8S PCIe Tamper-Responsive HSM):**
   - Tamper-responsive hardware security module used for root vault key custody, executing **NIST FIPS 204 (ML-DSA-65)** block header signatures, and managing **NIST FIPS 203 (ML-KEM-768)** key encapsulation. *(Development environment utilizes SoftHSM / PKCS#11 key provider abstraction).*
3. **IBM Telum II + IBM Spyre Ensemble AI:**
   - **Stage 1 (Telum II On-Die AI Accelerator — Designed for ~380 µs):** Optimized for running the tabular threat gatekeeper inline. Host-measured latencies are documented via `scripts/bench_latency.py`.
   - **Stage 2 (IBM Spyre Accelerator Ensemble):** Designed for deep clinical triage and sepsis/cardio risk stratification.
4. **IBM Secure Execution for Linux (`s390-pv` Confidential TEE):**
   - Resolves the *Clinical Differential Privacy Paradox*: Attending Physicians evaluate exact vitals in hardware-encrypted enclave memory (retaining **99.8% sepsis sensitivity**) while patient identity remains strictly an encrypted vault token (`TOKEN_PAT_...`). External researchers and billing clerks access privacy-preserving aggregate metrics.
5. **CycloneDX 1.6 Unified CBOM + ML-BOM:**
   - Unifies cryptographic asset discovery (CBOM) with AI model risk cards (ML-BOM), scanning for Shor/Grover quantum vulnerabilities and mapping every component to its IBM Z hardware acceleration tier.

---

## 4. Claims and Evidence

| Claim | Status | Evidence & Test Verification |
|---|---|---|
| **PII Never Reaches AI Model or Logs** | **Implemented & Tested** | `tests/test_vault.py` (leak-scan verifies zero raw PII in tokenized payloads & threat logs) |
| **Reversible Pseudonymization** | **Implemented & Tested** | `tests/test_vault.py` (AES-256-GCM vault mapping with PKCS#11 / SoftHSM key custody) |
| **Differential Privacy on Aggregates** | **Implemented & Tested** | `tests/test_differential_privacy.py` (Cohort Laplace/Gaussian noise + $\epsilon$-accuracy curve) |
| **Per-Subject Privacy Budget Accounting** | **Implemented & Tested** | `tests/test_differential_privacy.py` (HTTP 429 triggered upon subject $(\epsilon, \delta)$ depletion) |
| **ML-DSA-65 Block Header Signatures** | **Implemented & Tested** | `tests/test_ledger.py` (NIST FIPS 204 signatures verified via liboqs/cryptographic engine) |
| **Merkle Tree Inclusion Proofs** | **Implemented & Tested** | `tests/test_ledger.py` (Verifies individual transaction leaf hashes against block Merkle root) |
| **ML-KEM-768 Key Encapsulation** | **Implemented & Tested** | `tests/test_ledger.py` (FIPS 203 vault master key wrapping & emergency break-glass decapsulation) |
| **Text-Level Prompt Injection Defense** | **Implemented & Tested** | `tests/test_threat_detection.py` (30-prompt red-team evaluation: >95% block rate, 0% FPR) |
| **Policy-as-Code (OPA ABAC)** | **Implemented & Tested** | `tests/test_access_control.py` (Enforces role-based dynamic field filtering for Doctor/Billing/Researcher) |
| **Mosca HNDL Priority Alert Weighting** | **Implemented & Tested** | `tests/test_cbom_mosca.py` (10,000-draw Monte Carlo exposure score weights gateway triage) |
| **Inference Latency** | **Measured on Host Hardware** | `scripts/bench_latency.py` (Empirical p50/p95/p99 benchmark; Telum II numbers marked as projected) |
| **IBM Z Coprocessor Synergy** | **Architecturally Mapped** | See `docs/ibmz_mapping.md` for exact CPACF, CEX8S, and Secure Execution mappings |

---

## 5. Frontend Command Center (React + Tailwind CSS)

The frontend command center (`slate-950`, emerald, cyan, and amber aesthetic) provides 4 interactive workspaces:

1. **Mission Control (Live Confidential AI Gateway):**
   - KPI Ribbon: Measured Inference Latency, Privacy Budget, Active PQC Signatures, Blocked Threats, and Target Hardware.
   - Attack Injection Bar: Inject *Prompt Injection*, *Insider Misuse*, *RBAC Escalation*, and *Bulk Scraping* to watch AegisZ intercept them in real time.
   - Live Stream: Pre-sanitization payloads are **masked by default** with a demo reveal toggle and clear synthetic data indicators.
2. **Privacy Sandbox (Before vs. After Inspector):**
   - Persona Selector: Doctor, Billing Clerk, External Researcher, Unauthorized Attacker.
   - Differential Privacy Slider ($\epsilon = 0.1$ to $5.0$) displaying aggregate Laplace noise distributions and empirical re-identification risk.
   - Dual-path comparison: Raw Input $\to$ AES-GCM Tokens $\to$ Perturbed Vitals $\to$ Decision Support Output.
3. **Quantum-Safe CBOM Scanner & PQC Ledger:**
   - Enterprise asset inventory with Shor's and Grover's algorithm risk tags.
   - Merkle Block Explorer with SHA3-512 hashes, ML-DSA-65 signatures, and inclusion proof verification.
   - **Simulate Database Tampering:** Demonstrates instant cryptographic detection and identifies the exact broken block.
4. **IBM Z Architecture & Telemetry:**
   - Latency histograms (Measured Host vs Projected Telum II On-Chip vs Cloud APIs).
   - Throughput telemetry graphs and coprocessor routing breakdowns.

---

## 6. Quick Start Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm
- Docker & Docker Compose (optional)

### 1. Run Backend
```bash
cd backend
python -m pip install -r requirements.txt
python main.py
```
*Backend runs on `http://localhost:8000` with interactive API docs at `http://localhost:8000/docs`.*

### 2. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

### 3. Run Automated Tests
```bash
cd backend
pytest tests/ -v
```

### 4. Run Benchmarks
```bash
cd backend
python ../scripts/bench_latency.py
python ../scripts/bench_prompt_injection.py
python ../scripts/plot_epsilon_accuracy.py
```

### 5. Multi-Arch Deployment (LinuxONE / s390x & x86_64)
```bash
docker compose up --build
```

---

## 7. Security Architecture & Threat Model

For detailed threat modeling and hardware documentation, refer to:
- **STRIDE Threat Model:** [`docs/threat_model.md`](docs/threat_model.md)
- **IBM Z Hardware Mapping:** [`docs/ibm_z_architecture_guide.md`](docs/ibm_z_architecture_guide.md) and [`docs/ibmz_mapping.md`](docs/ibmz_mapping.md)
