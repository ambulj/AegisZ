"""
Unit Tests: Differential Privacy (Laplace, Gaussian, Aggregates, and Stateful Budget Accountants)
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from privacy_engine import privacy_vault, RolePrivacyBudgetAccountant, SubjectPrivacyBudgetAccountant

def test_individual_laplace_dp():
    result = privacy_vault.apply_laplace_differential_privacy(
        value=100.0,
        epsilon=1.0,
        sensitivity=2.0
    )
    assert "perturbed_value" in result
    assert "re_identification_risk" in result
    assert "clinical_utility_retention_pct" in result
    assert 0.0 <= result["re_identification_risk"] <= 1.0
    assert result["epsilon"] == 1.0

def test_aggregate_laplace_dp_cohort():
    cohort_hrs = [72.0, 75.0, 80.0, 84.0, 88.0, 92.0, 96.0, 100.0]
    res = privacy_vault.apply_aggregate_laplace_dp(
        values=cohort_hrs,
        epsilon=1.0,
        sensitivity=10.0,
        query_type="mean"
    )
    assert res["query_type"] == "mean"
    assert res["sample_size"] == len(cohort_hrs)
    assert "true_aggregate" in res
    assert "perturbed_aggregate" in res
    assert res["relative_error_pct"] >= 0.0

def test_aggregate_gaussian_dp_cohort():
    cohort_incomes = [1200.0, 1450.0, 1600.0, 1800.0, 2100.0]
    res = privacy_vault.apply_aggregate_gaussian_dp(
        values=cohort_incomes,
        epsilon=1.0,
        delta=1e-5,
        sensitivity=100.0,
        query_type="mean"
    )
    assert res["mechanism"] == "Gaussian (ε, δ)-DP"
    assert res["delta"] == 1e-5
    assert "sigma" in res

def test_role_privacy_budget_exhaustion_blocks():
    accountant = RolePrivacyBudgetAccountant()
    # Unauthorized Attacker limit is 0.5
    allowed_1, spent_1, limit = accountant.check_and_consume("Unauthorized Attacker", 0.3)
    assert allowed_1 is True
    assert spent_1 == 0.3

    # Exceed limit
    allowed_2, spent_2, _ = accountant.check_and_consume("Unauthorized Attacker", 0.3)
    assert allowed_2 is False

def test_subject_privacy_budget_accounting():
    subject_acc = SubjectPrivacyBudgetAccountant(default_subject_limit=2.0)
    sub_id = "PATIENT_REF_9941"

    ok1, spent1, lim = subject_acc.check_and_consume(sub_id, 1.2)
    assert ok1 is True
    assert spent1 == 1.2

    # Second query exceeding 2.0 limit
    ok2, spent2, _ = subject_acc.check_and_consume(sub_id, 1.0)
    assert ok2 is False
