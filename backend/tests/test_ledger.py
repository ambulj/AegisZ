"""
Unit Tests: Quantum-Safe Audit Ledger, Binary Merkle Trees, and Inclusion Proofs
"""

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from quantum_crypto import audit_ledger, BinaryMerkleTree, PQCPrimitives

def test_binary_merkle_tree_and_inclusion_proofs():
    leaves = [
        PQCPrimitives.sha3_512(b"tx_1_doctor_triage"),
        PQCPrimitives.sha3_512(b"tx_2_billing_check"),
        PQCPrimitives.sha3_512(b"tx_3_telemetry_audit"),
        PQCPrimitives.sha3_512(b"tx_4_pqc_escrow")
    ]
    tree = BinaryMerkleTree(leaves)
    assert tree.root is not None
    assert len(tree.root) == 128  # 512-bit hex

    # Verify inclusion proof for leaf 1
    proof = tree.get_inclusion_proof(1)
    is_valid = BinaryMerkleTree.verify_inclusion_proof(leaves[1], proof, tree.root)
    assert is_valid is True

    # Tampered leaf fails
    fake_leaf = PQCPrimitives.sha3_512(b"forged_leaf")
    is_invalid = BinaryMerkleTree.verify_inclusion_proof(fake_leaf, proof, tree.root)
    assert is_invalid is False

def test_quantum_audit_ledger_verification_and_tamper_pinpointing():
    audit_ledger.reset_chain()
    assert len(audit_ledger.chain) == 1

    # Add block
    b1 = audit_ledger.add_event(
        event_type="CLINICAL_TRIAGE_TEST",
        role="Doctor",
        decision="PERMIT",
        threat_info={"threat_detected": False},
        privacy_info={"epsilon": 1.0}
    )
    assert b1.index == 1

    # Verify pristine chain
    status = audit_ledger.verify_chain()
    assert status["valid"] is True
    assert status["total_blocks"] == 2

    # Maliciously tamper with block 1
    audit_ledger.tamper_block(1, malicious_role="Rogue Insider")
    tampered_status = audit_ledger.verify_chain()
    assert tampered_status["valid"] is False
    assert tampered_status["tampered_block_index"] == 1
    assert "mismatch" in tampered_status["reason"].lower()

    # Reset chain
    audit_ledger.reset_chain()

def test_pqc_ml_kem_key_encapsulation():
    pk_hex, sk_hex = PQCPrimitives.generate_ml_dsa_65_keypair()
    kem_package = PQCPrimitives.encapsulate_ml_kem_768(pk_hex)
    assert kem_package["algorithm"].startswith("ML-KEM-768")
    assert kem_package["ciphertext_bytes"] == 1088
    assert "shared_secret_hash" in kem_package
