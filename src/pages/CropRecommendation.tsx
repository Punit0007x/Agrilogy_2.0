import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sprout, Droplets, Thermometer, TrendingUp, Loader2, Sparkles, FlaskConical, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// ML-style crop recommendation based on NPK + climate data (auto-fed from ploughing IoT)
interface SoilInput {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature: number;
  humidity: number;
  ph: number;
}

const defaultSoilData: SoilInput = {
  nitrogen: 90,
  phosphorus: 45,
  potassium: 40,
  temperature: 25,
  humidity: 65,
  ph: 6.5,
};

// Simulated ML recommendation engine
function getRecommendations(input: SoilInput) {
  const { nitrogen: n, phosphorus: p, potassium: k, temperature: t, humidity: h, ph } = input;

  const crops = [
    { name: 'Rice (Paddy)', baseScore: 88, idealN: [80, 120], idealP: [40, 60], idealK: [35, 50], idealT: [20, 35], idealH: [60, 85], idealPH: [5.5, 6.5], water: 'High', revenue: '₹52,000/acre', time: '150 days', season: 'Kharif' },
    { name: 'Wheat', baseScore: 92, idealN: [70, 120], idealP: [35, 55], idealK: [30, 45], idealT: [15, 28], idealH: [50, 70], idealPH: [6.0, 7.5], water: 'Medium', revenue: '₹45,000/acre', time: '120 days', season: 'Rabi' },
    { name: 'Maize', baseScore: 85, idealN: [60, 100], idealP: [30, 50], idealK: [25, 40], idealT: [20, 32], idealH: [50, 75], idealPH: [5.5, 7.0], water: 'Medium', revenue: '₹38,000/acre', time: '100 days', season: 'Kharif' },
    { name: 'Chickpea', baseScore: 78, idealN: [20, 50], idealP: [40, 60], idealK: [20, 35], idealT: [18, 30], idealH: [40, 65], idealPH: [6.0, 7.5], water: 'Low', revenue: '₹42,000/acre', time: '110 days', season: 'Rabi' },
    { name: 'Sugarcane', baseScore: 82, idealN: [80, 130], idealP: [50, 80], idealK: [40, 60], idealT: [25, 38], idealH: [60, 85], idealPH: [6.0, 7.5], water: 'Very High', revenue: '₹65,000/acre', time: '365 days', season: 'Kharif' },
    { name: 'Mustard', baseScore: 76, idealN: [40, 80], idealP: [20, 40], idealK: [15, 30], idealT: [15, 25], idealH: [40, 60], idealPH: [6.0, 7.0], water: 'Low', revenue: '₹35,000/acre', time: '90 days', season: 'Rabi' },
    { name: 'Soybean', baseScore: 80, idealN: [20, 60], idealP: [40, 60], idealK: [30, 45], idealT: [22, 32], idealH: [55, 75], idealPH: [6.0, 7.0], water: 'Medium', revenue: '₹40,000/acre', time: '120 days', season: 'Kharif' },
    { name: 'Cotton', baseScore: 75, idealN: [50, 90], idealP: [30, 50], idealK: [20, 40], idealT: [25, 35], idealH: [50, 70], idealPH: [6.5, 8.0], water: 'Medium', revenue: '₹48,000/acre', time: '180 days', season: 'Kharif' },
  ];

  const inRange = (val: number, range: number[]) => val >= range[0] && val <= range[1] ? 1 : 1 - Math.min(Math.abs(val - (range[0] + range[1]) / 2) / ((range[1] - range[0])), 1) * 0.5;

  return crops.map(crop => {
    const nScore = inRange(n, crop.idealN);
    const pScore = inRange(p, crop.idealP);
    const kScore = inRange(k, crop.idealK);
    const tScore = inRange(t, crop.idealT);
    const hScore = inRange(h, crop.idealH);
    const phScore = inRange(ph, crop.idealPH);

    const score = Math.round(crop.baseScore * ((nScore + pScore + kScore + tScore + hScore + phScore) / 6));
    
    return {
      name: crop.name,
      score: Math.min(99, Math.max(25, score)),
      water: crop.water,
      revenue: crop.revenue,
      time: crop.time,
      season: crop.season,
      reason: `N=${n} P=${p} K=${k} at ${t}°C/${h}% humidity, pH ${ph} — ${score >= 80 ? 'excellent' : score >= 60 ? 'good' : 'moderate'} match.`,
    };
  }).sort((a, b) => b.score - a.score).slice(0, 5);
}

interface CropRecommendationProps {
  onBack?: () => void;
  soilData?: SoilInput; // auto-fed from ploughing IoT sensors
}

export default function CropRecommendation({ onBack, soilData }: CropRecommendationProps) {
  const initial = soilData || defaultSoilData;
  const [inputs, setInputs] = useState<SoilInput>(initial);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof getRecommendations>>([]);

  const update = (key: keyof SoilInput, val: number) => setInputs(prev => ({ ...prev, [key]: val }));

  const handleAnalyze = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1800));
    setResults(getRecommendations(inputs));
    setShowResults(true);
    setLoading(false);
  };

  const isEmbedded = !!onBack;

  const inputFields: { key: keyof SoilInput; label: string; icon: string; unit: string; min: number; max: number; step: number; color: string }[] = [
    { key: 'nitrogen', label: 'Nitrogen (N)', icon: '🧪', unit: 'kg/ha', min: 0, max: 200, step: 5, color: 'text-green-500' },
    { key: 'phosphorus', label: 'Phosphorus (P)', icon: '⚗️', unit: 'kg/ha', min: 0, max: 150, step: 5, color: 'text-blue-500' },
    { key: 'potassium', label: 'Potassium (K)', icon: '🔬', unit: 'kg/ha', min: 0, max: 150, step: 5, color: 'text-purple-500' },
    { key: 'temperature', label: 'Temperature', icon: '🌡️', unit: '°C', min: 5, max: 50, step: 1, color: 'text-orange-500' },
    { key: 'humidity', label: 'Humidity', icon: '💧', unit: '%', min: 10, max: 100, step: 1, color: 'text-cyan-500' },
    { key: 'ph', label: 'Soil pH', icon: '📊', unit: 'pH', min: 3, max: 10, step: 0.1, color: 'text-amber-500' },
  ];

  return (
    <div className={isEmbedded ? 'flex flex-col' : 'min-h-screen bg-gradient-to-br from-green-50 to-emerald-50'}>
      {/* Header */}
      {!isEmbedded && (
        <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Sprout className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Crop Recommendation</h1>
                  <p className="text-sm text-gray-500">ML-powered · Auto-fed from ploughing IoT sensors</p>
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {isEmbedded && (
        <div className="flex items-center gap-2 p-3 border-b border-border/30 shrink-0">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={16} /></button>
          <Sprout size={16} className="text-primary" />
          <span className="text-xs font-bold">Crop AI</span>
          <span className="text-[7px] ml-auto text-muted-foreground bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded-full border border-blue-500/20">IoT Auto-Feed</span>
        </div>
      )}

      {/* Content */}
      <div className={`flex-1 overflow-y-auto ${isEmbedded ? 'p-3 space-y-2' : 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'} custom-scrollbar`}>
        {!showResults ? (
          <div className={isEmbedded ? 'space-y-2' : 'max-w-2xl mx-auto space-y-6'}>
            {/* Source Badge */}
            <div className={`flex items-center gap-2 ${isEmbedded ? 'text-[8px] p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg' : 'text-xs p-3 bg-blue-50 border border-blue-200 rounded-xl'}`}>
              <FlaskConical className={`${isEmbedded ? 'w-3 h-3' : 'w-4 h-4'} text-blue-500`} />
              <span>Data auto-populated from ploughing IoT sensors. Adjust values if needed.</span>
            </div>

            {/* NPK + Climate Inputs */}
            <div className={`${isEmbedded ? 'space-y-1.5' : 'space-y-4'}`}>
              {inputFields.map(field => (
                <div key={field.key} className={`${isEmbedded ? 'bg-muted/20 rounded-lg p-2 border border-border/20' : 'bg-white rounded-xl p-4 border shadow-sm'}`}>
                  <div className={`flex justify-between items-center ${isEmbedded ? 'mb-1' : 'mb-2'}`}>
                    <span className={`flex items-center gap-1 font-medium ${isEmbedded ? 'text-[10px]' : 'text-sm'}`}>
                      <span>{field.icon}</span> {field.label}
                    </span>
                    <span className={`font-bold ${field.color} ${isEmbedded ? 'text-xs' : 'text-base'}`}>
                      {inputs[field.key]} {field.unit}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={inputs[field.key]}
                    onChange={(e) => update(field.key, Number(e.target.value))}
                    className={`w-full ${isEmbedded ? 'h-1' : 'h-2'} accent-emerald-500`}
                  />
                  <div className={`flex justify-between ${isEmbedded ? 'text-[7px]' : 'text-[10px]'} text-muted-foreground mt-0.5`}>
                    <span>{field.min}</span>
                    <span>{field.max}</span>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={handleAnalyze} disabled={loading}
              className={`w-full gap-2 ${isEmbedded
                ? 'bg-primary/30 hover:bg-primary/50 text-foreground border border-primary/30 text-xs py-2'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg'
              }`}>
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing NPK Data...</> : <><Sparkles className="w-5 h-5" /> Get Recommendations</>}
            </Button>
          </div>
        ) : (
          <div className={isEmbedded ? 'space-y-2' : 'space-y-4'}>
            {/* Summary */}
            <div className={`flex items-center justify-between ${isEmbedded ? '' : 'mb-2'}`}>
              <h3 className={`font-bold flex items-center gap-1 ${isEmbedded ? 'text-xs' : 'text-lg'}`}>
                <Sparkles className={`${isEmbedded ? 'w-3 h-3' : 'w-5 h-5'} text-primary`} /> Top {results.length} Recommendations
              </h3>
              <button onClick={() => setShowResults(false)} className={`${isEmbedded ? 'text-[9px]' : 'text-sm'} text-primary hover:underline`}>← Edit Inputs</button>
            </div>

            {/* Input summary badge */}
            <div className={`flex flex-wrap gap-1 ${isEmbedded ? 'text-[7px]' : 'text-[10px]'}`}>
              <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded-full">N:{inputs.nitrogen}</span>
              <span className="px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded-full">P:{inputs.phosphorus}</span>
              <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-500 rounded-full">K:{inputs.potassium}</span>
              <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-500 rounded-full">{inputs.temperature}°C</span>
              <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-500 rounded-full">{inputs.humidity}%</span>
              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 rounded-full">pH:{inputs.ph}</span>
            </div>

            {results.map((crop, idx) => (
              <div key={crop.name}
                className={`rounded-lg border p-3 transition-all ${isEmbedded
                  ? 'bg-muted/20 border-border/20 hover:bg-muted/30'
                  : 'bg-white border-gray-200 hover:shadow-lg'
                }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isEmbedded ? 'text-xs text-primary' : 'text-lg'}`}>#{idx + 1}</span>
                    <span className={`font-bold ${isEmbedded ? 'text-xs' : 'text-lg'}`}>{crop.name}</span>
                  </div>
                  <span className={`font-bold ${isEmbedded ? 'text-sm text-primary' : 'text-2xl text-green-600'}`}>{crop.score}%</span>
                </div>
                <Progress value={crop.score} className={`${isEmbedded ? 'h-1.5' : 'h-2'} mb-2`} />
                <p className={`${isEmbedded ? 'text-[9px]' : 'text-sm'} text-muted-foreground mb-2`}>{crop.reason}</p>
                <div className={`flex flex-wrap gap-1 ${isEmbedded ? 'text-[8px]' : 'text-xs'}`}>
                  <span className={`px-2 py-0.5 rounded-full ${isEmbedded ? 'bg-primary/10 text-primary' : 'bg-green-100 text-green-700'}`}>{crop.season}</span>
                  <span className={`px-2 py-0.5 rounded-full ${isEmbedded ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>💧 {crop.water}</span>
                  <span className={`px-2 py-0.5 rounded-full ${isEmbedded ? 'bg-secondary/10 text-secondary' : 'bg-yellow-100 text-yellow-700'}`}>{crop.revenue}</span>
                  <span className={`px-2 py-0.5 rounded-full ${isEmbedded ? 'bg-muted/30 text-muted-foreground' : 'bg-gray-100 text-gray-700'}`}>{crop.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
