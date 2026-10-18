"""
Unit Tests: PII-Blind Reversible AES-256-GCM Vault & Stage 0 CPACF Scrubber
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from privacy_engine import privacy_vault, validate_verhoeff

def test_leak_scan_raw_pii_never_in_scrubbed_tokens():
    raw_text = (
        "Patient Alice Walker, SSN: 123-45-6789, Phone: (555) 123-4567, "
        "Aadhaar: 9999 8888 7777, PAN: ABCDE1234F, ABHA: 12-3456-7890-1234, "
        "Diagnosed with Schizophrenia and HIV-positive. Coordinates: 37.7749, -122.4194."
    )
    sanitized, meta = privacy_vault.scrub_and_extract_metadata(raw_text, role="Doctor")

    # Confirm zero raw PII strings in output
    assert "Alice Walker" not in sanitized
    assert "123-45-6789" not in sanitized
    assert "(555) 123-4567" not in sanitized
    assert "9999 8888 7777" not in sanitized
    assert "ABCDE1234F" not in sanitized
    assert "12-3456-7890-1234" not in sanitized
    assert "HIV-positive" not in sanitized
    assert "Schizophrenia" not in sanitized
    assert "37.7749, -122.4194" not in sanitized

    # Confirm format-preserving tokens generated
    assert "ZK_PAT_" in sanitized
    assert "TOKEN-ID-" in sanitized
    assert "TOKEN-AADHAAR-" in sanitized
    assert "TOKEN-PAN-" in sanitized
    assert "TOKEN-ABHA-" in sanitized
    assert meta["redactions_count"] >= 8
    assert meta["pii_density"] > 0.0
    assert meta["shannon_entropy"] > 0.0

def test_reversible_aes_gcm_vault_detokenization():
    raw_name = "Jonathan Miller"
    text = f"Patient {raw_name} admitted for emergency cardiology review."
    sanitized, meta = privacy_vault.scrub_and_extract_metadata(text, role="Doctor")

    token = meta["manifest"][0]["token"]
    assert token.startswith("ZK_PAT_")

    # Authorized Doctor can resolve token via AES-256-GCM decryption
    resolved = privacy_vault.break_glass_resolve(token, requesting_role="Doctor")
    assert resolved == raw_name

    # Unauthorized role CANNOT resolve token
    blocked_researcher = privacy_vault.break_glass_resolve(token, requesting_role="External Researcher")
    assert blocked_researcher is None

    blocked_billing = privacy_vault.break_glass_resolve(token, requesting_role="Billing Clerk")
    assert blocked_billing is None

def test_indian_pii_recognizers_and_verhoeff():
    assert validate_verhoeff("999988887779") is True
    assert validate_verhoeff("123456789012") is False

    text = "Citizen PAN: ABCDE1234F, ABHA: 99-8877-6655-4433, Aadhaar: 9999 8888 7779"
    sanitized, meta = privacy_vault.scrub_and_extract_metadata(text, role="External Researcher")

    assert "ABCDE1234F" not in sanitized
    assert "TOKEN-PAN-" in sanitized
    assert "TOKEN-ABHA-" in sanitized
    assert "TOKEN-AADHAAR-" in sanitized
