#!/usr/bin/env python3
"""
AegisZ: Prompt Injection & Red-Team Guard Evaluation Benchmark
Evaluates the TextPromptInjectionGuard against the 30-prompt red-team dataset.
Reports empirical Block Rate (Recall), False Positive Rate (FPR), Precision, and F1-Score.

Outputs:
- docs/prompt_injection_redteam_results.json
"""

import os
import sys
import json
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))
from threat_model import TextPromptInjectionGuard

def run_benchmark():
    prompts_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend", "tests", "redteam_prompts.json"))
    with open(prompts_path, "r", encoding="utf-8") as f:
        prompts = json.load(f)

    guard = TextPromptInjectionGuard()

    tp = 0  # Attacks correctly blocked
    fn = 0  # Attacks missed
    fp = 0  # Benign incorrectly blocked
    tn = 0  # Benign correctly permitted

    detailed_eval = []

    print("=" * 80)
    print("AegisZ Text-Level Prompt Injection Red-Team Evaluation (30 Prompts)")
    print("=" * 80)
    print(f"{'ID':<10} | {'Expected':<10} | {'Prediction':<10} | {'Score':<6} | {'Status':<8} | {'Category'}")
    print("-" * 80)

    for item in prompts:
        prompt_id = item["id"]
        text = item["prompt"]
        is_attack = item["is_attack"]
        category = item["category"]

        res = guard.inspect_text(text)
        predicted_attack = res["is_injection"]
        score = res["score"]

        if is_attack and predicted_attack:
            tp += 1
            verdict_status = "PASS (TP)"
        elif is_attack and not predicted_attack:
            fn += 1
            verdict_status = "FAIL (FN)"
        elif not is_attack and predicted_attack:
            fp += 1
            verdict_status = "FAIL (FP)"
        else:
            tn += 1
            verdict_status = "PASS (TN)"

        expected_str = "ATTACK" if is_attack else "BENIGN"
        pred_str = "ATTACK" if predicted_attack else "BENIGN"

        print(f"{prompt_id:<10} | {expected_str:<10} | {pred_str:<10} | {score:<6.2f} | {verdict_status:<8} | {category}")

        detailed_eval.append({
            "id": prompt_id,
            "category": category,
            "is_attack": is_attack,
            "predicted_attack": predicted_attack,
            "score": score,
            "matched_patterns": res["matched_patterns"],
            "evaluation": verdict_status
        })

    total_attacks = tp + fn
    total_benign = tn + fp
    total = total_attacks + total_benign

    block_rate = round((tp / max(1, total_attacks)) * 100.0, 2)  # Recall
    fpr = round((fp / max(1, total_benign)) * 100.0, 2)
    precision = round((tp / max(1, tp + fp)) * 100.0, 2)
    accuracy = round(((tp + tn) / total) * 100.0, 2)
    f1 = round((2 * precision * block_rate) / max(1e-5, (precision + block_rate)), 2)

    print("=" * 80)
    print("SUMMARY METRICS:")
    print(f"Total Test Prompts:       {total}")
    print(f"Adversarial Attacks:      {total_attacks}")
    print(f"Benign Clinical Prompts:  {total_benign}")
    print(f"True Positives (Blocked): {tp}")
    print(f"False Negatives (Missed): {fn}")
    print(f"False Positives (Errant): {fp}")
    print(f"True Negatives (Allowed): {tn}")
    print("-" * 80)
    print(f"Block Rate (Recall):      {block_rate}%")
    print(f"False Positive Rate (FPR):{fpr}%")
    print(f"Precision:                {precision}%")
    print(f"Overall Accuracy:         {accuracy}%")
    print(f"F1-Score:                 {f1}%")
    print("=" * 80)

    results_doc = {
        "benchmark_name": "AegisZ Text-Level Adversarial Prompt Injection Benchmark",
        "dataset_size": total,
        "adversarial_count": total_attacks,
        "benign_count": total_benign,
        "metrics": {
            "block_rate_recall_pct": block_rate,
            "false_positive_rate_pct": fpr,
            "precision_pct": precision,
            "accuracy_pct": accuracy,
            "f1_score_pct": f1,
            "confusion_matrix": {
                "true_positives": tp,
                "false_negatives": fn,
                "false_positives": fp,
                "true_negatives": tn
            }
        },
        "detailed_prompts": detailed_eval
    }

    out_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs"))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "prompt_injection_redteam_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(results_doc, f, indent=2)

    print(f"[+] Red-team benchmark results saved to: {out_path}")
    return results_doc

if __name__ == "__main__":
    run_benchmark()
