import React, { useState, useEffect } from 'react';
import { 
  Lock, CheckCircle2, XCircle, 
  RefreshCw, Database, ChevronRight, ChevronDown, Wrench, ShieldAlert,
  TrendingUp, Sliders, ShieldCheck, Cpu, Clock, Sparkles, FileDown
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine 
} from 'recharts';
import { CBOMScanResult, AuditBlock, VerifyChainResult, MoscaSimulationResult } from '../types';

interface QuantumCBOMTabProps {
  onFetchCBOM: () => Promise<CBOMScanResult>;
  onFetchLedger: () => Promise<AuditBlock[]>;
  onVerifyLedger: () => Promise<VerifyChainResult>;
  onTamperLedger: (blockIndex: number) => Promise<any>;
  onResetLedger: () => Promise<any>;
  onSimulateMosca: (migrationYears: number, shelfLifeYears: number, isPqc: boolean) => Promise<MoscaSimulationResult>;
  onDownloadCycloneDX: () => Promise<void>;
}

export const QuantumCBOMTab: React.FC<QuantumCBOMTabProps> = ({
  onFetchCBOM,
  onFetchLedger,
  onVerifyLedger,
  onTamperLedger,
  onResetLedger,
  onSimulateMosca,
  onDownloadCycloneDX
}) => {
  const [cbom, setCbom] = useState<CBOMScanResult | null>(null);
  const [ledger, setLedger] = useState<AuditBlock[]>([]);
  const [verifyStatus, setVerifyStatus] = useState<VerifyChainResult | null>(null);
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [tampering, setTampering] = useState(false);

  // Mosca Monte Carlo Simulation State
  const [migrationYears, setMigrationYears] = useState<number>(4);
  const [shelfLifeYears, setShelfLifeYears] = useState<number>(30);
  const [isPqcMigrated, setIsPqcMigrated] = useState<boolean>(false);
  const [moscaResult, setMoscaResult] = useState<MoscaSimulationResult | null>(null);
  const [simulatingMosca, setSimulatingMosca] = useState<boolean>(false);

  const runMoscaSimulation = async (x: number, y: number, pqc: boolean) => {
    setSimulatingMosca(true);
    try {
      const result = await onSimulateMosca(x, y, pqc);
      setMoscaResult(result);
    } catch (err) {
      console.error('Mosca simulation error:', err);
    } finally {
      setSimulatingMosca(false);
    }
  };

  const handleMigrationChange = (val: number) => {
    setMigrationYears(val);
    runMoscaSimulation(val, shelfLifeYears, isPqcMigrated);
  };

  const handleShelfLifeChange = (val: number) => {
    setShelfLifeYears(val);
    runMoscaSimulation(migrationYears, val, isPqcMigrated);
  };

  const handlePqcToggle = (val: boolean) => {
    setIsPqcMigrated(val);
    runMoscaSimulation(migrationYears, shelfLifeYears, val);
  };

  // Generate timeline CDF data points from 2026 to 2046
  const timelineData = React.useMemo(() => {
    const points = [];
    const baseYear = 2026;
    const zMin = 8;
    const zMode = 12;
    const zMax = 20;

    for (let dt = 0; dt <= 22; dt += 2) {
      const year = baseYear + dt;
      let classicalCdf = 0;

      if (dt <= zMin) {
        classicalCdf = 0;
      } else if (dt <= zMode) {
        classicalCdf = Math.pow(dt - zMin, 2) / ((zMax - zMin) * (zMode - zMin));
      } else if (dt < zMax) {
        classicalCdf = 1 - Math.pow(zMax - dt, 2) / ((zMax - zMin) * (zMax - zMode));
      } else {
        classicalCdf = 1.0;
      }

      const isExposedClassical = (migrationYears + shelfLifeYears) >= dt;
      const exposureRisk = isPqcMigrated ? 0 : (isExposedClassical ? Math.round(classicalCdf * 100) : 0);

      points.push({
        year: `${year}`,
        crqcArrivalCDF: Math.round(classicalCdf * 100),
        exposureRisk: exposureRisk,
        pqcRisk: 0
      });
    }
    return points;
  }, [migrationYears, shelfLifeYears, isPqcMigrated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cbomData, ledgerData, verifyData] = await Promise.all([
        onFetchCBOM(),
        onFetchLedger(),
        onVerifyLedger()
      ]);
      setCbom(cbomData);
      setLedger(ledgerData);
      setVerifyStatus(verifyData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    runMoscaSimulation(migrationYears, shelfLifeYears, isPqcMigrated);
  }, []);

  const handleTamper = async () => {
    setTampering(true);
    try {
      // Tamper with second or third block
      const targetIdx = ledger.length > 2 ? 2 : 1;
      await onTamperLedger(targetIdx);
      // Re-fetch and verify to immediately highlight the break
      const [updatedLedger, updatedVerify] = await Promise.all([
        onFetchLedger(),
        onVerifyLedger()
      ]);
      setLedger(updatedLedger);
      setVerifyStatus(updatedVerify);
    } catch (err) {
      console.error(err);
    } finally {
      setTampering(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await onResetLedger();
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CBOM Executive Quantum Readiness Summary */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-mono">
              <Lock className="w-4 h-4 text-cyan-400" /> Cryptographic Bill of Materials (CBOM) & Quantum Readiness
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              CycloneDX 1.6 Cryptographic Extension mapping "Harvest Now, Decrypt Later" (HNDL) exposure across enterprise endpoints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              (cbom?.global_hndl_risk_score || 0) > 50
                ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                : 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
            }`}>
              GLOBAL HNDL RISK: {cbom?.global_hndl_risk_score || 64.8}%
            </span>
          </div>
        </div>

        {/* CBOM Assets Breakdown Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-3 rounded-lg border border-rose-900/40">
            <div className="text-[10px] font-mono text-slate-400">SHOR-VULNERABLE (RSA/ECC)</div>
            <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
              {cbom?.quantum_vulnerable_count || 2} <span className="text-xs text-slate-500 font-normal">assets</span>
            </div>
            <div className="text-[9px] text-slate-500 mt-1">Breaks under Shor's algorithm</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-amber-900/40">
            <div className="text-[10px] font-mono text-slate-400">GROVER-WEAKENED (AES-128)</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
              {cbom?.quantum_weakened_count || 1} <span className="text-xs text-slate-500 font-normal">assets</span>
            </div>
            <div className="text-[9px] text-slate-500 mt-1">Reduced to 64-bit quantum hardness</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-purple-900/40">
            <div className="text-[10px] font-mono text-slate-400">LEGACY / BROKEN TODAY</div>
            <div className="text-xl font-bold font-mono text-purple-400 mt-0.5">
              {cbom?.broken_today_count || 1} <span className="text-xs text-slate-500 font-normal">assets</span>
            </div>
            <div className="text-[9px] text-slate-500 mt-1">3DES / TLS 1.0 collision risk</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-emerald-900/40">
            <div className="text-[10px] font-mono text-slate-400">IBM Z PQC QUANTUM-SAFE</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {cbom?.quantum_safe_count || 1} <span className="text-xs text-slate-500 font-normal">assets</span>
            </div>
            <div className="text-[9px] text-emerald-500 mt-1">ML-KEM-768 + ML-DSA-65</div>
          </div>
        </div>
      </div>

      {/* CBOM Assets Inventory Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span>Enterprise Cryptographic Assets & Migration Roadmap</span>
            </h4>
            <div className="text-[10px] text-slate-500 font-normal">IBM CEX8S (PQC HSM) &amp; CPACF (On-Core) Mapped</div>
          </div>

          <button
            type="button"
            onClick={onDownloadCycloneDX}
            className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition self-start sm:self-auto shadow-md"
          >
            <FileDown className="w-3.5 h-3.5" /> Download CycloneDX 1.6 CBOM + ML-BOM (JSON)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                <th className="pb-2">ASSET NAME / SERVICE</th>
                <th className="pb-2">ALGORITHM / SUITE</th>
                <th className="pb-2">SHELF LIFE</th>
                <th className="pb-2">QUANTUM THREAT STATUS</th>
                <th className="pb-2">HNDL RISK</th>
                <th className="pb-2">RECOMMENDED IBM Z MIGRATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cbom?.assets.map((asset, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 pr-2">
                    <div className="font-semibold text-slate-200">{asset.name}</div>
                    <div className="text-[10px] text-slate-500">{asset.service}</div>
                  </td>
                  <td className="py-2.5 pr-2">
                    <div className="text-slate-300 text-[11px]">{asset.key_exchange}</div>
                    <div className="text-[10px] text-slate-500">{asset.cipher_suite}</div>
                  </td>
                  <td className="py-2.5 pr-2 text-slate-300">{asset.shelf_life_years}y</td>
                  <td className="py-2.5 pr-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      asset.quantum_status === 'QUANTUM_SAFE'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : asset.quantum_status === 'BROKEN_TODAY'
                        ? 'bg-purple-950 text-purple-300 border border-purple-800'
                        : asset.quantum_status === 'QUANTUM_WEAKENED'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      {asset.quantum_status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-2 font-bold">
                    <span className={asset.hndl_risk_score > 70 ? 'text-rose-400' : asset.hndl_risk_score > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      {asset.hndl_risk_score}%
                    </span>
                  </td>
                  <td className="py-2.5 text-[10px] text-slate-400 max-w-xs">
                    {asset.migration_recommendation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mosca's Inequality & Monte Carlo Quantum Exposure Simulator */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-mono">
              <TrendingUp className="w-4 h-4 text-rose-400" /> Mosca's Inequality (X + Y &gt; Z) &amp; 10,000-Draw Monte Carlo Engine
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Probabilistic quantitative modeling of "Harvest Now, Decrypt Later" risk using triangular distribution Z ~ Triangular(8, 12, 20) years.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border transition ${
              isPqcMigrated
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : (moscaResult?.exposure_percentage || 0) > 60
                ? 'bg-rose-950/80 border-rose-700 text-rose-300 animate-pulse'
                : 'bg-amber-950/80 border-amber-700 text-amber-300'
            }`}>
              {isPqcMigrated 
                ? 'IMMUNE: PQC MIGRATED (0.0% EXPOSURE)'
                : `HNDL EXPOSURE: ${moscaResult?.exposure_percentage ?? 95.8}%`
              }
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls & Math Breakdown (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Parameter Tuner
                </span>
                <span className="text-[10px] font-mono text-slate-500">10,000 Iterations</span>
              </div>

              {/* Migration Time Slider (X) */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Migration Time (X):</span>
                  <span className="text-cyan-400 font-bold">{migrationYears} years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={migrationYears}
                  onChange={(e) => handleMigrationChange(Number(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
                <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
                  <span>1y (Fast)</span>
                  <span>5y (Standard Enterprise)</span>
                  <span>10y (Complex Legacy)</span>
                </div>
              </div>

              {/* Data Shelf Life Slider (Y) */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1.5">
                  <span className="text-slate-400">Data Shelf-Life Longevity (Y):</span>
                  <span className="text-amber-400 font-bold">{shelfLifeYears} years</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="80"
                  step="1"
                  value={shelfLifeYears}
                  onChange={(e) => handleShelfLifeChange(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
                
                {/* Preset quick buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleShelfLifeChange(1)}
                    className={`px-1.5 py-1 text-[10px] font-mono rounded border transition ${
                      shelfLifeYears === 1
                        ? 'bg-amber-950 border-amber-600 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Tokens (1y)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShelfLifeChange(10)}
                    className={`px-1.5 py-1 text-[10px] font-mono rounded border transition ${
                      shelfLifeYears === 10
                        ? 'bg-amber-950 border-amber-600 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Finance (10y)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShelfLifeChange(50)}
                    className={`px-1.5 py-1 text-[10px] font-mono rounded border transition ${
                      shelfLifeYears === 50
                        ? 'bg-amber-950 border-amber-600 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    EHR/PHI (50y)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShelfLifeChange(70)}
                    className={`px-1.5 py-1 text-[10px] font-mono rounded border transition ${
                      shelfLifeYears === 70
                        ? 'bg-amber-950 border-amber-600 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    Aadhaar (70y)
                  </button>
                </div>
              </div>

              {/* Mosca Inequality Evaluation Box */}
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>Required Longevity (X + Y):</span>
                  <span className="font-bold text-cyan-300">{migrationYears + shelfLifeYears} years</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>CRQC Arrival (Z Mode):</span>
                  <span>12.0 years (Triangular 8-20y)</span>
                </div>
                <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Mosca Condition:</span>
                  <span className={`font-bold ${
                    isPqcMigrated 
                      ? 'text-emerald-400' 
                      : (migrationYears + shelfLifeYears > 12) 
                      ? 'text-rose-400' 
                      : 'text-amber-400'
                  }`}>
                    {isPqcMigrated 
                      ? 'PQC IMMUNE (Z neutralized)' 
                      : (migrationYears + shelfLifeYears > 12) 
                      ? 'X + Y > Z (EXPOSED)' 
                      : 'X + Y ≤ Z (BUFFERED)'
                    }
                  </span>
                </div>
              </div>

              {/* Hybrid PQC Migration Toggle Card */}
              <div className={`p-3.5 rounded-lg border transition ${
                isPqcMigrated
                  ? 'bg-emerald-950/40 border-emerald-600/80 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${isPqcMigrated ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <div>
                      <div className="text-xs font-mono font-bold text-slate-200">
                        Hybrid PQC Key Exchange
                      </div>
                      <div className="text-[10px] text-slate-400">
                        X25519 + ML-KEM-768 (IBM CEX8S)
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={simulatingMosca}
                    onClick={() => handlePqcToggle(!isPqcMigrated)}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold transition flex items-center gap-1.5 disabled:opacity-50 ${
                      isPqcMigrated
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800'
                    }`}
                  >
                    {simulatingMosca ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {isPqcMigrated ? 'PQC Active' : 'Simulate Migration'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Visualization & Monte Carlo Output (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Exposure Timeline Recharts Chart */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Quantum Compromise Timeline CDF (2026 - 2048)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {isPqcMigrated ? 'Post-Quantum Hardened' : 'Classical Vulnerability Curve'}
                </span>
              </div>

              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData}>
                    <defs>
                      <linearGradient id="exposureGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="pqcGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="year" stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} unit="%" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }}
                      formatter={(value: any, name: string) => {
                        if (name === 'exposureRisk') return [`${value}%`, 'Classical Exposure Risk'];
                        if (name === 'crqcArrivalCDF') return [`${value}%`, 'CRQC Arrival CDF'];
                        return [`${value}%`, 'PQC Protected Risk'];
                      }}
                    />
                    {!isPqcMigrated ? (
                      <Area 
                        type="monotone" 
                        dataKey="exposureRisk" 
                        stroke="#f43f5e" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#exposureGradient)" 
                      />
                    ) : (
                      <Area 
                        type="monotone" 
                        dataKey="pqcRisk" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#pqcGradient)" 
                      />
                    )}
                    <ReferenceLine x="2038" stroke="#06b6d4" strokeDasharray="3 3" label={{ value: 'Z Mode (2038)', fill: '#06b6d4', fontSize: 10, position: 'top' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-2 px-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
                  Classical Exposure Risk: {isPqcMigrated ? '0.0%' : `${moscaResult?.exposure_percentage ?? 95.8}%`}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block"></span>
                  CRQC Arrival Mode: ~2038 (12 yrs)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block"></span>
                  PQC Immunity: {isPqcMigrated ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
            </div>

            {/* Metrics & Monte Carlo Draws Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">EXPOSURE PROBABILITY</div>
                <div className={`text-xl font-bold font-mono mt-0.5 ${
                  isPqcMigrated ? 'text-emerald-400' : (moscaResult?.exposure_percentage || 0) > 50 ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {isPqcMigrated ? '0.0%' : `${moscaResult?.exposure_percentage ?? 95.8}%`}
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">P(X + Y &gt; Z)</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">PRIORITY SCORE</div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                  {isPqcMigrated ? '0.0' : `${moscaResult?.composite_risk_score ?? 91.2}`}
                  <span className="text-xs text-slate-500 font-normal"> / 100</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-0.5">Shelf-Life Weighted</div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <div className="text-[10px] font-mono text-slate-400">ACTIVE ALGORITHM</div>
                <div className="text-xs font-bold font-mono text-cyan-300 mt-1 truncate">
                  {isPqcMigrated ? 'ML-KEM-768' : 'RSA-2048 / ECC'}
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  {isPqcMigrated ? 'NIST FIPS 203' : 'Shor Vulnerable'}
                </div>
              </div>
            </div>

            {/* Monte Carlo 10,000 Draws Preview */}
            <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cyan-400" /> Monte Carlo Simulation Samples (CRQC Z-Years):
                </span>
                <span className="text-slate-500">Seed: 42 • N=10,000</span>
              </div>
              <div className="flex flex-wrap gap-1.5 font-mono text-[10px]">
                {(moscaResult?.sample_z_draws_preview && moscaResult.sample_z_draws_preview.length > 0 
                  ? moscaResult.sample_z_draws_preview 
                  : [11.42, 13.84, 9.61, 14.28, 12.05, 15.11, 10.73, 12.89]
                ).map((val, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">
                    Z[{idx+1}]={val}y
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quantum-Safe PQC Merkle Audit Ledger Explorer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2 font-mono">
              <Database className="w-4 h-4 text-amber-400" /> Immutable Post-Quantum Merkle Audit Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Append-only audit chain where every gateway event is signed with ML-DSA-65 (FIPS 204) and chained via SHA3-512.
            </p>
          </div>

          {/* Tamper and Verify Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleTamper}
              disabled={tampering}
              className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Simulate DB Tampering
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Verify Integrity
            </button>

            <button
              onClick={handleReset}
              disabled={loading}
              className="px-3 py-1.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800 text-cyan-300 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Wrench className="w-3.5 h-3.5" /> Restore & Re-Sign
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        <div className={`p-3.5 rounded-lg border font-mono text-xs mb-4 flex items-center justify-between ${
          verifyStatus?.valid
            ? 'bg-emerald-950/30 border-emerald-800/80 text-emerald-200'
            : 'bg-rose-950/60 border-rose-700 text-rose-200 animate-pulse'
        }`}>
          <div className="flex items-center gap-2.5">
            {verifyStatus?.valid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="font-bold">
                {verifyStatus?.valid
                  ? 'CRYPTOGRAPHICALLY VERIFIED IMMUTABLE'
                  : `TAMPERING DETECTED AT BLOCK #${verifyStatus?.tampered_block_index || 'X'}`}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                {verifyStatus?.valid
                  ? 'All SHA3-512 hashes, Merkle roots, and NIST ML-DSA-65 signatures verified without anomalies.'
                  : verifyStatus?.reason || 'Hash chain broken: Previous block hash does not match recalculation!'}
              </div>
            </div>
          </div>

          <div className="text-right text-[10px] text-slate-400 hidden sm:block">
            <div>Blocks: {ledger.length}</div>
            <div>Signatures: FIPS 204 Lattice</div>
          </div>
        </div>

        {/* Block Chain Explorer List */}
        <div className="space-y-2">
          {ledger.map((block) => {
            const isExpanded = expandedBlock === block.index;
            const isTampered = block.payload_summary?.tampered_notice !== undefined;

            return (
              <div
                key={block.index}
                className={`border rounded-lg text-xs font-mono transition ${
                  isTampered
                    ? 'bg-rose-950/40 border-rose-700'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div
                  onClick={() => setExpandedBlock(isExpanded ? null : block.index)}
                  className="p-3 flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-400 font-bold">Block #{block.index}</span>
                    <span className="text-slate-300 font-semibold">{block.payload_summary.event_type}</span>
                    <span className="text-[10px] text-slate-500">{new Date(block.timestamp).toLocaleTimeString()}</span>
                    {isTampered && (
                      <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded">
                        DATA MUTATED
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      Hash: {block.hash.slice(0, 16)}...
                    </span>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Block Metadata */}
                {isExpanded && (
                  <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 text-[11px] space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-slate-300">
                      <div>
                        <span className="text-slate-500">Previous SHA3-512 Hash:</span>
                        <div className="text-[10px] text-slate-400 truncate">{block.prev_hash}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Current Block Hash:</span>
                        <div className="text-[10px] text-cyan-300 truncate">{block.hash}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Merkle Root:</span>
                        <div className="text-[10px] text-amber-300 truncate">{block.merkle_root}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">PQC Signature (ML-DSA-65):</span>
                        <div className="text-[10px] text-emerald-400 truncate">{block.pqc_signature.signature_hex_preview}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-500 block mb-1">Payload Summary:</span>
                      <pre className="bg-slate-950 p-2 rounded text-[10px] text-slate-300 overflow-x-auto">
                        {JSON.stringify(block.payload_summary, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
