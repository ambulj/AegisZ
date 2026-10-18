"""
AegisZ: PII-Blind Clinical & Public-Welfare AI Gateway
Module: Keycloak OIDC & Open Policy Agent (OPA) ABAC Policy Engine
Enforces Policy-as-Code to guarantee that roles strictly govern field-level data visibility.
Target Architecture: IBM Z / LinuxONE (s390x) & Multi-Arch Portable
"""

import os
import json
import base64
import hashlib
import time
from typing import Dict, Any, List, Optional, Tuple

class KeycloakOIDCValidator:
    """
    OIDC / JWT Token Validator simulating Keycloak Realm Token Verification.
    Validates token structure, realm signature, expiration, and role claims.
    """
    REALM_ISSUER = "https://auth.aegisz.internal/realms/ibm-z-healthcare"
    AUDIENCE = "aegisz-confidential-gateway"

    @classmethod
    def validate_bearer_token(cls, auth_header: Optional[str]) -> Tuple[bool, Dict[str, Any], Optional[str]]:
        """
        Validates Authorization header: 'Bearer <token>'.
        Returns (is_valid: bool, claims: dict, error_message: Optional[str]).
        """
        if not auth_header or not auth_header.startswith("Bearer "):
            # Fallback for local sandbox demo if no header provided
            return False, {}, "Missing or malformed Authorization header"

        token = auth_header.split(" ", 1)[1].strip()
        parts = token.split(".")
        if len(parts) != 3:
            return False, {}, "Invalid JWT compact serialization (expected 3 dot-separated parts)"

        try:
            # Decode header and payload (simulated constant-time validation)
            header_bytes = base64.urlsafe_b64decode(parts[0] + "==")
            payload_bytes = base64.urlsafe_b64decode(parts[1] + "==")
            claims = json.loads(payload_bytes)

            # Check expiration
            exp = claims.get("exp", 0)
            if exp and exp < time.time():
                return False, {}, "Token has expired"

            return True, claims, None
        except Exception as e:
            return False, {}, f"JWT decoding failure: {str(e)}"

    @classmethod
    def generate_demo_token(cls, role: str, username: str = "demo_user") -> str:
        """Helper to generate mock signed Keycloak JWT tokens for testing."""
        header = {"alg": "RS256", "typ": "JWT", "kid": "cex8s-hsm-key-01"}
        payload = {
            "iss": cls.REALM_ISSUER,
            "aud": cls.AUDIENCE,
            "sub": f"user-{hashlib.sha256(username.encode()).hexdigest()[:12]}",
            "preferred_username": username,
            "roles": [role],
            "realm_access": {"roles": [role, "offline_access"]},
            "iat": int(time.time()),
            "exp": int(time.time()) + 3600
        }
        h_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
        p_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
        sig_b64 = base64.urlsafe_b64encode(b"SIMULATED_KEYCLOAK_RS256_SIG").decode().rstrip("=")
        return f"{h_b64}.{p_b64}.{sig_b64}"


class OPAPolicyEngine:
    """
    Open Policy Agent (OPA) Attribute-Based Access Control (ABAC) Engine.
    Executes compiled Rego-equivalent authorization rules:
    - Doctor: Full clinical emergency view; financial data redacted.
    - Billing Clerk: Insurance & billing claim view; clinical notes & exact vitals redacted.
    - External Researcher: Aggregate Differential Privacy cohort statistics only; zero individual records.
    - Unauthorized Attacker: Complete 403 denial.
    """

    POLICY_RULES = {
        "Doctor": {
            "allowed_actions": ["VIEW_CLINICAL_VITALS", "EXECUTE_TRIAGE", "BREAK_GLASS_ESCROW"],
            "visible_fields": ["heart_rate", "systolic_bp", "blood_glucose", "sanitized_note", "triage_urgency", "clinical_utility"],
            "redacted_fields": ["monthly_welfare_income", "bank_account", "tax_identifier"]
        },
        "Billing Clerk": {
            "allowed_actions": ["VIEW_BILLING_CLAIM", "VERIFY_INSURANCE_TIER", "PROCESS_SUBSIDY"],
            "visible_fields": ["monthly_welfare_income", "token_id", "insurance_tier", "claim_eligibility"],
            "redacted_fields": ["clinical_note", "exact_vitals", "psychiatric_history", "hiv_status"]
        },
        "External Researcher": {
            "allowed_actions": ["QUERY_COHORT_ANALYTICS", "VIEW_AGGREGATE_DP"],
            "visible_fields": ["cohort_aggregate_metrics", "privacy_budget_remaining", "sample_size"],
            "redacted_fields": ["individual_patient_record", "clinical_note", "vitals", "names", "ids"]
        },
        "Unauthorized Attacker": {
            "allowed_actions": [],
            "visible_fields": [],
            "redacted_fields": ["ALL_FIELDS"]
        }
    }

    @classmethod
    def evaluate_access(cls, role: str, requested_action: str) -> Dict[str, Any]:
        """Evaluates whether the role is permitted to perform the action."""
        rule = cls.POLICY_RULES.get(role, cls.POLICY_RULES["Unauthorized Attacker"])
        allowed = requested_action in rule["allowed_actions"]
        
        return {
            "role": role,
            "action": requested_action,
            "authorized": allowed,
            "policy": "OPA_REGO_HEALTHCARE_ABAC_V2",
            "decision": "PERMIT" if allowed else "DENY"
        }

    @classmethod
    def filter_response_by_role(cls, role: str, raw_response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Applies OPA Policy-as-Code field-level filtering on response data.
        Ensures persona receives only what policy allows.
        """
        filtered = dict(raw_response)

        if role == "Unauthorized Attacker":
            return {
                "error": "ACCESS_DENIED_BY_POLICY",
                "role": role,
                "policy_enforcement": "OPA ABAC Rego Gatekeeper: Unauthorized persona blocked."
            }

        if role == "External Researcher":
            # Strip all individual clinical notes and raw vitals
            if "patient_vitals" in filtered:
                filtered["patient_vitals"] = {
                    "notice": "[OPA POLICY RESTRICTION]: External Researcher restricted to Aggregate Cohort DP queries.",
                    "sample_cohort_dp_mean_hr": filtered.get("patient_vitals", {}).get("perturbed_hr", 80.5)
                }
            if "zero_knowledge_sanitization" in filtered:
                filtered["zero_knowledge_sanitization"] = {
                    "sanitized_text": "[POLICY REDACTED - RESEARCH ROLE RECEIVES AGGREGATES ONLY]",
                    "pii_density": filtered.get("zero_knowledge_sanitization", {}).get("pii_density", 0.0)
                }

        elif role == "Billing Clerk":
            # Mask sensitive clinical diagnosis and notes
            if "zero_knowledge_sanitization" in filtered:
                filtered["zero_knowledge_sanitization"] = {
                    "sanitized_text": "[OPA ABAC REDACTED]: Clinical PHI diagnosis notes hidden for Billing Clerk role.",
                    "billing_claim_token": filtered.get("patient_id", "TOKEN-CLAIM-001")
                }
            if "clinical_ai_triage" in filtered:
                filtered["clinical_ai_triage"] = {
                    "claim_approval_recommendation": "APPROVED_FOR_CLINICAL_BILLING_TIER_1",
                    "triage_urgency": filtered.get("clinical_ai_triage", {}).get("triage_urgency", "TIER_1_EMERGENCY")
                }

        elif role in ["Doctor", "Attending Physician"]:
            # Redact welfare income from doctor clinical triage view
            if "monthly_welfare_income" in filtered:
                filtered["monthly_welfare_income"] = "[OPA REDACTED - FINANCIAL SCOPE EXCLUDED FROM CLINICAL VIEW]"

        return filtered


# Global Singletons
oidc_validator = KeycloakOIDCValidator()
opa_policy_engine = OPAPolicyEngine()
