#!/usr/bin/env python3
"""
AegisZ: Empirical Latency & Performance Benchmark
Measures actual host performance for:
1. ONNX Runtime Threat Model Inference Latency (p50 / p95 / p99 in microseconds)
2. Full End-to-End Gateway Pipeline Latency (Stage 0 to Stage 4 in milliseconds)
Documents host hardware specifications and contrasts with IBM Telum II architectural projections.

Outputs:
- docs/latency_benchmarks.json
"""

import os
import sys
import time
import json
import platform
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from threat_model import threat_detector
from main import app, GatewayProcessRequest, process_confidential_gateway_transaction

def get_hardware_info():
    return {
        "system_os": platform.system(),
        "os_release": platform.release(),
        "architecture": platform.machine(),
        "processor": platform.processor() or "Generic Processor",
        "python_version": platform.python_version()
    }

def benchmark_onnx_threat_model(n_iterations: int = 1000):
    """Benchmarks threat model inference directly over 1,000 runs."""
    sample_payload = {
        "role": "Doctor",
        "content": "Patient ZK_PAT_9941 presenting with tachycardia HR 122 bpm, BP 85/55 mmHg.",
        "velocity_10s": 1.2,
        "off_hours": False,
        "sensitive_target_count": 1.0,
        "egress_kb": 0.8,
        "geo_anomaly": False
    }

    # Warmup
    for _ in range(50):
        threat_detector.predict(sample_payload)

    latencies_us = []
    for _ in range(n_iterations):
        t0 = time.perf_counter()
        threat_detector.predict(sample_payload)
        t1 = time.perf_counter()
        latencies_us.append((t1 - t0) * 1_000_000)

    arr = np.array(latencies_us)
    return {
        "iterations": n_iterations,
        "engine": "ONNX Runtime (ort)" if threat_detector.ort_session else "Scikit-Learn High-Speed Engine",
        "min_us": round(float(np.min(arr)), 2),
        "mean_us": round(float(np.mean(arr)), 2),
        "p50_us": round(float(np.percentile(arr, 50)), 2),
        "p95_us": round(float(np.percentile(arr, 95)), 2),
        "p99_us": round(float(np.percentile(arr, 99)), 2),
        "max_us": round(float(np.max(arr)), 2)
    }

def benchmark_end_to_end_gateway(n_iterations: int = 100):
    """Benchmarks full end-to-end pipeline: Scrubber -> Threat -> Budget -> Triage -> PQC Ledger."""
    req = GatewayProcessRequest(
        role="Doctor",
        clinical_note="Patient Sarah Connor (Aadhaar: 9999 8888 7777, SSN: 123-45-6789) presenting with septic shock.",
        heart_rate=122.0,
        systolic_bp=84.0,
        blood_glucose=210.0,
        epsilon=1.0,
        execution_mode="enclave_tee"
    )

    # Warmup
    for _ in range(10):
        process_confidential_gateway_transaction(req)

    latencies_ms = []
    for _ in range(n_iterations):
        t0 = time.perf_counter()
        process_confidential_gateway_transaction(req)
        t1 = time.perf_counter()
        latencies_ms.append((t1 - t0) * 1000)

    arr = np.array(latencies_ms)
    return {
        "iterations": n_iterations,
        "stages_executed": "Stage 0 (CPACF Scrubber) + Stage 1 (Threat) + Stage 2 (Budget) + Stage 3 (TEE) + Stage 4 (ML-DSA-65 Ledger)",
        "min_ms": round(float(np.min(arr)), 3),
        "mean_ms": round(float(np.mean(arr)), 3),
        "p50_ms": round(float(np.percentile(arr, 50)), 3),
        "p95_ms": round(float(np.percentile(arr, 95)), 3),
        "p99_ms": round(float(np.percentile(arr, 99)), 3),
        "max_ms": round(float(np.max(arr)), 3)
    }

def main():
    hw = get_hardware_info()
    print("=" * 80)
    print("AegisZ Empirical Hardware Performance Benchmark")
    print("=" * 80)
    print(f"Host System:       {hw['system_os']} {hw['os_release']} ({hw['architecture']})")
    print(f"Host Processor:    {hw['processor']}")
    print(f"Python Runtime:    {hw['python_version']}")
    print("-" * 80)

    print("Running 1,000 iterations of ONNX Threat Model Inference...")
    threat_stats = benchmark_onnx_threat_model(1000)
    print(f"Engine:            {threat_stats['engine']}")
    print(f"Measured p50:      {threat_stats['p50_us']} us")
    print(f"Measured p95:      {threat_stats['p95_us']} us")
    print(f"Measured p99:      {threat_stats['p99_us']} us")
    print(f"Measured Mean:     {threat_stats['mean_us']} us (Min: {threat_stats['min_us']} us, Max: {threat_stats['max_us']} us)")
    print("-" * 80)

    print("Running 100 iterations of Full End-to-End Gateway Pipeline...")
    e2e_stats = benchmark_end_to_end_gateway(100)
    print(f"Measured e2e p50:  {e2e_stats['p50_ms']} ms")
    print(f"Measured e2e p95:  {e2e_stats['p95_ms']} ms")
    print(f"Measured e2e p99:  {e2e_stats['p99_ms']} ms")
    print(f"Measured e2e Mean: {e2e_stats['mean_ms']} ms (Min: {e2e_stats['min_ms']} ms, Max: {e2e_stats['max_ms']} ms)")
    print("=" * 80)

    # Comparison summary with projected Telum II
    comparison = {
        "hardware_environment": hw,
        "measured_threat_inference_microseconds": threat_stats,
        "measured_e2e_pipeline_milliseconds": e2e_stats,
        "ibm_telum_ii_architectural_projection": {
            "target": "IBM Telum II Integrated AI Accelerator (NNPA)",
            "status": "Designed for, mapped to architecture; not run directly on physical Telum II chip",
            "projected_latency_microseconds": 380.0,
            "rationale": "Direct on-die memory bus eliminates PCIe traversal overhead present on standard x86/GPU buses"
        }
    }

    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs"))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "latency_benchmarks.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(comparison, f, indent=2)

    print(f"[+] Benchmark results saved to: {out_path}")

if __name__ == "__main__":
    main()
