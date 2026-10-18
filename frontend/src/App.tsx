import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, Activity, Lock, Cpu, Radio
} from 'lucide-react';

import { GatewayStats, TelemetryPulse, CBOMScanResult, AuditBlock, VerifyChainResult, MoscaSimulationResult } from './types';
import { LiveGatewayTab } from './components/LiveGatewayTab';
import { PrivacySandboxTab } from './components/PrivacySandboxTab';
import { QuantumCBOMTab } from './components/QuantumCBOMTab';
import { ArchitectureBenchmarkTab } from './components/ArchitectureBenchmarkTab';

const API_BASE = 'http://localhost:8000';
const WS_BASE = 'ws://localhost:8000';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mission' | 'sandbox' | 'cbom' | 'arch'>('mission');
  const [stats, setStats] = useState<GatewayStats | null>(null);
  const [telemetryStream, setTelemetryStream] = useState<TelemetryPulse[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch Gateway Statistics
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  // WebSocket live connection to /ws/stream
  const setupWebSocket = () => {
    try {
      const ws = new WebSocket(`${WS_BASE}/ws/stream`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const packet: TelemetryPulse = JSON.parse(event.data);
          setTelemetryStream((prev) => [packet, ...prev.slice(0, 49)]); // keep last 50
          fetchStats(); // refresh stats on telemetry pulse
        } catch (e) {
          console.error('WS Parse Error', e);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(setupWebSocket, 3000); // Reconnect after 3s
      };

      ws.onerror = () => {
        setWsConnected(false);
        ws.close();
      };
    } catch (err) {
      console.error('WS Setup error:', err);
      setTimeout(setupWebSocket, 3000);
    }
  };

  useEffect(() => {
    fetchStats();
    setupWebSocket();

    const interval = setInterval(fetchStats, 5000);
    return () => {
      clearInterval(interval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // REST Handlers
  const handleInjectAttack = async (attackType: string) => {
    const res = await fetch(`${API_BASE}/api/threat/inject?attack_type=${attackType}`, {
      method: 'POST'
    });
    const data = await res.json();
    fetchStats();
    return data;
  };

  const handleProcessGateway = async (payload: any) => {
    const res = await fetch(`${API_BASE}/api/gateway/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    fetchStats();
    return data;
  };

  const handleFetchCBOM = async (): Promise<CBOMScanResult> => {
    const res = await fetch(`${API_BASE}/api/cbom/scan`);
    return await res.json();
  };

  const handleFetchLedger = async (): Promise<AuditBlock[]> => {
    const res = await fetch(`${API_BASE}/api/ledger`);
    return await res.json();
  };

  const handleVerifyLedger = async (): Promise<VerifyChainResult> => {
    const res = await fetch(`${API_BASE}/api/ledger/verify`, { method: 'POST' });
    return await res.json();
  };

  const handleTamperLedger = async (blockIndex: number) => {
    const res = await fetch(`${API_BASE}/api/ledger/tamper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ block_index: blockIndex, malicious_role: 'Rogue Compromised Admin' })
    });
    return await res.json();
  };

  const handleResetLedger = async () => {
    const res = await fetch(`${API_BASE}/api/ledger/reset`, { method: 'POST' });
    fetchStats();
    return await res.json();
  };

  const handleSimulateMosca = async (migrationYears: number, shelfLifeYears: number, isPqc: boolean): Promise<MoscaSimulationResult> => {
    const res = await fetch(`${API_BASE}/api/mosca/simulate?migration_years=${migrationYears}&shelf_life_years=${shelfLifeYears}&is_pqc=${isPqc}`);
    return await res.json();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-emerald-500 rounded-xl shadow-lg shadow-cyan-900/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-lg tracking-tight text-white">AegisZ</span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800/80 px-2 py-0.5 rounded-full font-bold">
                  v1.0.0-s390x
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-sans hidden sm:block">
                Zero-Knowledge Clinical & Welfare AI Gateway (IBM Z Datathon)
              </div>
            </div>
          </div>

          {/* Target Status Indicator */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{wsConnected ? 'TELEMETRY STREAM: CONNECTED' : 'STREAM: RECONNECTING'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-800 px-3 py-1.5 rounded-lg">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>s390x / IBM LinuxONE</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 sm:space-x-4 border-t border-slate-800/60 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('mission')}
            className={`py-3 px-3.5 flex items-center gap-2 border-b-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'mission'
                ? 'border-cyan-400 text-cyan-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Radio className="w-4 h-4" /> 1. Mission Control (Live AI Gateway)
          </button>

          <button
            onClick={() => setActiveTab('sandbox')}
            className={`py-3 px-3.5 flex items-center gap-2 border-b-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'sandbox'
                ? 'border-emerald-400 text-emerald-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Activity className="w-4 h-4" /> 2. Privacy Sandbox (Before vs After)
          </button>

          <button
            onClick={() => setActiveTab('cbom')}
            className={`py-3 px-3.5 flex items-center gap-2 border-b-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'cbom'
                ? 'border-amber-400 text-amber-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Lock className="w-4 h-4" /> 3. Quantum-Safe CBOM & PQC Ledger
          </button>

          <button
            onClick={() => setActiveTab('arch')}
            className={`py-3 px-3.5 flex items-center gap-2 border-b-2 font-semibold transition whitespace-nowrap ${
              activeTab === 'arch'
                ? 'border-purple-400 text-purple-400 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Cpu className="w-4 h-4" /> 4. IBM Z Architecture & Telemetry
          </button>
        </div>
      </header>

      {/* Main Tab View Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {activeTab === 'mission' && (
          <LiveGatewayTab
            stats={stats}
            telemetryStream={telemetryStream}
            onInjectAttack={handleInjectAttack}
          />
        )}

        {activeTab === 'sandbox' && (
          <PrivacySandboxTab onProcessGateway={handleProcessGateway} />
        )}

        {activeTab === 'cbom' && (
          <QuantumCBOMTab
            onFetchCBOM={handleFetchCBOM}
            onFetchLedger={handleFetchLedger}
            onVerifyLedger={handleVerifyLedger}
            onTamperLedger={handleTamperLedger}
            onResetLedger={handleResetLedger}
            onSimulateMosca={handleSimulateMosca}
          />
        )}

        {activeTab === 'arch' && <ArchitectureBenchmarkTab />}
      </main>

      {/* System Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-3 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AegisZ: Zero-Knowledge Confidential AI Platform</span>
          <span className="text-slate-400">
            Engineered for IBM Z / LinuxONE • FIPS 203 (ML-KEM) & FIPS 204 (ML-DSA) • CycloneDX 1.6
          </span>
          <span className="text-emerald-400/80">Track 1: Security, Privacy & Responsible AI</span>
        </div>
      </footer>
    </div>
  );
};
