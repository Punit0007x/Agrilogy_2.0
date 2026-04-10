import { create } from 'zustand';
import { calculateCropScore, type CropScoreInput, type CropScoreBreakdown, type Eligibility, type LoanScheme, LOAN_SCHEMES } from '@/lib/cropScoreEngine';

// ── Types ──

export interface LoanApplication {
  id: string;
  farmerId: string;
  farmerName: string;
  village: string;
  // Application data
  schemeId: string;
  cropType: string;
  landSize: number;
  pastYield: 'high' | 'medium' | 'low';
  irrigationAvailable: boolean;
  soilType: string;
  season: string;
  // Computed scores
  cropScore: number;
  scoreBreakdown: CropScoreBreakdown;
  eligibility: Eligibility;
  suggestions: string[];
  // Status
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  rejectionRemarks?: string;
  appliedAt: string;
  reviewedAt?: string;
}

interface LoanState {
  applications: LoanApplication[];
  schemes: LoanScheme[];

  // Actions
  submitApplication: (data: {
    farmerId: string;
    farmerName: string;
    village: string;
    schemeId: string;
    input: CropScoreInput;
  }) => LoanApplication;

  approveApplication: (appId: string) => void;

  rejectApplication: (appId: string, reason: string, remarks: string) => void;

  getApplicationsByFarmer: (farmerId: string) => LoanApplication[];

  getApplicationsByStatus: (status: 'pending' | 'approved' | 'rejected' | 'all') => LoanApplication[];
}

// ── Store ──

export const useLoanStore = create<LoanState>((set, get) => ({
  applications: [],
  schemes: LOAN_SCHEMES,

  submitApplication: (data) => {
    const result = calculateCropScore(data.input);
    const app: LoanApplication = {
      id: `loan_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      farmerId: data.farmerId,
      farmerName: data.farmerName,
      village: data.village,
      schemeId: data.schemeId,
      cropType: data.input.cropType,
      landSize: data.input.landSize,
      pastYield: data.input.pastYield,
      irrigationAvailable: data.input.irrigationAvailable,
      soilType: data.input.soilType,
      season: data.input.season,
      cropScore: result.score,
      scoreBreakdown: result.breakdown,
      eligibility: result.eligibility,
      suggestions: result.suggestions,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };

    set(state => ({ applications: [app, ...state.applications] }));
    return app;
  },

  approveApplication: (appId) => {
    set(state => ({
      applications: state.applications.map(a =>
        a.id === appId ? { ...a, status: 'approved' as const, reviewedAt: new Date().toISOString() } : a
      ),
    }));
  },

  rejectApplication: (appId, reason, remarks) => {
    set(state => ({
      applications: state.applications.map(a =>
        a.id === appId
          ? { ...a, status: 'rejected' as const, rejectionReason: reason, rejectionRemarks: remarks, reviewedAt: new Date().toISOString() }
          : a
      ),
    }));
  },

  getApplicationsByFarmer: (farmerId) => {
    return get().applications.filter(a => a.farmerId === farmerId);
  },

  getApplicationsByStatus: (status) => {
    if (status === 'all') return get().applications;
    return get().applications.filter(a => a.status === status);
  },
}));
