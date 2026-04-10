import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, FileCheck, CheckCircle2, XCircle, Clock, AlertTriangle,
  Users, TrendingUp, Filter, ChevronDown, ChevronUp, Loader2,
  ShieldCheck, BarChart3, Landmark, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLoanStore, type LoanApplication } from '@/store/loanStore';
import { LOAN_SCHEMES } from '@/lib/cropScoreEngine';

const REJECTION_REASONS = [
  'Low Crop Score',
  'Water / Irrigation Issue',
  'Poor Past Yield',
  'Land Size Insufficient',
  'Season Mismatch',
  'Incomplete Information',
];

interface LoanReviewProps {
  onBack?: () => void;
}

export default function LoanReview({ onBack }: LoanReviewProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const applications = useLoanStore(s => s.applications);
  const approveApplication = useLoanStore(s => s.approveApplication);
  const rejectApplication = useLoanStore(s => s.rejectApplication);

  const filtered = useMemo(() =>
    filterStatus === 'all' ? applications : applications.filter(a => a.status === filterStatus),
    [applications, filterStatus]
  );

  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    avgScore: applications.length > 0 ? Math.round(applications.reduce((s, a) => s + a.cropScore, 0) / applications.length) : 0,
  }), [applications]);

  const handleApprove = async (id: string) => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 800));
    approveApplication(id);
    setProcessing(false);
    setExpandedId(null);
  };

  const handleReject = async (id: string) => {
    if (!rejectReason) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 800));
    rejectApplication(id, rejectReason, rejectRemarks);
    setProcessing(false);
    setRejectingId(null);
    setRejectReason('');
    setRejectRemarks('');
    setExpandedId(null);
  };

  const isEmbedded = !!onBack;

  const getEligColor = (e: string) =>
    e === 'eligible' ? 'text-green-500' : e === 'conditional' ? 'text-yellow-500' : 'text-red-500';

  const getStatusBadge = (status: string) => {
    if (status === 'pending') return <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-500 rounded-full border border-yellow-500/20 text-[8px] font-bold"><Clock size={8} />Pending</span>;
    if (status === 'approved') return <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full border border-green-500/20 text-[8px] font-bold"><CheckCircle2 size={8} />Approved</span>;
    return <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-500 rounded-full border border-red-500/20 text-[8px] font-bold"><XCircle size={8} />Rejected</span>;
  };

  return (
    <div className={isEmbedded ? 'flex flex-col' : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50'}>
      {/* Header */}
      {!isEmbedded && (
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileCheck className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Loan Review</h1>
                  <p className="text-sm text-gray-500">Gram Panchayat Admin Dashboard</p>
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
            <FileCheck size={16} className="text-blue-400" />
            <span className="text-xs font-bold">Loan Review</span>
          </div>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${stats.pending > 0 ? 'bg-yellow-500/20 text-yellow-500 animate-pulse' : 'bg-muted/30 text-muted-foreground'}`}>
            {stats.pending} pending
          </span>
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${isEmbedded ? 'p-3 space-y-2' : 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4'} custom-scrollbar`}>

        {/* Stats */}
        <div className={`grid grid-cols-4 gap-1.5 ${isEmbedded ? '' : 'gap-3'}`}>
          {([
            ['Total', stats.total, '📋', 'bg-muted/20'],
            ['Pending', stats.pending, '⏳', 'bg-yellow-500/10'],
            ['Approved', stats.approved, '✅', 'bg-green-500/10'],
            ['Rejected', stats.rejected, '❌', 'bg-red-500/10'],
          ] as [string, number, string, string][]).map(([label, val, emoji, bg]) => (
            <div key={label} className={`${bg} ${isEmbedded ? 'p-1.5 rounded-lg' : 'p-3 rounded-xl border'} text-center`}>
              <span className={isEmbedded ? 'text-xs' : 'text-lg'}>{emoji}</span>
              <p className={`font-black ${isEmbedded ? 'text-sm' : 'text-2xl'}`}>{val}</p>
              <p className={`text-muted-foreground ${isEmbedded ? 'text-[7px]' : 'text-xs'}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Avg Score */}
        {stats.total > 0 && (
          <div className={`flex items-center justify-between ${isEmbedded ? 'p-2 text-[9px]' : 'p-3 text-xs'} bg-blue-500/10 border border-blue-500/20 rounded-lg`}>
            <span className="flex items-center gap-1"><BarChart3 size={12} className="text-blue-400" /> Average Crop Score</span>
            <span className="font-black text-blue-400">{stats.avgScore}/100</span>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`flex-1 ${isEmbedded ? 'py-1.5 text-[8px]' : 'py-2 text-xs'} rounded-lg font-semibold uppercase transition-all ${filterStatus === s
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'bg-muted/20 text-muted-foreground border border-border/20 hover:bg-muted/40'}`}>
              {s} ({s === 'all' ? stats.total : s === 'pending' ? stats.pending : s === 'approved' ? stats.approved : stats.rejected})
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filtered.length === 0 ? (
          <div className={`text-center ${isEmbedded ? 'py-8' : 'py-16'}`}>
            <Landmark className={`mx-auto mb-3 text-muted-foreground ${isEmbedded ? 'w-8 h-8' : 'w-16 h-16'}`} />
            <p className={`font-semibold ${isEmbedded ? 'text-xs' : 'text-lg'}`}>No Applications</p>
            <p className={`text-muted-foreground ${isEmbedded ? 'text-[9px]' : 'text-sm'}`}>
              {filterStatus === 'all' ? 'No loan applications have been submitted yet.' : `No ${filterStatus} applications.`}
            </p>
          </div>
        ) : filtered.map(app => {
          const scheme = LOAN_SCHEMES.find(s => s.id === app.schemeId);
          const isExpanded = expandedId === app.id;
          const isRejecting = rejectingId === app.id;

          return (
            <div key={app.id} className={`rounded-lg border transition-all ${isEmbedded ? 'bg-muted/20 border-border/20' : 'bg-white border-gray-200 hover:shadow-md'} ${isExpanded ? 'ring-1 ring-primary/30' : ''}`}>
              {/* Summary Row */}
              <button onClick={() => setExpandedId(isExpanded ? null : app.id)}
                className={`w-full text-left ${isEmbedded ? 'p-2.5' : 'p-4'} flex items-center justify-between`}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={isEmbedded ? 'text-sm' : 'text-xl'}>{scheme?.icon || '📋'}</span>
                  <div className="min-w-0">
                    <p className={`font-bold truncate ${isEmbedded ? 'text-[10px]' : 'text-sm'}`}>{app.farmerName}</p>
                    <p className={`text-muted-foreground truncate ${isEmbedded ? 'text-[8px]' : 'text-xs'}`}>
                      {app.cropType} • {app.landSize}ac • {app.village}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`font-black ${getEligColor(app.eligibility)} ${isEmbedded ? 'text-sm' : 'text-xl'}`}>{app.cropScore}</span>
                  {getStatusBadge(app.status)}
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className={`border-t border-border/20 ${isEmbedded ? 'p-2.5 space-y-2' : 'p-4 space-y-3'}`}>
                  {/* Farmer Details */}
                  <div className={`grid grid-cols-3 gap-1.5 ${isEmbedded ? 'text-[8px]' : 'text-xs'}`}>
                    <div className="bg-muted/20 rounded-lg p-1.5 text-center">
                      <p className="text-muted-foreground">Crop</p>
                      <p className="font-bold">{app.cropType}</p>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-1.5 text-center">
                      <p className="text-muted-foreground">Land</p>
                      <p className="font-bold">{app.landSize} acres</p>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-1.5 text-center">
                      <p className="text-muted-foreground">Irrigation</p>
                      <p className="font-bold">{app.irrigationAvailable ? '✅ Yes' : '❌ No'}</p>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-1.5 text-center">
                      <p className="text-muted-foreground">Soil</p>
                      <p className="font-bold">{app.soilType}</p>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-1.5 text-center">
                      <p className="text-muted-foreground">Season</p>
                      <p className="font-bold">{app.season}</p>
                    </div>
                    <div className="bg-muted/20 rounded-lg p-1.5 text-center">
                      <p className="text-muted-foreground">Yield</p>
                      <p className="font-bold capitalize">{app.pastYield}</p>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className={`${isEmbedded ? 'p-2' : 'p-3'} rounded-lg bg-muted/10 border border-border/10`}>
                    <p className={`font-bold mb-1.5 ${isEmbedded ? 'text-[9px]' : 'text-xs'}`}>📊 Score Breakdown</p>
                    {([
                      ['Yield (30%)', app.scoreBreakdown.yieldScore, 'bg-green-500'],
                      ['Soil (20%)', app.scoreBreakdown.soilScore, 'bg-amber-500'],
                      ['Water (20%)', app.scoreBreakdown.waterScore, 'bg-blue-500'],
                      ['Season (20%)', app.scoreBreakdown.seasonScore, 'bg-purple-500'],
                      ['Stability (10%)', app.scoreBreakdown.stabilityScore, 'bg-cyan-500'],
                    ] as [string, number, string][]).map(([label, value, color]) => (
                      <div key={label} className={`flex items-center gap-2 mb-0.5 ${isEmbedded ? 'text-[8px]' : 'text-[10px]'}`}>
                        <span className="w-20 text-muted-foreground">{label}</span>
                        <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
                        </div>
                        <span className="w-6 text-right font-bold">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Scheme info */}
                  {scheme && (
                    <div className={`${isEmbedded ? 'text-[8px] p-1.5' : 'text-[10px] p-2'} bg-blue-500/10 border border-blue-500/20 rounded-lg`}>
                      <span className="font-bold">{scheme.icon} {scheme.name}</span>
                      <span className="text-muted-foreground"> — Max ₹{scheme.maxAmount.toLocaleString()} @ {scheme.interestRate}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {app.status === 'pending' && !isRejecting && (
                    <div className="flex gap-2">
                      <Button onClick={() => handleApprove(app.id)} disabled={processing}
                        className={`flex-1 gap-1 ${isEmbedded ? 'text-[9px] py-1.5' : 'text-xs'} bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/30`}>
                        {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 size={12} />} Approve
                      </Button>
                      <Button onClick={() => setRejectingId(app.id)}
                        className={`flex-1 gap-1 ${isEmbedded ? 'text-[9px] py-1.5' : 'text-xs'} bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30`}>
                        <XCircle size={12} /> Reject
                      </Button>
                    </div>
                  )}

                  {/* Reject Dialog */}
                  {isRejecting && (
                    <div className={`${isEmbedded ? 'p-2 space-y-1.5' : 'p-3 space-y-2'} bg-red-500/10 border border-red-500/20 rounded-lg`}>
                      <p className={`font-bold text-red-400 ${isEmbedded ? 'text-[9px]' : 'text-xs'}`}>Select Rejection Reason:</p>
                      <div className="flex flex-wrap gap-1">
                        {REJECTION_REASONS.map(r => (
                          <button key={r} onClick={() => setRejectReason(r)}
                            className={`${isEmbedded ? 'text-[8px] px-2 py-1' : 'text-[10px] px-2.5 py-1'} rounded-full border transition-all ${rejectReason === r
                              ? 'bg-red-500/30 border-red-500/50 text-red-400 font-bold'
                              : 'bg-muted/20 border-border/30 text-muted-foreground hover:bg-muted/40'}`}>
                            {r}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Additional remarks (optional)..."
                        value={rejectRemarks}
                        onChange={e => setRejectRemarks(e.target.value)}
                        className={`w-full rounded-lg px-3 py-2 ${isEmbedded ? 'text-[9px]' : 'text-xs'} bg-muted/20 border border-border/30 focus:outline-none focus:ring-2 focus:ring-red-500/30`}
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => handleReject(app.id)} disabled={!rejectReason || processing}
                          className={`flex-1 gap-1 ${isEmbedded ? 'text-[9px] py-1.5' : 'text-xs'} bg-red-500/30 hover:bg-red-500/50 text-red-400 border border-red-500/30`}>
                          {processing ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle size={10} />} Confirm Reject
                        </Button>
                        <Button onClick={() => { setRejectingId(null); setRejectReason(''); setRejectRemarks(''); }}
                          className={`${isEmbedded ? 'text-[9px] py-1.5 px-3' : 'text-xs px-4'}`} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Show rejection info for already rejected */}
                  {app.status === 'rejected' && app.rejectionReason && (
                    <div className={`${isEmbedded ? 'p-1.5 text-[8px]' : 'p-2 text-[10px]'} bg-red-500/10 border border-red-500/20 rounded-lg`}>
                      <span className="font-bold text-red-400">Rejected: </span>{app.rejectionReason}
                      {app.rejectionRemarks && <> — <span className="italic text-muted-foreground">{app.rejectionRemarks}</span></>}
                    </div>
                  )}

                  {app.status === 'approved' && (
                    <div className={`${isEmbedded ? 'p-1.5 text-[8px]' : 'p-2 text-[10px]'} bg-green-500/10 border border-green-500/20 rounded-lg text-green-500 font-bold flex items-center gap-1`}>
                      <ShieldCheck size={12} /> Approved on {app.reviewedAt ? new Date(app.reviewedAt).toLocaleDateString() : '—'}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
