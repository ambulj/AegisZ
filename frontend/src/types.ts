export interface GatewayStats {
  total_transactions: number;
  threats_blocked: number;
  avg_inference_latency_us: number;
  avg_inference_latency_ms: number;
  total_privacy_budget_spent: number;
  active_pqc_signatures: number;
  target_platform: string;
  accelerator_status: string;
  active_websocket_listeners: number;
}

export interface TelemetryPulse {
  event_type: string;
  timestamp: string;
  role: string;
  status: string;
  threat_detected: boolean;
  threat_category: string;
  clinical_triage: string;
  reid_risk: number;
  latency_ms: number;
  raw_preview: string;
  sanitized_preview: string;
  block_index: number;
}

export interface RedactionToken {
  type: string;
  token: string;
  start: number;
}

export interface DifferentialPrivacyResult {
  original_value: number;
  perturbed_value: number;
  noise_added: number;
  epsilon: number;
  sensitivity: number;
  laplace_scale: number;
  re_identification_risk: number;
  total_budget_spent: number;
}

export interface SanitizeResponse {
  role: string;
  raw_input: string;
  sanitized_text: string;
  redactions_count: number;
  tokens_created: RedactionToken[];
  differential_privacy: DifferentialPrivacyResult;
}

export interface ThreatEvaluation {
  threat_detected: boolean;
  threat_category: string;
  threat_code: number;
  confidence: number;
  anomaly_score: number;
  is_anomaly: boolean;
  action: string;
  latency_us: number;
  latency_ms: number;
  accelerator: string;
  features_evaluated: Record<string, number>;
}

export interface AuditBlock {
  index: number;
  timestamp: string;
  prev_hash: string;
  merkle_root: string;
  payload_summary: {
    event_type: string;
    role: string;
    decision: string;
    threat_detected: boolean;
    threat_category: string;
    threat_latency_us: number;
    dp_epsilon: number;
    reid_risk: number;
    tokens_generated: number;
    tampered_notice?: string;
  };
  pqc_signature: {
    algorithm: string;
    security_category: string;
    signature_bytes: number;
    signature_hex_preview: string;
    signature_hex: string;
    lattice_parameters: Record<string, any>;
  };
  pqc_kem_meta: {
    algorithm: string;
    ciphertext_bytes: number;
    ciphertext_preview: string;
    shared_secret_hash: string;
  };
  hash: string;
}

export interface CBOMAsset {
  asset_id: string;
  name: string;
  service: string;
  protocol: string;
  cipher_suite: string;
  key_exchange: string;
  signature_algorithm: string;
  crypto_asset_type: string;
  shelf_life_years: number;
  quantum_status: 'QUANTUM_VULNERABLE' | 'QUANTUM_WEAKENED' | 'BROKEN_TODAY' | 'QUANTUM_SAFE';
  quantum_threat: string;
  hndl_risk_score: number;
  migration_recommendation: string;
}

export interface CBOMScanResult {
  cbom_spec: string;
  audit_timestamp: string;
  target_platform: string;
  total_assets_scanned: number;
  quantum_vulnerable_count: number;
  quantum_weakened_count: number;
  broken_today_count: number;
  quantum_safe_count: number;
  global_hndl_risk_score: number;
  readiness_verdict: string;
  assets: CBOMAsset[];
}

export interface VerifyChainResult {
  valid: boolean;
  total_blocks?: number;
  genesis_hash?: string;
  tip_hash?: string;
  signature_algorithm?: string;
  hash_algorithm?: string;
  status?: string;
  tampered_block_index?: number;
  reason?: string;
}

export interface MoscaSimulationResult {
  x_migration_years: number;
  y_shelf_life_years: number;
  total_longevity_required_years?: number;
  z_distribution: {
    min_years?: number;
    mode_years?: number;
    max_years?: number;
    distribution_type?: string;
  };
  n_draws: number;
  exposure_probability: number;
  exposure_percentage: number;
  composite_risk_score: number;
  threat_verdict: string;
  is_pqc_migrated: boolean;
  quantum_algorithm: string;
  sample_z_draws_preview: number[];
}

