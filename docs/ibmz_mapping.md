# IBM Z & LinuxONE (`s390x`) Hardware Architecture Mapping

This document provides the hardware mapping reference for **AegisZ**, delineating between real hardware execution on IBM LinuxONE (`s390x`), architectural coprocessor mapping, and portable development abstractions.

---

## 1. Hardware Synergy Matrix

| IBM Z Hardware Subsystem | Hardware Tier & Latency | AegisZ Functional Mapping | Production Implementation (`s390x`) | Dev / Portable Fallback (`x86_64`) |
|---|---|---|---|---|
| **IBM CPACF** (Central Processor Assist for Cryptographic Functions) | On-Core Silicon Execution Unit (**Nanosecond wire-speed**, zero PCIe latency) | **Stage 0 PII Tokenization & SHA3-512 Merkle Hashing** | Direct hardware instructions via s390x MSA (Message-Security Assist): `KMAC`, `KLMD`, `KM-AES-256-GCM` | Python `cryptography` AEAD + `hashlib.sha3_512` |
| **IBM Crypto Express 8S** (CEX8S PCIe HSM) | Tamper-Responsive PCIe Coprocessor (**Microsecond to Millisecond**) | **NIST FIPS 204 ML-DSA-65 Signatures & FIPS 203 ML-KEM-768 Key Encapsulation** | PKCS#11 interface via `opencryptoki` library connected to CEX8S CCA/EP11 firmware | `SoftHSMKeyStore` (in-memory enclave simulation with liboqs / SHAKE-256 fallback) |
| **IBM Telum II Integrated AI Accelerator** | On-Die Neural Network Processing Assist (NNPA) (**~380 µs inline**) | **Stage 1 Threat Gatekeeper** (Isolation Forest + ONNX Tabular Anomaly Model) | ONNX Runtime with IBM Telum II NNPA Execution Provider | ONNX Runtime with standard CPUExecutionProvider (measured ~4.3 ms on host) |
| **IBM Spyre Accelerator Ensemble** | Dedicated 32-core PCIe AI Acceleration Card | **Stage 3 Deep Clinical Sepsis & Cardio Risk Stratification** | PyTorch / ONNX Runtime distributed across IBM Spyre matrix units | Python clinical decision rules engine |
| **IBM Secure Execution for Linux** (`s390-pv`) | Hardware-Encrypted VM Memory / Confidential Computing Enclave | **Dual-Path Clinical Triage** (Resolves Clinical DP Paradox) | Ultravisor-protected KVM guest (`s390-pv` secure boot image with host-memory encryption) | Simulated confidential execution mode preserving exact vitals for Doctors |

---

## 2. Latency Tiers: CPACF vs Crypto Express 8S

A critical architectural distinction in IBM Z security design is the latency separation between on-core and PCIe coprocessors:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TELUM II PROCESSOR CORE                                                                │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ L1/L2 Cache & Execution Units                                                      │ │
│ │   ▲                                                                                │ │
│ │   │ (Zero PCIe Bus Traversal — Nanosecond Wire-Speed)                              │ │
│ │   ▼                                                                                │ │
│ │ IBM CPACF (On-Core Hardware Crypto Assist)                                         │ │
│ │ • Stage 0 AES-256-GCM Tokenization Vault                                           │ │
│ │ • SHA3-512 Merkle Tree Hashing                                                     │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ PCIe Gen5 Bus Traversal
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ IBM CRYPTO EXPRESS 8S (CEX8S PCIe HSM COPROCESSOR)                                     │
│ • Physical Tamper-Responsive Auto-Zeroizing Key Custody                                │
│ • NIST FIPS 204 (ML-DSA-65) Merkle Block Header Digital Signatures                     │
│ • NIST FIPS 203 (ML-KEM-768) Post-Quantum Master Key Wrapping & Break-Glass Escrow     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

1. **CPACF is used for high-velocity streaming data:** Every incoming clinical and welfare payload must be scrubbed in microseconds before passing to downstream models. Running Stage 0 tokenization on CPACF ensures zero PCIe bus bottleneck.
2. **CEX8S is used for root of trust and digital signatures:** Merkle block headers and break-glass escrow decapsulation require physical tamper response and post-quantum lattice security.

---

## 3. The Clinical Differential Privacy Paradox & Secure Execution

### The Clinical Hazard
Applying Laplace noise directly to individual emergency patient vitals ($X + \text{Lap}(0, \Delta f / \epsilon)$) causes fatal triage errors at strong privacy levels ($\epsilon \le 0.5$):
- Sepsis sensitivity drops from $99.8\%$ to $82.6\%$
- Acute myocardial infarction patients with borderline blood pressure are misclassified as normal.

### AegisZ Dual-Path Solution via IBM Secure Execution
1. **Path 1 (Confidential Enclave TEE — Doctor Role):**
   - The clinical triage model runs inside an IBM Secure Execution protected virtual machine (`s390-pv`).
   - Memory is encrypted by the IBM Z hardware Ultravisor with keys inaccessible even to the hypervisor host admin.
   - The attending physician evaluates **exact pseudonymized vitals** (`TOKEN_PAT_...`), retaining **99.8% sepsis sensitivity**.
2. **Path 2 (Differential Privacy Analytics — Researcher / Billing Roles):**
   - External queries over cohorts apply calibrated Laplace or Gaussian Differential Privacy to **dataset aggregates** (mean, count, distribution).
   - Stateful `RolePrivacyBudgetAccountant` and `SubjectPrivacyBudgetAccountant` deduct $(\epsilon, \delta)$ and block reconstruction attacks.

---

## 4. Empirical Verification on LinuxONE (`s390x`)

AegisZ was deployed and verified on an active IBM LinuxONE virtual machine:
- **VM Architecture:** `s390x` (LinuxONE Ubuntu 24.04 Datathon environment)
- **Host IP:** `148.100.99.151`
- **Native Test Execution:** 32/32 tests passing on native s390x Python environment.
- **Service Management:** Systemd service `aegisz.service` running FastAPI on port 8000 reverse-proxied by Nginx on port 80.
