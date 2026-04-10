import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Leaf, CheckCircle2, Circle, Play, Pause, RotateCcw,
  Sparkles, Settings, Clock, Cpu, Brain, Bug, Thermometer,
  Droplets, FlaskConical, Sprout, Tractor, PackageCheck, Award,
  MapPin, ScanLine, Wheat, Sun,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

type StepStatus = 'completed' | 'current' | 'pending';

interface WorkflowStep {
  id: number;
  name: string;
  desc: string;
  duration: string;
  daysRange: [number, number]; // start day, end day
  status: StepStatus;
  icon: string;
  iotTag?: string; // IoT/AI integration tag
}

const makeSteps = (): WorkflowStep[] => [
  { id: 1,  name: 'Land Assessment',           desc: 'Survey, topography, drainage analysis',                daysRange: [1, 3],    duration: '3 days',   status: 'completed', icon: '📐', iotTag: undefined },
  { id: 2,  name: 'Ploughing',                 desc: 'Break, aerate, turn soil with tractor',                daysRange: [4, 6],    duration: '3 days',   status: 'completed', icon: '🚜', iotTag: 'IoT sensors on machine' },
  { id: 3,  name: 'Soil Testing',              desc: 'pH, nutrients, moisture, texture analysis',            daysRange: [7, 8],    duration: '2 days',   status: 'completed', icon: '🧪', iotTag: 'Auto-feeds crop rec. AI' },
  { id: 4,  name: 'Crop Selection',            desc: 'AI recommendation from soil data',                    daysRange: [9, 9],    duration: '1 day',    status: 'current',   icon: '🌾', iotTag: undefined },
  { id: 5,  name: 'Seed Selection & Treatment', desc: 'Variety, priming, fungicide coat',                    daysRange: [10, 11],  duration: '2 days',   status: 'pending',   icon: '🌱', iotTag: undefined },
  { id: 6,  name: 'Sowing / Transplanting',    desc: 'Row spacing, seed depth, density setup',              daysRange: [12, 15],  duration: '4 days',   status: 'pending',   icon: '🌿', iotTag: undefined },
  { id: 7,  name: 'Irrigation',                desc: 'Smart scheduling via humidity sensor',                daysRange: [16, 120], duration: 'Ongoing',  status: 'pending',   icon: '💧', iotTag: 'Humidity + rainfall IoT' },
  { id: 8,  name: 'Fertilisation',             desc: 'NPK dosing, organic amendments',                     daysRange: [20, 90],  duration: 'Periodic', status: 'pending',   icon: '🧬', iotTag: undefined },
  { id: 9,  name: 'Pest & Disease Control',    desc: 'AI image detection, spray plan',                     daysRange: [25, 110], duration: 'Ongoing',  status: 'pending',   icon: '🐛', iotTag: 'AI disease fix layer' },
  { id: 10, name: 'Crop Monitoring',           desc: 'Temperature, growth, NDVI tracking',                 daysRange: [16, 115], duration: 'Ongoing',  status: 'pending',   icon: '📡', iotTag: 'IoT dashboard live data' },
  { id: 11, name: 'Harvest Readiness Check',   desc: 'Maturity index, moisture level sensors',             daysRange: [116, 118],duration: '3 days',   status: 'pending',   icon: '✅', iotTag: undefined },
  { id: 12, name: 'Harvesting',                desc: 'Manual, mechanised, combine harvester',              daysRange: [119, 124],duration: '6 days',   status: 'pending',   icon: '🌻', iotTag: undefined },
  { id: 13, name: 'Post-Harvest Processing',   desc: 'Cleaning, grading, drying, storage',                 daysRange: [125, 130],duration: '6 days',   status: 'pending',   icon: '📦', iotTag: undefined },
  { id: 14, name: 'Quality Check & Grading',   desc: 'FSSAI, APMC grade standards compliance',             daysRange: [131, 133],duration: '3 days',   status: 'pending',   icon: '🏅', iotTag: undefined },
];

const TOTAL_SEASON_DAYS = 133;

interface CultivationWorkflowProps {
  onBack?: () => void;
}

export default function CultivationWorkflow({ onBack }: CultivationWorkflowProps) {
  const [mode, setMode] = useState<'auto' | 'manual'>('manual');
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<WorkflowStep[]>(makeSteps);
  const [currentDay, setCurrentDay] = useState(9);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const currentStep = steps.find(s => s.status === 'current');
  const dayProgress = (currentDay / TOTAL_SEASON_DAYS) * 100;

  // Auto-advance simulation
  useEffect(() => {
    if (running && mode === 'auto') {
      intervalRef.current = setInterval(() => {
        setCurrentDay(prev => {
          const next = prev + 1;
          if (next > TOTAL_SEASON_DAYS) {
            setRunning(false);
            return TOTAL_SEASON_DAYS;
          }
          setSteps(prevSteps => prevSteps.map(step => {
            if (next > step.daysRange[1]) return { ...step, status: 'completed' as StepStatus };
            if (next >= step.daysRange[0] && next <= step.daysRange[1]) return { ...step, status: 'current' as StepStatus };
            return { ...step, status: 'pending' as StepStatus };
          }));
          return next;
        });
      }, 600);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, mode]);

  const handleManualAdvance = () => {
    const cur = steps.find(s => s.status === 'current');
    if (!cur) return;
    setSteps(prev => prev.map(step => {
      if (step.id === cur.id) return { ...step, status: 'completed' as StepStatus };
      if (step.id === cur.id + 1) return { ...step, status: 'current' as StepStatus };
      return step;
    }));
    const nextStep = steps.find(s => s.id === cur.id + 1);
    if (nextStep) setCurrentDay(nextStep.daysRange[0]);
  };

  const handleReset = () => {
    setSteps(makeSteps());
    setCurrentDay(9);
    setRunning(false);
  };

  const isEmbedded = !!onBack;

  // =================== EMBEDDED MODE ===================
  if (isEmbedded) {
    return (
      <div className="flex flex-col ">
        <div className="flex items-center gap-2 p-3 border-b border-border/30">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={16} /></button>
          <Leaf size={16} className="text-green-400" />
          <span className="text-xs font-bold">Cultivation Workflow</span>
          <span className="text-[8px] ml-auto text-muted-foreground">Day {currentDay}/{TOTAL_SEASON_DAYS}</span>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Progress + Mode */}
          <div className="p-3 border-b border-border/20">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[9px] text-muted-foreground">Season Progress</span>
              <span className="text-[10px] font-bold text-primary">{Math.round(dayProgress)}%</span>
            </div>
            <Progress value={dayProgress} className="h-1.5 mb-2" />
            <div className="flex items-center justify-between">
              <div className="flex gap-1 text-[8px]">
                <button onClick={() => { setMode('manual'); setRunning(false); }} className={`px-2 py-0.5 rounded-full border transition-all ${mode === 'manual' ? 'bg-primary/20 border-primary/40 text-primary font-bold' : 'border-border/30 text-muted-foreground'}`}>Manual</button>
                <button onClick={() => setMode('auto')} className={`px-2 py-0.5 rounded-full border transition-all ${mode === 'auto' ? 'bg-primary/20 border-primary/40 text-primary font-bold' : 'border-border/30 text-muted-foreground'}`}>Auto</button>
              </div>
              <span className="text-[8px] text-muted-foreground">{completedCount}/{steps.length} done</span>
            </div>
          </div>

          {/* Steps Timeline */}
          <div className="p-3 space-y-1">
            {steps.map((step) => (
              <div key={step.id} className={`flex gap-2 items-start p-2 rounded-lg border transition-all ${
                step.status === 'current' ? 'bg-primary/10 border-primary/30' :
                step.status === 'completed' ? 'bg-green-500/5 border-green-500/15' :
                'bg-muted/5 border-border/10 opacity-50'
              }`}>
                {/* Status Icon */}
                <div className="shrink-0 mt-0.5 w-4">
                  {step.status === 'completed' ? <CheckCircle2 size={14} className="text-green-500" /> :
                   step.status === 'current' ? <div className="w-3.5 h-3.5 rounded-full border-2 border-primary animate-pulse" /> :
                   <Circle size={14} className="text-muted-foreground/40" />}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs">{step.icon}</span>
                    <span className={`text-[10px] font-bold leading-tight ${step.status === 'current' ? 'text-primary' : ''}`}>{step.name}</span>
                  </div>
                  <p className="text-[8px] text-muted-foreground leading-snug">{step.desc}</p>
                  {step.iotTag && (
                    <span className="inline-flex items-center gap-0.5 mt-0.5 text-[7px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                      <Cpu size={7} /> {step.iotTag}
                    </span>
                  )}
                </div>
                {/* Day badge */}
                <div className="shrink-0 text-right">
                  <span className="text-[7px] text-muted-foreground block">Day {step.daysRange[0]}–{step.daysRange[1]}</span>
                  <span className="text-[7px] text-muted-foreground/60">{step.duration}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="p-3 border-t border-border/20 flex gap-2">
            {mode === 'auto' ? (
              <button onClick={() => setRunning(!running)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${running
                  ? 'bg-destructive/20 text-destructive border border-destructive/30'
                  : 'bg-primary/20 text-primary border border-primary/30'}`}>
                {running ? <><Pause size={10} /> Pause</> : <><Play size={10} /> Run Auto</>}
              </button>
            ) : (
              <button onClick={handleManualAdvance} disabled={!currentStep}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 transition-all disabled:opacity-30">
                <CheckCircle2 size={10} /> Complete Step
              </button>
            )}
            <button onClick={handleReset} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] bg-muted/20 border border-border/20 text-muted-foreground hover:text-foreground">
              <RotateCcw size={10} /> Reset
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =================== FULL PAGE MODE ===================
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-lime-50">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-lime-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Leaf className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Cultivation Workflow</h1>
                  <p className="text-sm text-gray-500">14-Step End-to-End Farming · Day {currentDay}/{TOTAL_SEASON_DAYS}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={mode === 'manual' ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => { setMode('manual'); setRunning(false); }}>
                <Settings className="w-3 h-3 mr-1" /> Manual
              </Badge>
              <Badge variant={mode === 'auto' ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setMode('auto')}>
                <Sparkles className="w-3 h-3 mr-1" /> Auto
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Season Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-green-600" /> Season Progress</h2>
              <div className="text-right">
                <span className="text-3xl font-bold text-green-600">{Math.round(dayProgress)}%</span>
                <p className="text-xs text-gray-400">Day {currentDay} of {TOTAL_SEASON_DAYS}</p>
              </div>
            </div>
            <Progress value={dayProgress} className="h-4 mb-4" />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{completedCount} of {steps.length} steps completed</span>
              {currentStep && <span className="font-medium">Current: <strong className="text-green-700">{currentStep.icon} {currentStep.name}</strong></span>}
            </div>
          </CardContent>
        </Card>

        {/* Day Timeline Bar */}
        <div className="mb-8 relative">
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-600 rounded-full transition-all duration-500" style={{ width: `${dayProgress}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            {steps.filter((_, i) => i % 3 === 0 || i === steps.length - 1).map(step => (
              <span key={step.id} className="text-[10px] text-gray-400">D{step.daysRange[0]}</span>
            ))}
          </div>
        </div>

        {/* Steps Grid */}
        <div className="space-y-3">
          {steps.map((step) => (
            <Card key={step.id} className={`overflow-hidden transition-all duration-300 ${
              step.status === 'current' ? 'border-2 border-green-500 shadow-lg shadow-green-100 scale-[1.01]' :
              step.status === 'completed' ? 'border-green-200 bg-green-50/50' : 'opacity-50 hover:opacity-70'
            }`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  {/* Status */}
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                    step.status === 'completed' ? 'bg-green-100' :
                    step.status === 'current' ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg' : 'bg-gray-100'
                  }`}>
                    {step.status === 'completed' ? <CheckCircle2 className="w-7 h-7 text-green-600" /> : step.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-gray-400">Step {step.id}</span>
                      <h3 className={`font-bold text-lg ${step.status === 'current' ? 'text-green-700' : ''}`}>{step.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{step.desc}</p>
                    {step.iotTag && (
                      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full font-medium">
                        <Cpu className="w-3 h-3" /> {step.iotTag}
                      </span>
                    )}
                  </div>

                  {/* Day + Duration */}
                  <div className="text-right shrink-0">
                    <Badge variant={step.status === 'completed' ? 'default' : step.status === 'current' ? 'secondary' : 'outline'} className="mb-1">
                      {step.status}
                    </Badge>
                    <p className="text-sm font-bold text-gray-700">Day {step.daysRange[0]}–{step.daysRange[1]}</p>
                    <p className="text-xs text-gray-400">{step.duration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-4 mt-8 sticky bottom-4">
          {mode === 'auto' ? (
            <Button onClick={() => setRunning(!running)} className={`flex-1 gap-2 text-lg py-6 ${running ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}>
              {running ? <><Pause className="w-5 h-5" /> Pause Auto-Run</> : <><Play className="w-5 h-5" /> Start Auto-Run</>}
            </Button>
          ) : (
            <Button onClick={handleManualAdvance} disabled={!currentStep} className="flex-1 gap-2 text-lg py-6 bg-green-500 hover:bg-green-600 disabled:opacity-40">
              <CheckCircle2 className="w-5 h-5" /> Complete Current Step
            </Button>
          )}
          <Button onClick={handleReset} variant="outline" className="gap-2 py-6"><RotateCcw className="w-5 h-5" /> Reset</Button>
        </div>
      </div>
    </div>
  );
}
