// =========================================================
// Rule-Based Crop Score Engine
// CropScore = 0.30×Yield + 0.20×Soil + 0.20×Water + 0.20×Season + 0.10×Stability
// =========================================================

export type YieldLevel = 'high' | 'medium' | 'low';
export type SoilType = 'Alluvial' | 'Black (Regur)' | 'Red' | 'Laterite' | 'Loamy' | 'Sandy' | 'Clay';
export type Season = 'Kharif' | 'Rabi' | 'Summer';

export interface CropScoreInput {
  cropType: string;
  pastYield: YieldLevel;
  soilType: SoilType;
  irrigationAvailable: boolean;
  season: Season;
  landSize: number;
}

export interface CropScoreBreakdown {
  yieldScore: number;
  soilScore: number;
  waterScore: number;
  seasonScore: number;
  stabilityScore: number;
  totalScore: number;
}

export type Eligibility = 'eligible' | 'conditional' | 'not_eligible';

export interface CropScoreResult {
  score: number;
  breakdown: CropScoreBreakdown;
  eligibility: Eligibility;
  suggestions: string[];
}

// ── Sub-score tables ──

const YIELD_SCORES: Record<YieldLevel, number> = {
  high: 90,
  medium: 65,
  low: 35,
};

const SOIL_SCORES: Record<SoilType, number> = {
  'Alluvial': 92,
  'Loamy': 90,
  'Black (Regur)': 85,
  'Red': 70,
  'Clay': 60,
  'Laterite': 50,
  'Sandy': 42,
};

// Crop-season suitability matrix
const SEASON_MATRIX: Record<string, Record<Season, number>> = {
  'Rice':       { Kharif: 92, Rabi: 40, Summer: 55 },
  'Paddy':      { Kharif: 92, Rabi: 40, Summer: 55 },
  'Wheat':      { Kharif: 35, Rabi: 95, Summer: 30 },
  'Cotton':     { Kharif: 88, Rabi: 30, Summer: 45 },
  'Sugarcane':  { Kharif: 85, Rabi: 70, Summer: 60 },
  'Maize':      { Kharif: 90, Rabi: 55, Summer: 65 },
  'Millet':     { Kharif: 88, Rabi: 40, Summer: 50 },
  'Mustard':    { Kharif: 30, Rabi: 92, Summer: 35 },
  'Chickpea':   { Kharif: 35, Rabi: 90, Summer: 30 },
  'Soybean':    { Kharif: 90, Rabi: 40, Summer: 50 },
  'Groundnut':  { Kharif: 85, Rabi: 50, Summer: 60 },
  'Tomato':     { Kharif: 60, Rabi: 80, Summer: 70 },
  'Potato':     { Kharif: 40, Rabi: 90, Summer: 35 },
  'Onion':      { Kharif: 50, Rabi: 85, Summer: 60 },
  'Turmeric':   { Kharif: 85, Rabi: 50, Summer: 40 },
  'Lentils':    { Kharif: 35, Rabi: 88, Summer: 30 },
  'Cumin':      { Kharif: 30, Rabi: 90, Summer: 25 },
  'Guar':       { Kharif: 88, Rabi: 35, Summer: 45 },
  'Spinach':    { Kharif: 50, Rabi: 85, Summer: 55 },
  'Green Peas': { Kharif: 35, Rabi: 90, Summer: 30 },
  'Ginger':     { Kharif: 85, Rabi: 45, Summer: 40 },
};

// Crop stability (price + weather resilience)
const STABILITY_SCORES: Record<string, number> = {
  'Rice': 90, 'Paddy': 90, 'Wheat': 92,
  'Sugarcane': 85, 'Maize': 78,
  'Cotton': 65, 'Soybean': 72, 'Millet': 80,
  'Mustard': 70, 'Chickpea': 75, 'Groundnut': 68,
  'Lentils': 75, 'Cumin': 60, 'Guar': 55,
  'Tomato': 45, 'Potato': 55, 'Onion': 40,
  'Turmeric': 65, 'Spinach': 50, 'Green Peas': 55,
  'Ginger': 60,
};

const DEFAULT_SEASON_SCORE = 55;
const DEFAULT_STABILITY = 60;

// ── Main Calculator ──

export function calculateCropScore(input: CropScoreInput): CropScoreResult {
  const yieldScore = YIELD_SCORES[input.pastYield];
  const soilScore = SOIL_SCORES[input.soilType];
  const waterScore = input.irrigationAvailable ? 90 : 55;

  const cropKey = input.cropType;
  const seasonScore = SEASON_MATRIX[cropKey]?.[input.season] ?? DEFAULT_SEASON_SCORE;
  const stabilityScore = STABILITY_SCORES[cropKey] ?? DEFAULT_STABILITY;

  const totalScore = Math.round(
    0.30 * yieldScore +
    0.20 * soilScore +
    0.20 * waterScore +
    0.20 * seasonScore +
    0.10 * stabilityScore
  );

  const breakdown: CropScoreBreakdown = {
    yieldScore,
    soilScore,
    waterScore,
    seasonScore,
    stabilityScore,
    totalScore,
  };

  // Eligibility
  let eligibility: Eligibility;
  if (totalScore >= 80) eligibility = 'eligible';
  else if (totalScore >= 50) eligibility = 'conditional';
  else eligibility = 'not_eligible';

  // Rule-based suggestions
  const suggestions: string[] = [];
  if (waterScore < 70) suggestions.push('Increase irrigation access to improve water score.');
  if (stabilityScore < 65) suggestions.push('Consider switching to a more stable crop (e.g., Rice, Wheat).');
  if (soilScore < 65) suggestions.push('Improve soil fertility through organic amendments or crop rotation.');
  if (seasonScore < 60) suggestions.push('Choose a season-appropriate crop for better suitability score.');
  if (yieldScore < 60) suggestions.push('Improve past yield through better farming practices and inputs.');
  if (input.landSize < 1) suggestions.push('Small land parcels may limit loan amount. Consider cooperative farming.');

  return { score: totalScore, breakdown, eligibility, suggestions };
}

// ── Loan Schemes ──

export interface LoanScheme {
  id: string;
  name: string;
  maxAmount: number;
  minScore: number;
  interestRate: string;
  description: string;
  icon: string;
}

export const LOAN_SCHEMES: LoanScheme[] = [
  {
    id: 'pmksn',
    name: 'PM Kisan Samman Nidhi',
    maxAmount: 6000,
    minScore: 30,
    interestRate: '0%',
    description: 'Annual ₹6,000 direct benefit transfer in 3 installments.',
    icon: '🏛️',
  },
  {
    id: 'kcc',
    name: 'Kisan Credit Card (KCC)',
    maxAmount: 300000,
    minScore: 50,
    interestRate: '4%',
    description: 'Crop loan up to ₹3L at subsidized 4% interest for cultivation needs.',
    icon: '💳',
  },
  {
    id: 'pmfby',
    name: 'PMFBY Crop Insurance',
    maxAmount: 200000,
    minScore: 35,
    interestRate: '1.5-5%',
    description: 'Crop insurance at 1.5-5% premium covering natural calamities.',
    icon: '🛡️',
  },
  {
    id: 'atl',
    name: 'Agricultural Term Loan',
    maxAmount: 500000,
    minScore: 70,
    interestRate: '7%',
    description: 'Medium-term loan for farm equipment, irrigation, and infrastructure.',
    icon: '🏦',
  },
];
