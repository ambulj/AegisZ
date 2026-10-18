# STRIDE Threat Model: AegisZ Zero-Knowledge AI Platform
### IBM Z Datathon — Track 1: Security, Privacy, and Responsible AI by Design
**Target Architecture:** IBM Z / LinuxONE (`s390x`) & Hybrid Cloud Deployments  
**Classification:** Confidential Medical & Public Welfare Information System  

---

## 1. System Scope & Trust Boundaries

AegisZ processes sensitive clinical and citizen welfare records across distinct trust zones. The primary assets protected include:
1. **Raw Patient Health Information (PHI) & Personal Identifiable Information (PII):** Patient names, government IDs (Aadhaar, SSN, PAN, ABHA), contact numbers, and precise geolocation coordinates.
2. **Clinical Biometric & Financial Metrics:** Heart rate, systolic blood pressure, oxygen saturation, laboratory panels, household income, and welfare benefit amounts.
3. **AI Inference & Decision Logic:** Telum II / ONNX threat classification engines and clinical triage models.
4. **Post-Quantum Cryptographic Audit Ledger:** Immutable Merkle tree hash chain recording data access, triage decisions, and administrative interventions.

### Trust Boundary Architecture Diagram

```text
       [ External Clients / Health Clinics / EHR Submissions ]
                                 │
                 ================= BOUNDARY 1: TLS Ingress (CEX8S) =================
                                 │
                                 ▼
                     [ AegisZ API Gateway (FastAPI) ]
                                 │
                 ================= BOUNDARY 2: Threat Quarantine =================
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
      [ Telum ONNX Threat Model ]      [ Format-Preserving Vault ]
      (Microsecond AI Scoring)         (HMAC-SHA3-256 Tokenization)
                │                                 │
                └────────────────┬────────────────┘
                                 │
                 ================= BOUNDARY 3: Zero-Knowledge Payload =================
                                 │
                                 ▼
                    [ Confidential AI Triage Core ]
                    (Operates ONLY on Sanitized + DP Data)
                                 │
                 ================= BOUNDARY 4: Hardware HSM Security =================
                                 │
                                 ▼
            [ Immutable Merkle Hash Chain Audit Ledger ]
            (NIST FIPS 204 ML-DSA-65 & FIPS 203 ML-KEM-768)
```

---

## 2. STRIDE Threat Matrix & Mitigations

| STRIDE Category | Threat ID | Threat Vector & Description | Severity | AegisZ Security Control & IBM Z Mitigation | Residual Risk |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | T-SP-01 | **Adversary claims unauthorized role** (e.g., Clinical Assistant impersonates Chief Medical Officer / CISO to access unmasked records). | **HIGH** | Strict RBAC enforcement via Open Policy Agent (OPA) middleware. Tokens validated at Gateway ingress. Role identity cryptographically tied to audit receipts. | **LOW** |
| **Spoofing** | T-SP-02 | **Endpoint spoofing in transit** via forged TLS certificates. | **HIGH** | Mutual TLS (mTLS) with pinned certificates anchored in IBM Z Crypto Express 8S (CEX8S) Secure Coprocessor. | **LOW** |
| **Tampering** | T-TA-01 | **Audit Log Modification**: Rogue database administrator alters historical access logs to conceal unauthorized data exfiltration. | **CRITICAL** | **Post-Quantum Merkle Hash-Chain**: Every block is chained via SHA3-512 and signed with NIST FIPS 204 `ML-DSA-65`. Mutating any transaction breaks the tip hash. `/api/ledger/verify` detects alterations instantly. | **NEGLIGIBLE** |
| **Tampering** | T-TA-02 | **Model Weight Poisoning**: Malicious insider alters threat detection or triage weights to allow adversarial evasion. | **HIGH** | Model binaries compiled to immutable ONNX graphs (`artifacts/threat_detector.onnx`), hashed, and verified against SHA-256 checksums on startup within IBM Secure Execution enclaves. | **LOW** |
| **Tampering** | T-TA-03 | **Biometric Data Corruption**: Man-in-the-middle manipulation of clinical values in flight. | **MEDIUM** | SHA3-256 payload integrity digest computed before tokenization and recorded in the cryptographic receipt. | **LOW** |
| **Repudiation** | T-RE-01 | **Denial of Emergency Triage Action**: Clinician or automated agent denies executing a high-risk medical triaging or welfare denial decision. | **MEDIUM** | Every inference generates a non-repudiable audit block containing client IP, role, timestamp, ML-DSA-65 lattice signature, and deterministic token hash. | **NEGLIGIBLE** |
| **Information Disclosure** | T-ID-01 | **Harvest Now, Decrypt Later (HNDL)**: Nation-state adversaries capture encrypted network traffic today, storing it until Cryptanalytically Relevant Quantum Computers (CRQCs) break RSA/ECC via Shor's algorithm. | **CRITICAL** | **Hybrid Post-Quantum Cryptography**: Integration of NIST FIPS 203 `ML-KEM-768` (Kyber) alongside X25519. CBOM scanner actively flags RSA/ECC assets with Mosca longevity ($X + Y > Z$) and triggers automated migration. | **LOW** |
| **Information Disclosure** | T-ID-02 | **Prompt Injection / Data Exfiltration**: Malicious payload tricks LLM or downstream model into echoing system secrets or unmasked PII. | **CRITICAL** | **Zero-Knowledge Pipeline**: Two-stage defense: (1) Telum ONNX Threat Model scores adversarial injection prompts in ~380 µs and rejects with HTTP 403; (2) Vault strips names, IDs, phones, and addresses before processing. | **NEGLIGIBLE** |
| **Information Disclosure** | T-ID-03 | **Re-identification via Biometric Reconstruction**: Adversary uses repeated queries on numerical metrics to reconstruct patient identities. | **HIGH** | **Calibrated Laplace Differential Privacy**: Controlled noise $X + \text{Lap}(0, \Delta f / \epsilon)$ added to numerical features with empirical re-identification risk bound $1 - e^{-0.65\epsilon}$. Dynamic privacy budget tracking prevents multi-query reconstruction. | **LOW** |
| **Denial of Service** | T-DoS-01 | **Query Velocity Bomb**: High-frequency automated scraping attacks intended to overwhelm clinical gateway resources. | **HIGH** | Real-time query velocity tracking ($QPS > 15$) flagged as `BULK_SCRAPING_ANOMALY` by Isolation Forest; rate limiting triggered at ingress. | **LOW** |
| **Denial of Service** | T-DoS-02 | **Lattice Crypto Computational Exhaustion**: Malicious floods of PQC key exchange handshakes to exhaust CPU. | **MEDIUM** | Offloaded to hardware accelerators on IBM LinuxONE (CPACF & CEX8S coprocessors), isolating CPU cores from cryptographic bottlenecks. | **LOW** |
| **Elevation of Privilege** | T-EoP-01 | **RBAC Privilege Escalation**: User submits low-privilege token with modified payload headers requesting emergency override. | **HIGH** | Multi-attribute threat classifier cross-references role, requested resource, and token claims. Discrepancies generate instant `UNAUTHORIZED_RBAC_ESCALATION` quarantine. | **LOW** |
| **Elevation of Privilege** | T-EoP-02 | **Host-Level Container Escape**: Compromised application process attempts to access hypervisor memory on host. | **CRITICAL** | **IBM Secure Execution for Linux**: Encrypts virtual machine / container memory with host-inaccessible keys managed by the IBM Z Hardware Management Console (HMC). Host admin cannot inspect guest memory. | **NEGLIGIBLE** |

---

## 3. Deep Dive: Zero-Knowledge Format-Preserving Vault

### 3.1 Pseudonymization Mechanics
When a clinical or welfare payload arrives at `/api/gateway/process`:
1. **Indian National PII Recognizers**:
   - **Aadhaar**: 12-digit format `\b\d{4}\s\d{4}\s\d{4}\b`, validated using the Verhoeff base-10 dihedral permutation checksum.
   - **Permanent Account Number (PAN)**: Indian Tax ID `[A-Z]{5}[0-9]{4}[A-Z]{1}`.
   - **ABHA ID**: Ayushman Bharat Health Account 14-digit format `\b\d{2}-\d{4}-\d{4}-\d{4}\b`.
2. **Global Identifiers**:
   - US Social Security Numbers (`\b\d{3}-\d{2}-\d{4}\b`).
   - Patient Names (Contextual extraction based on clinical prefixes like "Patient:", "Name:").
   - Phone Numbers (E.164 and international formats).
   - GPS Coordinates (Latitude/Longitude floating point pairs).
3. **Token Generation**:
   $$\text{Token} = \text{PREFIX} + \text{HMAC-SHA3-256}(K_{\text{vault}}, \text{Value})[0:12].\text{upper}()$$
   Format-preserving prefixes (`TOKEN-AADHAAR-`, `TOKEN-PAN-`, `TOKEN-ID-`, `TOKEN-TEL-`) ensure downstream medical models maintain entity relation awareness without access to raw data.

---

## 4. Deep Dive: Mosca's Inequality & Quantum Exposure Risk

Mosca's theorem establishes the condition under which encrypted data is vulnerable to retroactive decryption:
$$X + Y > Z$$
Where:
- $X$: Time required to migrate cryptographic infrastructure to quantum-safe standards.
- $Y$: Security shelf-life required for the data (e.g. 50 years for medical records, 70 years for Aadhaar).
- $Z$: Time until a Cryptanalytically Relevant Quantum Computer (CRQC) capable of executing Shor's algorithm emerges.

### Probabilistic Modeling
AegisZ does not assume a fixed $Z$. Instead, it evaluates a 10,000-draw vectorised Monte Carlo simulation sampling $Z$ from a triangular distribution:
$$Z \sim \text{Triangular}(\text{min}=8, \text{mode}=12, \text{max}=20)\quad\text{[years]}$$
Exposure probability is calculated as:
$$P(\text{Exposure}) = \frac{1}{N} \sum_{i=1}^{N} \mathbb{I}(X + Y > Z_i)$$

When the **Hybrid PQC Migration** switch is engaged, key exchange transitions to NIST FIPS 203 `ML-KEM-768`, rendering Shor's algorithm ineffective and dropping $P(\text{Exposure})$ to $0.00\%$.

---

## 5. Security Verification & Tamper Detection Protocol

1. **Chain Verification**: At any time, calling `/api/ledger/verify` iterates through all Merkle blocks, verifying:
   - $H_i = \text{SHA3-512}(i \parallel \text{prev\_hash} \parallel \text{merkle\_root} \parallel \text{payload} \parallel \text{sig})$
   - Valid cryptographic link $H_{i-1} == \text{prev\_hash}_i$
   - ML-DSA-65 lattice signature verification against the gateway public key.
2. **Tamper Detection Demonstration**:
   - Invoking `/api/ledger/tamper` mutates a historical block's payload (e.g., altering `role` from `Doctor` to `Rogue Compromised Admin`).
   - Subsequent calls to `/api/ledger/verify` immediately return `valid: false` with the exact block index and hash mismatch reason, demonstrating cryptographic non-repudiation.
