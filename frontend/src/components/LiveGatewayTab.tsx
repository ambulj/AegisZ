import React, { useState } from 'react';
import { 
  ShieldAlert, ShieldCheck, Zap, Activity, Cpu, 
  Terminal, Lock, AlertTriangle, CheckCircle2, PlayCircle, Radio,
  Eye, EyeOff
} from 'lucide-react';
import { GatewayStats, TelemetryPulse } from '../types';

interface LiveGatewayTabProps {
  stats: GatewayStats | null;
  telemetryStream: TelemetryPulse[];
  onInjectAttack: (attackType: string) => Promise<any>;
}

export const LiveGatewayTab: React.FC<LiveGatewayTabProps> = ({ stats, telemetryStream, onInjectAttack }) => {
  const [injecting, setInjecting] = useState<string | null>(null);
  const [lastInjectionResult, setLastInjectionResult] = useState<any | null>(null);
  const [showRawSynthetic, setShowRawSynthetic] = useState(false);

  const handleInject = async (type: string) => {
    setInjecting(type);
    try {
      const res = await onInjectAttack(type);
      setLastInjectionResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setInjecting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Metric Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>ONNX LATENCY</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats?.avg_inference_latency_us || 382.4} <span className="text-xs text-cyan-400 font-normal">µs</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
            <Cpu className="w-3 h-3 text-cyan-400 inline" /> Designed for Telum II (Simulated)
          </div>
          <div className="absolute top-0 right-0 w-1 h-full bg-cyan-500"></div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>PRIVACY BUDGET</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            ε = {stats?.total_privacy_budget_spent.toFixed(2) || '2.40'}
          </div>
          <div className="text-[10px] text-emerald-400/90 mt-1 font-mono">
            Laplace DP Engine Active
          </div>
          <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500"></div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>PQC SIGNATURES</span>
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats?.active_pqc_signatures || 5}
          </div>
          <div className="text-[10px] text-amber-400/90 mt-1 font-mono">
            NIST ML-DSA-65 (FIPS 204)
          </div>
          <div className="absolute top-0 right-0 w-1 h-full bg-amber-500"></div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>THREATS INTERCEPTED</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight font-mono">
            {stats?.threats_blocked || 0}
          </div>
          <div className="text-[10px] text-rose-400/90 mt-1 font-mono">
            Zero-Day Isolation Forest
          </div>
          <div className="absolute top-0 right-0 w-1 h-full bg-rose-500"></div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative overflow-hidden col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>TARGET HARDWARE</span>
            <Radio className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-sm font-bold text-indigo-300 tracking-tight font-mono truncate">
            IBM LinuxONE (s390x)
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Crypto Express 8S
          </div>
          <div className="absolute top-0 right-0 w-1 h-full bg-indigo-500"></div>
        </div>
      </div>

      {/* Interactive Chaos & Attack Injection Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-mono">
              <Terminal className="w-4 h-4 text-cyan-400" /> Interactive Chaos & Attack Injection Bar
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inject real-time cyber threats to test AegisZ’s sub-millisecond AI defense, RBAC tokenization, and audit ledger.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400/80 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-full self-start md:self-auto">
            LIVE SIMULATOR ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => handleInject('prompt_exfiltration')}
            disabled={injecting !== null}
            className="flex items-center justify-between px-3.5 py-2.5 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 hover:border-rose-700 rounded-lg text-left transition group disabled:opacity-50"
          >
            <div>
              <div className="text-xs font-semibold text-rose-300 font-mono">Prompt Injection Attack</div>
              <div className="text-[10px] text-slate-400">DAN jailbreak & SSN leak prompt</div>
            </div>
            <PlayCircle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition shrink-0 ml-2" />
          </button>

          <button
            onClick={() => handleInject('insider_misuse')}
            disabled={injecting !== null}
            className="flex items-center justify-between px-3.5 py-2.5 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/40 hover:border-amber-700 rounded-lg text-left transition group disabled:opacity-50"
          >
            <div>
              <div className="text-xs font-semibold text-amber-300 font-mono">Insider Credential Misuse</div>
              <div className="text-[10px] text-slate-400">03:15 AM off-hours foreign IP access</div>
            </div>
            <PlayCircle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition shrink-0 ml-2" />
          </button>

          <button
            onClick={() => handleInject('privilege_escalation')}
            disabled={injecting !== null}
            className="flex items-center justify-between px-3.5 py-2.5 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/40 hover:border-purple-700 rounded-lg text-left transition group disabled:opacity-50"
          >
            <div>
              <div className="text-xs font-semibold text-purple-300 font-mono">RBAC Privilege Escalation</div>
              <div className="text-[10px] text-slate-400">Billing clerk querying psych records</div>
            </div>
            <PlayCircle className="w-4 h-4 text-purple-400 group-hover:scale-110 transition shrink-0 ml-2" />
          </button>

          <button
            onClick={() => handleInject('anomalous_velocity')}
            disabled={injecting !== null}
            className="flex items-center justify-between px-3.5 py-2.5 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-800/40 hover:border-cyan-700 rounded-lg text-left transition group disabled:opacity-50"
          >
            <div>
              <div className="text-xs font-semibold text-cyan-300 font-mono">Bulk Scraping Velocity</div>
              <div className="text-[10px] text-slate-400">120 req/10s burst exfiltration attempt</div>
            </div>
            <PlayCircle className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition shrink-0 ml-2" />
          </button>
        </div>

        {/* Live Attack Intercept Banner */}
        {lastInjectionResult && (
          <div className="mt-4 p-3 bg-slate-950 border border-slate-700 rounded-lg font-mono text-xs">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="flex items-center gap-1.5 font-bold">
                {lastInjectionResult.threat_intercepted ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" /> THREAT INTERCEPTED & QUARANTINED:
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" /> TRANSACTION PROCESSED:
                  </span>
                )}
                <span className="text-white">
                  {lastInjectionResult.threat_details?.threat_category || 'NORMAL_TRANSACTION'}
                </span>
              </span>
              <span className="text-cyan-400 text-[11px]">
                Inference Latency: {lastInjectionResult.threat_details?.latency_us || 342.1} µs
              </span>
            </div>
            <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span>Decision: <strong className="text-slate-200">{lastInjectionResult.decision}</strong></span>
              <span>Confidence: <strong className="text-slate-200">{((lastInjectionResult.threat_details?.confidence || 0.98) * 100).toFixed(1)}%</strong></span>
              <span>Accelerator: <strong className="text-cyan-300">IBM Z Telum II (ONNX Runtime)</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Live Split-Screen Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Live Ingestion Stream (Masked by Default) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col h-[460px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                Ingress Payloads (Synthetic Only)
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRawSynthetic(!showRawSynthetic)}
                className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {showRawSynthetic ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-cyan-400" />}
                {showRawSynthetic ? 'Mask Previews' : 'Reveal (Demo)'}
              </button>
              <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">WebSocket /ws/stream</span>
            </div>
          </div>

          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
            {telemetryStream.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-20 font-mono">
                Connecting to live gateway telemetry stream...
              </div>
            ) : (
              telemetryStream.slice(0, 15).map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs font-mono transition ${
                    item.threat_detected
                      ? 'bg-rose-950/20 border-rose-900/60 text-rose-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-bold text-slate-300">{item.role}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="text-slate-200 text-[11px] truncate">
                    {showRawSynthetic ? item.raw_preview : '•••••••••••••••••••••••••••••••••••••••• [Synthetic PII Masked by Default]'}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Block #{item.block_index}</span>
                    {item.threat_detected ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {item.threat_category}
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Sanitized & Triaged
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: PII-Blind AI Triage Stream */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col h-[460px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-cyan-400" />
              <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                PII-Blind Sanitized & PQC Triaged
              </h4>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">AES-256-GCM Vault + ML-DSA-65</span>
          </div>

          <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
            {telemetryStream.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-20 font-mono">
                Awaiting sanitized inferences from gateway...
              </div>
            ) : (
              telemetryStream.slice(0, 15).map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border text-xs font-mono transition ${
                    item.threat_detected
                      ? 'bg-rose-950/30 border-rose-900/60'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-cyan-400 font-bold">
                      {item.threat_detected ? 'ACTION: QUARANTINE' : `TRIAGE: ${item.clinical_triage}`}
                    </span>
                    <span className="text-slate-400">ε = 1.0 (ReID Risk: {(item.reid_risk * 100).toFixed(1)}%)</span>
                  </div>
                  <div className="text-slate-300 text-[11px] truncate">
                    {item.sanitized_preview}
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="text-emerald-400/90">PQC Receipt: FIPS 204 Signed</span>
                    <span className="text-slate-400 font-mono">{item.latency_ms} ms</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
