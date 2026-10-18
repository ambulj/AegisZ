"""
Unit Tests: Access Control with Keycloak OIDC and Open Policy Agent (OPA) ABAC Engine
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from policy_engine import opa_policy_engine, oidc_validator

def test_keycloak_oidc_token_generation_and_validation():
    token = oidc_validator.generate_demo_token(role="Doctor", username="dr_smith")
    is_valid, claims, err = oidc_validator.validate_bearer_token(f"Bearer {token}")
    assert is_valid is True
    assert claims["preferred_username"] == "dr_smith"
    assert "Doctor" in claims["roles"]
    assert err is None

def test_opa_policy_field_filtering_per_role():
    mock_response = {
        "status": "APPROVED",
        "monthly_welfare_income": 1450.0,
        "patient_vitals": {"hr": 82, "sbp": 124},
        "zero_knowledge_sanitization": {
            "sanitized_text": "Patient ZK_PAT_94A1 diagnosed with Stage II Lymphoma."
        },
        "clinical_ai_triage": {
            "triage_urgency": "TIER_1_EMERGENCY",
            "recommendation": "Immediate IV administration"
        }
    }

    # 1. Doctor: Welfare income is redacted; clinical vitals visible
    doc_res = opa_policy_engine.filter_response_by_role("Doctor", mock_response)
    assert "[OPA REDACTED" in str(doc_res["monthly_welfare_income"])
    assert doc_res["clinical_ai_triage"]["triage_urgency"] == "TIER_1_EMERGENCY"

    # 2. Billing Clerk: Clinical PHI diagnosis notes are hidden; claim details visible
    bill_res = opa_policy_engine.filter_response_by_role("Billing Clerk", mock_response)
    assert "[OPA ABAC REDACTED]" in bill_res["zero_knowledge_sanitization"]["sanitized_text"]

    # 3. External Researcher: Individual vitals stripped, aggregate notice provided
    res_res = opa_policy_engine.filter_response_by_role("External Researcher", mock_response)
    assert "[OPA POLICY RESTRICTION]" in res_res["patient_vitals"]["notice"]

    # 4. Unauthorized Attacker: Access blocked
    atk_res = opa_policy_engine.filter_response_by_role("Unauthorized Attacker", mock_response)
    assert atk_res["error"] == "ACCESS_DENIED_BY_POLICY"
