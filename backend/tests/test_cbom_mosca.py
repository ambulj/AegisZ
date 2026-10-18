"""
Unit Tests: CBOM Scanner, CycloneDX 1.6 Specification, and Mosca Monte Carlo Exposure Engine
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from quantum_crypto import CBOMScanner
from mosca_engine import mosca_engine

def test_cbom_audit_scan():
    audit = CBOMScanner.execute_cbom_audit()
    assert audit["total_assets_scanned"] >= 5
    assert "overall_quantum_readiness_pct" in audit
    assert "assets" in audit

def test_cyclonedx_1_6_schema_validity():
    bom = CBOMScanner.generate_cyclonedx_1_6_bom()
    assert bom["bomFormat"] == "CycloneDX"
    assert bom["specVersion"] == "1.6"
    assert "components" in bom
    assert len(bom["components"]) >= 6

    # Verify both crypto-asset and machine-learning-model types are present
    component_types = [c["type"] for c in bom["components"]]
    assert "crypto-asset" in component_types
    assert "machine-learning-model" in component_types

def test_mosca_monte_carlo_exposure_simulation():
    # Classical with 50-year medical records and 3-year migration (X + Y = 53 > Z)
    res_classical = mosca_engine.simulate_exposure(
        x_migration_years=3.0,
        y_shelf_life_years=50.0,
        n_draws=10000,
        is_pqc_migrated=False
    )
    assert res_classical["exposure_probability"] >= 0.8
    assert res_classical["threat_verdict"] == "CRITICAL_IMMEDIATE_HARVEST_RISK"

    # PQC Migrated (immune to Shor's algorithm)
    res_pqc = mosca_engine.simulate_exposure(
        x_migration_years=3.0,
        y_shelf_life_years=50.0,
        is_pqc_migrated=True
    )
    assert res_pqc["exposure_probability"] == 0.0
    assert res_pqc["threat_verdict"] == "QUANTUM_SAFE_IMMUNE"
