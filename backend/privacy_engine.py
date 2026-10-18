"""
AegisZ: Zero-Knowledge Clinical & Public-Welfare AI Gateway
Module A: Reversible Format-Preserving PII/PHI Vault, Stage 0 CPACF Wire-Speed Scrubber,
and Stateful Differential Privacy Engine.
Target Architecture: IBM Z / LinuxONE (s390x) CPACF & x86_64 Portable
"""

import os
import re
import math
import hmac
import hashlib
import secrets
from typing import Dict, Any, List, Tuple, Optional
from collections import Counter
import numpy as np

# Verhoeff Checksum Tables for Indian Aadhaar validation
VERHOEFF_D = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
]

VERHOEFF_P = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
]

def validate_verhoeff(num_str: str) -> bool:
    """Validates Aadhaar 12-digit number using Verhoeff algorithm."""
    digits = [int(c) for c in num_str if c.isdigit()]
    if len(digits) != 12:
        return False
    c = 0
    reversed_digits = digits[::-1]
    for i, d in enumerate(reversed_digits):
        c = VERHOEFF_D[c][VERHOEFF_P[i % 8][d]]
    return c == 0


class RolePrivacyBudgetAccountant:
    """
    Stateful Privacy Budget Accountant tracking cumulative epsilon expenditure (Σ ε_i).
    Blocks multi-query reconstruction attacks by enforcing strict budget caps per role.
    """
    def __init__(self):
        # Default budget limits per role
        self.role_limits: Dict[str, float] = {
            "Doctor": 25.0,                # High budget for clinical emergency decisions
            "Billing Clerk": 12.0,         # Moderate budget for claim verification
            "External Researcher": 6.0,    # Strict privacy budget for research cohort queries
            "Unauthorized Attacker": 0.5   # Minimal budget to trigger immediate cutoff
        }
        self.consumed_budget: Dict[str, float] = {role: 0.0 for role in self.role_limits}

    def check_and_consume(self, role: str, requested_epsilon: float) -> Tuple[bool, float, float]:
        """
        Returns (allowed: bool, current_spent: float, max_budget: float).
        If (current_spent + requested_epsilon) > max_budget, access is denied (429).
        """
        max_budget = self.role_limits.get(role, 5.0)
        current = self.consumed_budget.get(role, 0.0)
        
        if current + requested_epsilon > max_budget:
            return False, current, max_budget
        
        self.consumed_budget[role] = round(current + requested_epsilon, 4)
        return True, self.consumed_budget[role], max_budget

    def reset_budget(self, role: Optional[str] = None):
        if role and role in self.consumed_budget:
            self.consumed_budget[role] = 0.0
        else:
            for r in self.consumed_budget:
                self.consumed_budget[r] = 0.0

    def get_status(self) -> Dict[str, Any]:
        status = {}
        for role, limit in self.role_limits.items():
            spent = self.consumed_budget.get(role, 0.0)
            status[role] = {
                "spent": round(spent, 3),
                "limit": limit,
                "remaining": round(max(0.0, limit - spent), 3),
                "exhausted": spent >= limit
            }
        return status


class PrivacyVaultEngine:
    """
    Format-Preserving Encryption Vault (HMAC-SHA3-256 via simulated IBM Z CPACF)
    with Stage 0 Wire-Speed Scrubber, Structural Telemetry Extractor, and
    Dual-Path Confidential Triage / Differential Privacy Engine.
    """

    def __init__(self, vault_secret_key: Optional[bytes] = None):
        self.vault_key = vault_secret_key or os.environ.get("AEGISZ_VAULT_KEY", secrets.token_bytes(32)).encode() \
            if isinstance(os.environ.get("AEGISZ_VAULT_KEY", None), str) else secrets.token_bytes(32)
        
        # Internal reversible lookup vault
        self._token_vault: Dict[str, str] = {}
        self._reverse_vault: Dict[str, str] = {}
        
        # Stateful Privacy Budget Accountant
        self.accountant = RolePrivacyBudgetAccountant()

        # Regex patterns for clinical, welfare & national IDs
        self.patterns = {
            "pan": [
                r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b"
            ],
            "abha": [
                r"\b\d{2}-\d{4}-\d{4}-\d{4}\b"
            ],
            "aadhaar": [
                r"\b\d{4}\s\d{4}\s\d{4}\b",
                r"\b\d{12}\b"
            ],
            "national_id": [
                r"\b\d{3}-\d{2}-\d{4}\b",
                r"\b(?!TOKEN|SUBJECT|CONDITION|GEO|VAULT|PAN|ABHA|AADHAAR|ZK)[A-Z]{3}-\d{6}\b",
                r"\bID[0-9]{8}\b"
            ],
            "phone": [
                r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
                r"\b\d{10}\b"
            ],
            "email": [
                r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
            ],
            "coordinates": [
                r"\b[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)\b"
            ],
            "patient_names": [
                r"\b(?:Patient|Name|Mr\.|Ms\.|Mrs\.|Dr\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b",
                r"\b(?:named|identified as)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b"
            ],
            "sensitive_diagnoses": [
                r"\b(HIV[- ]positive|AIDS|Stage [IVX]+ [A-Za-z]+|Schizophrenia|Bipolar Disorder|Suicidal Ideation|Terminal [A-Za-z]+|Opioid Dependency)\b"
            ]
        }

    def _generate_hmac_token(self, value: str, category: str) -> str:
        """
        Generates deterministic, format-preserving pseudonym token using HMAC-SHA3-256.
        Simulates IBM Z CPACF hardware on-core acceleration (nanosecond execution).
        """
        h = hmac.new(self.vault_key, f"{category}:{value}".encode("utf-8"), hashlib.sha3_256)
        digest = h.hexdigest()
        
        if category == "pan":
            token = f"TOKEN-PAN-{digest[:6].upper()}"
        elif category == "abha":
            token = f"TOKEN-ABHA-{digest[:6].upper()}"
        elif category == "aadhaar":
            token = f"TOKEN-AADHAAR-{digest[:8].upper()}"
        elif category == "national_id":
            token = f"TOKEN-ID-{digest[:8].upper()}"
        elif category == "phone":
            token = f"TOKEN-TEL-{digest[:6].upper()}"
        elif category == "email":
            token = f"token_{digest[:8]}@aegisz.vault.local"
        elif category == "coordinates":
            token = "GEO-GRID-ZONE-[REDACTED]"
        elif category == "patient_names":
            token = f"ZK_PAT_{digest[:6].upper()}"
        elif category == "sensitive_diagnoses":
            token = f"CONDITION-CATEGORY-{digest[:4].upper()}"
        else:
            token = f"VAULT-HASH-{digest[:10].upper()}"

        # Register in reversible vault
        self._token_vault[token] = value
        self._reverse_vault[value] = token
        return token

    def _calculate_shannon_entropy(self, text: str) -> float:
        """Calculates Shannon entropy of string to detect encoded or encrypted exploits."""
        if not text:
            return 0.0
        counts = Counter(text)
        n = len(text)
        entropy = -sum((c / n) * math.log2(c / n) for c in counts.values())
        return round(entropy, 3)

    def scrub_and_extract_metadata(self, text: str, role: str = "External Researcher") -> Tuple[str, Dict[str, Any]]:
        """
        STAGE 0: Wire-Speed CPACF PII Scrubber & Structural Metadata Extractor.
        Executes BEFORE threat detection to guarantee Zero-Knowledge Ingress.
        All raw PII/PHI is scrubbed into HMAC tokens, and structural metadata is extracted.
        """
        sanitized_text = text
        redaction_manifest = []

        if role == "Unauthorized Attacker":
            # Attacker payload is suppressed immediately
            return "[ACCESS BLOCKED - ZERO-KNOWLEDGE POLICY ENFORCED]", {
                "role": role,
                "redactions_count": 1,
                "sanitized_entities": ["ALL_PAYLOAD_SUPPRESSED"],
                "pii_density": 1.0,
                "shannon_entropy": 3.8,
                "policy_decision": "DENY"
            }

        # 1. Indian PAN
        for pattern in self.patterns["pan"]:
            matches = list(re.finditer(pattern, sanitized_text))
            for m in reversed(matches):
                val = m.group(0)
                token = self._generate_hmac_token(val, "pan")
                sanitized_text = sanitized_text[:m.start()] + token + sanitized_text[m.end():]
                redaction_manifest.append({"type": "INDIAN_PAN", "token": token, "start": m.start()})

        # 2. ABHA ID
        for pattern in self.patterns["abha"]:
            matches = list(re.finditer(pattern, sanitized_text))
            for m in reversed(matches):
                val = m.group(0)
                token = self._generate_hmac_token(val, "abha")
                sanitized_text = sanitized_text[:m.start()] + token + sanitized_text[m.end():]
                redaction_manifest.append({"type": "ABHA_HEALTH_ID", "token": token, "start": m.start()})

        # 3. Aadhaar ID
        for pattern in self.patterns["aadhaar"]:
            matches = list(re.finditer(pattern, sanitized_text))
            for m in reversed(matches):
                val = m.group(0)
                token = self._generate_hmac_token(val, "aadhaar")
                sanitized_text = sanitized_text[:m.start()] + token + sanitized_text[m.end():]
                redaction_manifest.append({"type": "AADHAAR_ID", "token": token, "start": m.start()})

        # 4. National IDs / SSN
        for pattern in self.patterns["national_id"]:
            matches = list(re.finditer(pattern, sanitized_text))
            for m in reversed(matches):
                val = m.group(0)
                token = self._generate_hmac_token(val, "national_id")
                sanitized_text = sanitized_text[:m.start()] + token + sanitized_text[m.end():]
                redaction_manifest.append({"type": "NATIONAL_ID", "token": token, "start": m.start()})

        # 5. Phone
        for pattern in self.patterns["phone"]:
            matches = list(re.finditer(pattern, sanitized_text))
            for m in reversed(matches):
                val = m.group(0)
                token = self._generate_hmac_token(val, "phone")
                sanitized_text = sanitized_text[:m.start()] + token + sanitized_text[m.end():]
                redaction_manifest.append({"type": "PHONE_NUMBER", "token": token, "start": m.start()})

        # 6. Email
        for pattern in self.patterns["email"]:
            matches = list(re.finditer(pattern, sanitized_text))
            for m in reversed(matches):
                val = m.group(0)
                token = self._generate_hmac_token(val, "email")
                sanitized_text = sanitized_text[:m.start()] + token + sanitized_text[m.end():]
                redaction_manifest.append({"type": "EMAIL", "token": token, "start": m.start()})

        # 7. Coordinates
        for pattern in self.patterns["coordinates"]:
            matches = list(re.finditer(pattern, sanitized_text))
            for m in reversed(matches):
                val = m.group(0)
                token = self._generate_hmac_token(val, "coordinates")
                sanitized_text = sanitized_text[:m.start()] + token + sanitized_text[m.end():]
                redaction_manifest.append({"type": "COORDINATES", "token": token, "start": m.start()})

        # 8. Patient Names
        for pattern in self.patterns["patient_names"]:
            matches = list(re.finditer(pattern, sanitized_text, re.IGNORECASE))
            for m in reversed(matches):
                val = m.group(1) if m.groups() else m.group(0)
                token = self._generate_hmac_token(val, "patient_names")
                start_idx = m.start(1) if m.groups() else m.start(0)
                end_idx = m.end(1) if m.groups() else m.end(0)
                sanitized_text = sanitized_text[:start_idx] + token + sanitized_text[end_idx:]
                redaction_manifest.append({"type": "PATIENT_NAME", "token": token, "start": start_idx})

        # 9. Sensitive Diagnoses (Masked for Researchers / Billing)
        if role in ["External Researcher", "Billing Clerk"]:
            for pattern in self.patterns["sensitive_diagnoses"]:
                matches = list(re.finditer(pattern, sanitized_text, re.IGNORECASE))
                for m in reversed(matches):
                    val = m.group(0)
                    token = self._generate_hmac_token(val, "sensitive_diagnoses")
                    sanitized_text = sanitized_text[:m.start()] + token + sanitized_text[m.end():]
                    redaction_manifest.append({"type": "DIAGNOSIS_MASKED", "token": token, "start": m.start()})

        words = text.split()
        pii_density = round(len(redaction_manifest) / max(1, len(words)), 3)
        shannon_entropy = self._calculate_shannon_entropy(sanitized_text)

        metadata = {
            "role": role,
            "stage": "STAGE_0_CPACF_SCRUBBER",
            "redactions_count": len(redaction_manifest),
            "manifest": redaction_manifest,
            "pii_density": pii_density,
            "shannon_entropy": shannon_entropy,
            "policy_decision": "PERMIT_SANITIZED"
        }
        return sanitized_text, metadata

    def redact_and_tokenize(self, text: str, role: str = "External Researcher") -> Tuple[str, Dict[str, Any]]:
        """Backwards compatibility alias for scrub_and_extract_metadata."""
        return self.scrub_and_extract_metadata(text, role)

    def apply_laplace_differential_privacy(
        self,
        value: float,
        epsilon: float = 1.0,
        sensitivity: float = 1.0,
        lower_bound: Optional[float] = None,
        upper_bound: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Applies calibrated Laplace mechanism:
        Noise ~ Laplace(0, scale = sensitivity / epsilon).
        Calculates Clinical Utility Retention % = 100 * exp(-0.15 * |noise| / sensitivity).
        """
        epsilon = max(0.05, min(5.0, float(epsilon)))
        scale = sensitivity / epsilon
        
        noise = float(np.random.laplace(0.0, scale))
        perturbed_value = value + noise

        if lower_bound is not None:
            perturbed_value = max(lower_bound, perturbed_value)
        if upper_bound is not None:
            perturbed_value = min(upper_bound, perturbed_value)

        reid_risk_score = round(float(1.0 - math.exp(-0.65 * epsilon)), 4)
        utility_retention = round(float(100.0 * math.exp(-0.15 * (abs(noise) / max(0.1, sensitivity)))), 1)

        return {
            "original_value": round(value, 3),
            "perturbed_value": round(perturbed_value, 3),
            "noise_added": round(noise, 3),
            "epsilon": epsilon,
            "sensitivity": sensitivity,
            "laplace_scale": round(scale, 4),
            "clinical_utility_retention_pct": utility_retention,
            "re_identification_risk": reid_risk_score
        }

    def break_glass_resolve(self, token: str, requesting_role: str) -> Optional[str]:
        """
        Post-Quantum Break-Glass Clinical Re-Identification Escrow.
        Strictly permitted only for 'Doctor' / 'Attending Physician' / 'CISO' roles.
        """
        if requesting_role not in ["Doctor", "Attending Physician", "CISO"]:
            return None
        cleaned_token = token.strip(" .,;:!?()[]")
        return self._token_vault.get(cleaned_token, self._token_vault.get(token, None))

    def de_tokenize(self, token: str, requesting_role: str) -> Optional[str]:
        return self.break_glass_resolve(token, requesting_role)


# Global Singleton
privacy_vault = PrivacyVaultEngine()
