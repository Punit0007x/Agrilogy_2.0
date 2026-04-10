import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Landmark, ShieldCheck, AlertTriangle, ChevronRight,
  Loader2, CheckCircle2, XCircle, Clock, FileText, TrendingUp,
  Droplets, Sprout, Thermometer, BarChart3, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLoanStore, type LoanApplication } from '@/store/loanStore';
import { useVillageStore } from '@/store/villageStore';
import {
  calculateCropScore,
  LOAN_SCHEMES,
  type CropScoreInput,
  type SoilType,
  type YieldLevel,
  type Season,
  type LoanScheme,
} from '@/lib/cropScoreEngine';
import { cropOptions } from '@/data/farmersData';

const SOIL_TYPES: SoilType[] = ['Alluvial', 'Black (Regur)', 'Red', 'Laterite', 'Loamy', 'Sandy', 'Clay'];
const SEASONS: Season[] = ['Kharif', 'Rabi', 'Summer'];
const YIELD_LEVELS: { value: YieldLevel; label: string; emoji: string }[] = [
  { value: 'high', label: 'High', emoji: '🌾' },
  { value: 'medium', label: 'Medium', emoji: '🌱' },
  { value: 'low', label: 'Low', emoji: '🍂' },
];

interface LoanApplicationProps {
  onBack?: () => void;
}

export default function LoanApplication({ onBack }: LoanApplicationProps) {
  const [tab, setTab] = useState<'apply' | 'history'>('apply');
  const [step, setStep] = useState<'scheme' | 'form' | 'result'>('scheme');
  const [selectedScheme, setSelectedScheme] = useState<LoanScheme | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<LoanApplication | null>(null);

  // Form state
  const [cropType, setCropType] = useState('Rice');
  const [landSize, setLandSize] = useState(2);
  const [pastYield, setPastYield] = useState<YieldLevel>('medium');
  const [irrigation, setIrrigation] = useState(true);
  const [soilType, setSoilType] = useState<SoilType>('Loamy');
  const [season, setSeason] = useState<Season>('Kharif');

  const submitApplication = useLoanStore(s => s.submitApplication);
  const allApps = useLoanStore(s => s.applications);
  const selectedFarmerId = useVillageStore(s => s.selectedFarmerId);
  const farmers = useVillageStore(s => s.farmers);
  const farmer = selectedFarmerId ? farmers[selectedFarmerId] : null;

  const myApps = useMemo(() =>
    allApps.filter(a => a.farmerId === (selectedFarmerId || '')),
    [allApps, selectedFarmerId]
  );

  // Live crop score
  const liveInput: CropScoreInput = { cropType, landSize, pastYield, irrigationAvailable: irrigation, soilType, season };
  const liveScore = useMemo(() => calculateCropScore(liveInput), [cropType, landSize, pastYield, irrigation, soilType, season]);

  const handleSubmit = async () => {
    if (!farmer || !selectedScheme) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    const app = submitApplication({
      farmerId: farmer.id,
      farmerName: farmer.name,
      village: farmer.region.replace('_', ' '),
      schemeId: selectedScheme.id,
      input: liveInput,
    });
    setLastResult(app);
    setStep('result');
    setSubmitting(false);
  };

  const resetForm = () => {
    setStep('scheme');
    setSelectedScheme(null);
    setLastResult(null);
  };

  const isEmbedded = !!onBack;
  const eligColor = liveScore.eligibility === 'eligible' ? 'text-green-500' : liveScore.eligibility === 'conditional' ? 'text-yellow-500' : 'text-red-500';
  const eligBg = liveScore.eligibility === 'eligible' ? 'bg-green-500/20 border-green-500/30' : liveScore.eligibility === 'conditional' ? 'bg-yellow-500/20 border-yellow-500/30' : 'bg-red-500/20 border-red-500/30';

  // ── Render ──

  return (
    <div className={isEmbedded ? 'flex flex-col' : 'min-h-screen bg-gradient-to-br from-emerald-50 to-green-50'}>
      {/* Header */}
      {!isEmbedded && (
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Landmark className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Loan Application</h1>
                  <p className="text-sm text-gray-500">Crop Score Based Financing</p>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {isEmbedded && (
        <div className="flex items-center justify-between p-3 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={16} /></button>
            <Landmark size={16} className="text-emerald-400" />
            <span className="text-xs font-bold">Loan Application</span>
          </div>
          {farmer && <span className="text-[8px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded-full">{farmer.name}</span>}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border/30 shrink-0">
        {(['apply', 'history'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === 'apply') resetForm(); }}
            className={`flex-1 py-2 text-[10px] font-semibold tracking-wide uppercase transition-all ${tab === t ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}>
            {t === 'apply' ? '📋 Apply' : `📂 History (${myApps.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${isEmbedded ? 'p-3 space-y-2' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4'} custom-scrollbar`}>

        {/* ─── APPLY TAB ─── */}
        {tab === 'apply' && step === 'scheme' && (
          <div className="space-y-2">
            <p className={`${isEmbedded ? 'text-[10px]' : 'text-sm'} text-muted-foreground`}>Select a loan scheme to apply for:</p>
            {LOAN_SCHEMES.map(scheme => (
              <button key={scheme.id} onClick={() => { setSelectedScheme(scheme); setStep('form'); }}
                className={`w-full text-left ${isEmbedded ? 'p-2.5' : 'p-4'} rounded-lg border transition-all hover:scale-[1.01] active:scale-[0.99]
                  ${isEmbedded ? 'bg-muted/20 border-border/20 hover:bg-muted/40 hover:border-primary/30' : 'bg-white border-gray-200 hover:shadow-lg hover:border-emerald-300'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`${isEmbedded ? 'text-lg' : 'text-2xl'}`}>{scheme.icon}</span>
                    <div>
                      <p className={`font-bold ${isEmbedded ? 'text-xs' : 'text-base'}`}>{scheme.name}</p>
                      <p className={`${isEmbedded ? 'text-[8px]' : 'text-xs'} text-muted-foreground`}>{scheme.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={isEmbedded ? 14 : 18} className="text-muted-foreground" />
                </div>
                <div className={`flex gap-3 mt-1.5 ${isEmbedded ? 'text-[7px]' : 'text-[10px]'}`}>
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">Max: ₹{scheme.maxAmount.toLocaleString()}</span>
                  <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">Rate: {scheme.interestRate}</span>
                  <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20">Min Score: {scheme.minScore}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'apply' && step === 'form' && selectedScheme && (
          <div className="space-y-2.5">
            {/* Scheme badge */}
            <div className={`flex items-center justify-between ${isEmbedded ? 'p-2 text-[9px]' : 'p-3 text-xs'} bg-emerald-500/10 border border-emerald-500/20 rounded-lg`}>
              <span className="flex items-center gap-1.5 font-semibold">{selectedScheme.icon} {selectedScheme.name}</span>
              <button onClick={() => setStep('scheme')} className="text-primary hover:underline">Change</button>
            </div>

            {/* Crop Type */}
            <div className={`${isEmbedded ? 'bg-muted/20 rounded-lg p-2 border border-border/20' : 'bg-white rounded-xl p-4 border shadow-sm'}`}>
              <label className={`block font-semibold mb-1.5 ${isEmbedded ? 'text-[10px]' : 'text-sm'}`}>
                <Sprout className={`inline w-3 h-3 mr-1 text-emerald-500`} /> Crop Type
              </label>
              <select value={cropType} onChange={e => setCropType(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 ${isEmbedded ? 'text-xs bg-muted/30 border border-border/30' : 'text-sm bg-gray-50 border'} focus:outline-none focus:ring-2 focus:ring-primary/30`}>
                {cropOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Land Size */}
            <div className={`${isEmbedded ? 'bg-muted/20 rounded-lg p-2 border border-border/20' : 'bg-white rounded-xl p-4 border shadow-sm'}`}>
              <div className={`flex justify-between ${isEmbedded ? 'text-[10px]' : 'text-sm'} mb-1`}>
                <span className="font-semibold">📐 Land Size</span>
                <span className="font-bold text-primary">{landSize} acres</span>
              </div>
              <input type="range" min="0.5" max="50" step="0.5" value={landSize} onChange={e => setLandSize(Number(e.target.value))} className="w-full accent-emerald-500" />
              <div className={`flex justify-between ${isEmbedded ? 'text-[7px]' : 'text-[10px]'} text-muted-foreground`}>
                <span>0.5 acres</span><span>50 acres</span>
              </div>
            </div>

            {/* Past Yield */}
            <div className={`${isEmbedded ? 'bg-muted/20 rounded-lg p-2 border border-border/20' : 'bg-white rounded-xl p-4 border shadow-sm'}`}>
              <label className={`block font-semibold mb-1.5 ${isEmbedded ? 'text-[10px]' : 'text-sm'}`}>📊 Past Yield</label>
              <div className="flex gap-2">
                {YIELD_LEVELS.map(y => (
                  <button key={y.value} onClick={() => setPastYield(y.value)}
                    className={`flex-1 ${isEmbedded ? 'py-1.5 text-[9px]' : 'py-2.5 text-xs'} rounded-lg border font-semibold transition-all ${pastYield === y.value
                      ? 'bg-primary/30 border-primary/50 text-foreground scale-[1.02]'
                      : 'bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40'}`}>
                    {y.emoji} {y.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Irrigation */}
            <div className={`${isEmbedded ? 'bg-muted/20 rounded-lg p-2 border border-border/20' : 'bg-white rounded-xl p-4 border shadow-sm'}`}>
              <label className={`block font-semibold mb-1.5 ${isEmbedded ? 'text-[10px]' : 'text-sm'}`}>
                <Droplets className="inline w-3 h-3 mr-1 text-blue-500" /> Irrigation Available
              </label>
              <div className="flex gap-2">
                {[true, false].map(v => (
                  <button key={String(v)} onClick={() => setIrrigation(v)}
                    className={`flex-1 ${isEmbedded ? 'py-1.5 text-[9px]' : 'py-2.5 text-xs'} rounded-lg border font-semibold transition-all ${irrigation === v
                      ? (v ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-orange-500/20 border-orange-500/40 text-orange-400')
                      : 'bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40'}`}>
                    {v ? '✅ Yes' : '❌ No'}
                  </button>
                ))}
              </div>
            </div>

            {/* Soil Type */}
            <div className={`${isEmbedded ? 'bg-muted/20 rounded-lg p-2 border border-border/20' : 'bg-white rounded-xl p-4 border shadow-sm'}`}>
              <label className={`block font-semibold mb-1.5 ${isEmbedded ? 'text-[10px]' : 'text-sm'}`}>🌍 Soil Type</label>
              <div className="flex flex-wrap gap-1.5">
                {SOIL_TYPES.map(s => (
                  <button key={s} onClick={() => setSoilType(s)}
                    className={`${isEmbedded ? 'text-[8px] px-2 py-1' : 'text-xs px-3 py-1.5'} rounded-full border transition-all ${soilType === s
                      ? 'bg-primary/30 border-primary/50 text-foreground'
                      : 'bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Season */}
            <div className={`${isEmbedded ? 'bg-muted/20 rounded-lg p-2 border border-border/20' : 'bg-white rounded-xl p-4 border shadow-sm'}`}>
              <label className={`block font-semibold mb-1.5 ${isEmbedded ? 'text-[10px]' : 'text-sm'}`}>🗓️ Season</label>
              <div className="flex gap-2">
                {SEASONS.map(s => (
                  <button key={s} onClick={() => setSeason(s)}
                    className={`flex-1 ${isEmbedded ? 'py-1.5 text-[9px]' : 'py-2.5 text-xs'} rounded-lg border font-semibold transition-all ${season === s
                      ? 'bg-primary/30 border-primary/50 text-foreground'
                      : 'bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* ── LIVE CROP SCORE ── */}
            <div className={`${isEmbedded ? 'p-2.5' : 'p-4'} rounded-lg border ${eligBg}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-bold ${isEmbedded ? 'text-xs' : 'text-base'}`}>📊 Live Crop Score</span>
                <span className={`font-black ${eligColor} ${isEmbedded ? 'text-xl' : 'text-3xl'}`}>{liveScore.score}</span>
              </div>
              <div className={`flex items-center gap-2 mb-2 ${isEmbedded ? 'text-[9px]' : 'text-xs'}`}>
                {liveScore.eligibility === 'eligible' && <><CheckCircle2 size={12} className="text-green-500" /><span className="text-green-500 font-bold">Eligible</span></>}
                {liveScore.eligibility === 'conditional' && <><AlertTriangle size={12} className="text-yellow-500" /><span className="text-yellow-500 font-bold">Conditional</span></>}
                {liveScore.eligibility === 'not_eligible' && <><XCircle size={12} className="text-red-500" /><span className="text-red-500 font-bold">Not Eligible</span></>}
              </div>

              {/* Score breakdown bars */}
              <div className="space-y-1">
                {([
                  ['Yield', liveScore.breakdown.yieldScore, 'bg-green-500'],
                  ['Soil', liveScore.breakdown.soilScore, 'bg-amber-500'],
                  ['Water', liveScore.breakdown.waterScore, 'bg-blue-500'],
                  ['Season', liveScore.breakdown.seasonScore, 'bg-purple-500'],
                  ['Stability', liveScore.breakdown.stabilityScore, 'bg-cyan-500'],
                ] as [string, number, string][]).map(([label, value, color]) => (
                  <div key={label} className={`flex items-center gap-2 ${isEmbedded ? 'text-[8px]' : 'text-[10px]'}`}>
                    <span className="w-14 text-muted-foreground">{label}</span>
                    <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
                    </div>
                    <span className="w-6 text-right font-bold">{value}</span>
                  </div>
                ))}
              </div>

              {/* Suggestions */}
              {liveScore.suggestions.length > 0 && (
                <div className={`mt-2 pt-2 border-t border-current/10 ${isEmbedded ? 'text-[8px]' : 'text-[10px]'} space-y-0.5`}>
                  <p className="font-semibold text-muted-foreground flex items-center gap-1"><Sparkles size={10} /> Suggestions:</p>
                  {liveScore.suggestions.map((s, i) => (
                    <p key={i} className="text-muted-foreground">• {s}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <Button onClick={handleSubmit} disabled={submitting || liveScore.score < selectedScheme.minScore}
              className={`w-full gap-2 ${isEmbedded
                ? 'bg-emerald-500/30 hover:bg-emerald-500/50 text-foreground border border-emerald-500/30 text-xs py-2'
                : 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-5 text-base'}`}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                : liveScore.score < selectedScheme.minScore
                  ? <><XCircle className="w-4 h-4" /> Score Below Minimum ({selectedScheme.minScore})</>
                  : <><FileText className="w-4 h-4" /> Submit Application</>}
            </Button>
          </div>
        )}

        {/* ─── RESULT ─── */}
        {tab === 'apply' && step === 'result' && lastResult && (
          <div className="space-y-3">
            <div className={`text-center ${isEmbedded ? 'p-3' : 'p-6'}`}>
              {lastResult.eligibility === 'eligible' ? <CheckCircle2 className={`mx-auto mb-2 text-green-500 ${isEmbedded ? 'w-10 h-10' : 'w-16 h-16'}`} />
                : lastResult.eligibility === 'conditional' ? <AlertTriangle className={`mx-auto mb-2 text-yellow-500 ${isEmbedded ? 'w-10 h-10' : 'w-16 h-16'}`} />
                  : <XCircle className={`mx-auto mb-2 text-red-500 ${isEmbedded ? 'w-10 h-10' : 'w-16 h-16'}`} />}
              <p className={`font-black ${eligColor} ${isEmbedded ? 'text-2xl' : 'text-4xl'}`}>{lastResult.cropScore}/100</p>
              <p className={`font-bold uppercase ${isEmbedded ? 'text-xs mt-1' : 'text-sm mt-2'} ${eligColor}`}>
                {lastResult.eligibility === 'eligible' ? 'Application Submitted — Eligible' : lastResult.eligibility === 'conditional' ? 'Submitted — Conditional Review' : 'Submitted — Needs Review'}
              </p>
              <p className={`text-muted-foreground ${isEmbedded ? 'text-[9px] mt-1' : 'text-xs mt-2'}`}>
                Application ID: {lastResult.id.slice(0, 16)}... • Status: <span className="text-yellow-500 font-bold">Pending</span>
              </p>
            </div>

            {lastResult.suggestions.length > 0 && (
              <div className={`${isEmbedded ? 'p-2 text-[9px]' : 'p-4 text-xs'} bg-amber-500/10 border border-amber-500/20 rounded-lg`}>
                <p className="font-bold text-amber-400 mb-1">💡 Improvement Suggestions:</p>
                {lastResult.suggestions.map((s, i) => <p key={i} className="text-muted-foreground">• {s}</p>)}
              </div>
            )}

            <Button onClick={resetForm} className={`w-full ${isEmbedded ? 'text-xs' : 'text-sm'}`} variant="outline">
              Apply for Another Scheme
            </Button>
          </div>
        )}

        {/* ─── HISTORY TAB ─── */}
        {tab === 'history' && (
          <div className="space-y-2">
            {myApps.length === 0 ? (
              <div className={`text-center ${isEmbedded ? 'py-8' : 'py-16'}`}>
                <FileText className={`mx-auto mb-3 text-muted-foreground ${isEmbedded ? 'w-8 h-8' : 'w-16 h-16'}`} />
                <p className={`font-semibold ${isEmbedded ? 'text-xs' : 'text-lg'}`}>No Applications Yet</p>
                <p className={`text-muted-foreground ${isEmbedded ? 'text-[9px]' : 'text-sm'}`}>Apply for a loan to see your history here.</p>
              </div>
            ) : myApps.map(app => (
              <div key={app.id} className={`${isEmbedded ? 'p-2.5' : 'p-4'} rounded-lg border ${isEmbedded ? 'bg-muted/20 border-border/20' : 'bg-white border-gray-200'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`${isEmbedded ? 'text-sm' : 'text-xl'}`}>
                      {LOAN_SCHEMES.find(s => s.id === app.schemeId)?.icon || '📋'}
                    </span>
                    <div>
                      <p className={`font-bold ${isEmbedded ? 'text-[10px]' : 'text-sm'}`}>
                        {LOAN_SCHEMES.find(s => s.id === app.schemeId)?.name}
                      </p>
                      <p className={`text-muted-foreground ${isEmbedded ? 'text-[8px]' : 'text-xs'}`}>
                        {app.cropType} • {app.landSize} acres • {app.season}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`font-black ${isEmbedded ? 'text-sm' : 'text-xl'} ${app.eligibility === 'eligible' ? 'text-green-500' : app.eligibility === 'conditional' ? 'text-yellow-500' : 'text-red-500'}`}>
                      {app.cropScore}
                    </span>
                  </div>
                </div>

                {/* Status badge */}
                <div className={`flex items-center gap-2 ${isEmbedded ? 'text-[8px]' : 'text-[10px]'}`}>
                  {app.status === 'pending' && <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full border border-yellow-500/20"><Clock size={8} />Pending Review</span>}
                  {app.status === 'approved' && <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full border border-green-500/20"><CheckCircle2 size={8} />Approved ✓</span>}
                  {app.status === 'rejected' && (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-500 rounded-full border border-red-500/20"><XCircle size={8} />Rejected</span>
                  )}
                  <span className="text-muted-foreground">{new Date(app.appliedAt).toLocaleDateString()}</span>
                </div>

                {app.status === 'rejected' && app.rejectionReason && (
                  <div className={`mt-1.5 p-1.5 bg-red-500/10 border border-red-500/20 rounded ${isEmbedded ? 'text-[8px]' : 'text-[10px]'}`}>
                    <span className="font-bold text-red-400">Reason: </span>{app.rejectionReason}
                    {app.rejectionRemarks && <> — <span className="italic">{app.rejectionRemarks}</span></>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
