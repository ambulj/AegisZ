"""
AegisZ: Zero-Knowledge Clinical & Public-Welfare AI Gateway
Module: Mosca's Inequality & Monte Carlo Quantum Exposure Risk Engine
Formula: X (Migration Time) + Y (Data Shelf-Life) > Z (CRQC Arrival)
Target Architecture: IBM Z / LinuxONE (s390x) & x86_64
"""

import numpy as np
from typing import Dict, Any, List, Optional

class MoscaRiskEngine:
    """
    Computes quantitative 'Harvest Now, Decrypt Later' (HNDL) exposure probability
    using Mosca's Inequality and a 10,000-draw vectorised Monte Carlo simulation.
    """

    @staticmethod
    def simulate_exposure(
        x_migration_years: float,
        y_shelf_life_years: float,
        n_draws: int = 10000,
        z_min: float = 8.0,
        z_mode: float = 12.0,
        z_max: float = 20.0,
        is_pqc_migrated: bool = False
    ) -> Dict[str, Any]:
        """
        Runs 10,000 Monte Carlo iterations over the triangular distribution of Z:
        Z ~ Triangular(left=z_min, mode=z_mode, right=z_max)
        """
        if is_pqc_migrated:
            # PQC (NIST FIPS 203 ML-KEM-768) is immune to Shor's algorithm
            return {
                "x_migration_years": x_migration_years,
                "y_shelf_life_years": y_shelf_life_years,
                "z_distribution": {"min": z_min, "mode": z_mode, "max": z_max},
                "n_draws": n_draws,
                "exposure_probability": 0.0,
                "exposure_percentage": 0.0,
                "composite_risk_score": 0.0,
                "threat_verdict": "QUANTUM_SAFE_IMMUNE",
                "is_pqc_migrated": True,
                "quantum_algorithm": "Hybrid X25519 + ML-KEM-768 (NIST FIPS 203)",
                "sample_z_draws_preview": []
            }

        np.random.seed(42)
        # 10,000 triangular draws for CRQC arrival timeline Z
        z_samples = np.random.triangular(left=z_min, mode=z_mode, right=z_max, size=n_draws)
        
        # Exposure occurs if (X + Y) > Z
        total_time_needed = x_migration_years + y_shelf_life_years
        exposures = total_time_needed > z_samples
        exposure_prob = float(np.mean(exposures))
        exposure_pct = round(exposure_prob * 100.0, 2)

        # Composite priority risk score: Exposure Prob * (Shelf Life Weight)
        weight = min(1.0, y_shelf_life_years / 50.0)
        composite_score = round(exposure_pct * (0.6 + 0.4 * weight), 1)

        if exposure_prob >= 0.8:
            verdict = "CRITICAL_IMMEDIATE_HARVEST_RISK"
        elif exposure_prob >= 0.4:
            verdict = "HIGH_QUANTUM_EXPOSURE"
        elif exposure_prob > 0.0:
            verdict = "MODERATE_QUANTUM_RISK"
        else:
            verdict = "QUANTUM_RESILIENT"

        return {
            "x_migration_years": x_migration_years,
            "y_shelf_life_years": y_shelf_life_years,
            "total_longevity_required_years": total_time_needed,
            "z_distribution": {
                "min_years": z_min,
                "mode_years": z_mode,
                "max_years": z_max,
                "distribution_type": "Triangular"
            },
            "n_draws": n_draws,
            "exposure_probability": round(exposure_prob, 4),
            "exposure_percentage": exposure_pct,
            "composite_risk_score": composite_score,
            "threat_verdict": verdict,
            "is_pqc_migrated": False,
            "quantum_algorithm": "Classical RSA-2048 / ECDSA P-256",
            "sample_z_draws_preview": [round(float(z), 2) for z in z_samples[:8]]
        }


mosca_engine = MoscaRiskEngine()
