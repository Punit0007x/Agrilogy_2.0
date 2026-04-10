import { useState, useEffect, useRef } from 'react';
import { useVillageStore, type VillageFarmer } from '@/store/villageStore';
import { mandiData, aiRecommendations, cropOptions } from '@/data/farmersData';
import {
  X, Droplets, Sun, AlertTriangle, Leaf, BarChart3, Brain, Cloud,
  Sprout, Lightbulb, Bug, FlaskConical, TrendingUp, Plus, Trash2,
  Edit3, Users, MapPin, CheckCircle, ChevronRight, Wheat, Home, Fence,
  Droplet, Thermometer, Wind, Sparkles, ExternalLink, Cpu, Tractor,
  Newspaper, Activity, ArrowLeft, Landmark, FileCheck,
  GraduationCap, BookOpen, Users2, Award, Telescope,
} from 'lucide-react';
import gsap from 'gsap';

// Embedded feature components
import DiseaseDetection from '@/pages/DiseaseDetection';
import IoTDashboard from '@/pages/IoTDashboard';
import EquipmentRent from '@/pages/EquipmentRent';
import NewsPage from '@/pages/NewsPage';
import SoilAnalysis from '@/pages/SoilAnalysis';
import IrrigationPlanner from '@/pages/IrrigationPlanner';
import AIAssistant from '@/pages/AIAssistant';
import CropRecommendation from '@/pages/CropRecommendation';
import CultivationWorkflow from '@/pages/CultivationWorkflow';
import LoanApplication from '@/pages/LoanApplication';
import LoanReview from '@/pages/LoanReview';

// ============================================================
//  FARM PANEL — Rich tabbed panel when a house is clicked
// ============================================================

const TAB_LABELS = ['Overview', 'AI Advisor', 'Simulation', 'Market'] as const;
type TabName = typeof TAB_LABELS[number];

// Map of embedded views to components
const FARM_EMBEDDED_VIEWS: Record<string, React.ComponentType<{ onBack: () => void }>> = {
  'disease-detection': DiseaseDetection,
  'iot-dashboard': IoTDashboard,
  'equipment-rent': EquipmentRent,
  'news': NewsPage,
  'soil-analysis': SoilAnalysis,
  'irrigation': IrrigationPlanner,
  'ai-assistant': AIAssistant,
  'crop-recommendation': CropRecommendation,
  'loan-application': LoanApplication,
};

const PANCHAYAT_EMBEDDED_VIEWS: Record<string, React.ComponentType<{ onBack: () => void }>> = {
  'cultivation-workflow': CultivationWorkflow,
  'ai-assistant': AIAssistant,
  'crop-recommendation': CropRecommendation,
  'news': NewsPage,
  'iot-dashboard': IoTDashboard,
  'soil-analysis': SoilAnalysis,
  'irrigation': IrrigationPlanner,
  'disease-detection': DiseaseDetection,
  'equipment-rent': EquipmentRent,
  'loan-review': LoanReview,
};

// Feature buttons for FarmPanel overview (no AgriBot, no News — News is Panchayat only)
const farmFeatureButtons = [
  { key: 'disease-detection', label: 'Disease Scan', icon: Bug, color: 'text-destructive' },
  { key: 'iot-dashboard', label: 'IoT Sensors', icon: Cpu, color: 'text-blue-400' },
  { key: 'soil-analysis', label: 'Soil Analysis', icon: Activity, color: 'text-amber-400' },
  { key: 'irrigation', label: 'Irrigation', icon: Droplets, color: 'text-cyan-400' },
  { key: 'crop-recommendation', label: 'Crop AI', icon: Sprout, color: 'text-secondary' },
  { key: 'loan-application', label: 'Loan Apply', icon: Landmark, color: 'text-emerald-400' },
];

// Feature buttons for Panchayat (includes News & Market, no AgriBot)
const panchayatFeatureButtons = [
  { key: 'cultivation-workflow', label: 'Workflow', icon: Leaf, color: 'text-green-400' },
  { key: 'crop-recommendation', label: 'Crop AI', icon: Sprout, color: 'text-secondary' },
  { key: 'loan-review', label: 'Loan Review', icon: FileCheck, color: 'text-emerald-400' },
  { key: 'iot-dashboard', label: 'IoT Sensors', icon: Cpu, color: 'text-blue-400' },
  { key: 'soil-analysis', label: 'Soil Data', icon: Activity, color: 'text-amber-400' },
  { key: 'irrigation', label: 'Irrigation Hub', icon: Droplets, color: 'text-cyan-400' },
  { key: 'disease-detection', label: 'Disease Scan', icon: Bug, color: 'text-destructive' },
  { key: 'news', label: 'News & Market', icon: Newspaper, color: 'text-indigo-400' },
  { key: 'equipment-rent', label: 'Equipment', icon: Tractor, color: 'text-orange-400' },
];


// ============================================================
//  FARM PANEL ANIMATION HELPERS
// ============================================================

function animatePanelIn(el: HTMLElement, contentEl: HTMLElement | null) {
  gsap.fromTo(el,
    { x: 400, opacity: 0, clipPath: 'inset(0 0 0 100%)' },
    { x: 0, opacity: 1, clipPath: 'inset(0 0 0 0%)', duration: 0.8, ease: 'power4.out' }
  );
  if (contentEl) {
    gsap.fromTo(contentEl.children,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, delay: 0.3, ease: 'power2.out' }
    );
  }
}

function animatePanelOut(el: HTMLElement, onComplete: () => void) {
  gsap.to(el, {
    x: 400,
    opacity: 0,
    clipPath: 'inset(0 0 0 100%)',
    duration: 0.6,
    ease: 'power4.in',
    onComplete
  });
}

function animateTabContent(el: HTMLElement) {
  gsap.fromTo(el,
    { y: 15, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' }
  );
}

function animatePanchayatPanelIn(el: HTMLElement) {
  gsap.fromTo(el,
    { scale: 0.9, opacity: 0, y: 50, filter: 'blur(10px)' },
    { scale: 1, opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' }
  );
}

function animatePanchayatPanelOut(el: HTMLElement, onComplete: () => void) {
  gsap.to(el, {
    scale: 0.9,
    opacity: 0,
    y: 50,
    filter: 'blur(10px)',
    duration: 0.5,
    ease: 'power4.in',
    onComplete
  });
}

// ============================================================
//  FARM PANEL — Rich tabbed panel when a house is clicked
// ============================================================

export function SchoolPanel() {
  const showSchool = useVillageStore((s) => s.showSchool);
  const setShowSchool = useVillageStore((s) => s.setShowSchool);
  const villageName = "Agrilogy Village";

  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSchool && panelRef.current) {
      animatePanelIn(panelRef.current, contentRef.current);
    }
  }, [showSchool]);

  if (!showSchool) return null;

  const handleClose = () => {
    if (panelRef.current) {
      animatePanelOut(panelRef.current, () => setShowSchool(false));
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed right-6 top-24 w-[90vw] sm:w-[420px] max-h-[calc(100vh-140px)] rounded-3xl overflow-hidden glass z-50 flex flex-col pointer-events-auto border border-white/20 shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-emerald-600/40 to-teal-600/40 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
            <GraduationCap className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Village School</h2>
            <p className="text-xs text-white/50 font-medium uppercase tracking-wider">{villageName} Academy</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-xl hover:bg-white/10 transition-all duration-300 group"
        >
          <X className="w-5 h-5 text-white/60 group-hover:text-white group-hover:rotate-90 transition-transform" />
        </button>
      </div>

      <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Stats Card */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400">
              <Users2 className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Students</span>
            </div>
            <p className="text-2xl font-bold text-white">42 <span className="text-sm font-medium text-emerald-400/70 ml-1">Daily</span></p>
          </div>
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <Award className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Level</span>
            </div>
            <p className="text-2xl font-bold text-white">Primary <span className="text-sm font-medium text-indigo-400/70 ml-1">K-5</span></p>
          </div>
        </div>

        {/* Community Learning Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              Learning Tracks
            </h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">Active</span>
          </div>
          
          <div className="space-y-3">
            {[
              { title: "Modern Organic Farming", level: "Beginner", icon: Sprout, time: "2:00 PM Today" },
              { title: "Soil Health Basics", level: "Intermediate", icon: Activity, time: "4:00 PM Tomorrow" },
              { title: "Smart Irrigation Tech", level: "Advanced", icon: Droplets, time: "Friday, 10:00 AM" }
            ].map((track, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                    <track.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{track.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-white/40">{track.level}</span>
                      <span className="text-[10px] text-emerald-400/60 font-medium flex items-center gap-1">
                        <Wind className="w-3 h-3" />
                         {track.time}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Information Board */}
        <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-3 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
            <Telescope className="w-24 h-24 text-white" />
          </div>
          <div className="flex items-center gap-2 text-indigo-400">
             <Brain className="w-4 h-4 animate-pulse" />
             <span className="text-[11px] font-bold uppercase tracking-wider">AI Insight Board</span>
          </div>
          <p className="text-sm text-white/80 leading-relaxed relative z-10">
            Current curriculum focuses on <span className="text-indigo-400 font-bold">Climate Resilience</span>. Students are learning 
            to use Agrilogy sensors to predict moisture loss during peak summer heat.
          </p>
          <button className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            View Research Papers <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-white/5 border-t border-white/10 flex items-center justify-between">
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-[#090b0a] flex items-center justify-center text-[10px] text-white font-bold backdrop-blur-sm">
                S{i}
            </div>
          ))}
          <div className="w-8 h-8 rounded-full bg-white/10 border-2 border-[#090b0a] flex items-center justify-center text-[10px] text-white/60 font-bold backdrop-blur-sm">
            +38
          </div>
        </div>
        <button className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
          Enroll Student
        </button>
      </div>
    </div>
  );
}

export function FarmPanel() {
  const selectedId = useVillageStore((s) => s.selectedFarmerId);
  const farmers = useVillageStore((s) => s.farmers);
  const irrigate = useVillageStore((s) => s.irrigateCrop);
  const close = useVillageStore((s) => s.setSelectedFarmer);
  const activeEmbeddedView = useVillageStore((s) => s.activeEmbeddedView);
  const setEmbeddedView = useVillageStore((s) => s.setEmbeddedView);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const prevId = useRef<string | null>(null);
  const prevTab = useRef<TabName>('Overview');
  const [tab, setTab] = useState<TabName>('Overview');
  const [isClosing, setIsClosing] = useState(false);

  const farmer = selectedId ? farmers[selectedId] : null;

  useEffect(() => {
    if (farmer && panelRef.current && farmer.id !== prevId.current) {
      prevId.current = farmer.id;
      setTab('Overview');
      setEmbeddedView(null);
      setIsClosing(false);
      animatePanelIn(panelRef.current, contentRef.current);
    }
  }, [farmer, setEmbeddedView]);

  useEffect(() => {
    if (tab !== prevTab.current && contentRef.current && tabContentRef.current) {
      prevTab.current = tab;
      animateTabContent(tabContentRef.current);
    }
  }, [tab]);

  const handleClose = () => {
    if (!panelRef.current) {
      close(null);
      setEmbeddedView(null);
      return;
    }
    if (isClosing) return;
    setIsClosing(true);
    animatePanelOut(panelRef.current, () => {
      close(null);
      setEmbeddedView(null);
      setIsClosing(false);
    });
  };

  if (!farmer) return null;

  const EmbeddedComponent = activeEmbeddedView ? FARM_EMBEDDED_VIEWS[activeEmbeddedView] : null;

  return (
    <div ref={panelRef} className="fixed right-6 top-1/2 -translate-y-1/2 w-[42vw] max-w-[720px] min-w-[400px] max-h-[90vh] glass-panel z-50 flex flex-col shadow-2xl overflow-hidden border-white/10" style={{ borderRadius: '24px' }}>
      {EmbeddedComponent ? (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <EmbeddedComponent onBack={() => {
            setEmbeddedView(null);
          }} />
        </div>
      ) : (
        <>
          {/* Hero Header */}
          <div className="relative p-8 border-b border-white/5 bg-gradient-to-r from-primary/10 to-transparent overflow-hidden">
            <div className="relative z-10">
              <span className="text-xs font-black tracking-[0.3em] uppercase opacity-50 mb-1 block">Producer Profile</span>
              <h2 className="title-text text-white text-4xl font-black mb-2 tracking-tight drop-shadow-2xl">
                {farmer.name.split(' ')[0]} <span className="text-primary">{farmer.name.split(' ').slice(1).join(' ')}</span>
              </h2>
              <div className="flex items-center gap-4 text-sm font-medium opacity-80">
                <span className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> {farmer.region.replace('_', ' ')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                <span className="flex items-center gap-1.5 text-primary"><Leaf size={14} /> {farmer.currentCrop.name} Specialist</span>
              </div>
            </div>
            
            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all hover:rotate-90 text-white/50 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-black/40 backdrop-blur-2xl px-2">
            {TAB_LABELS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-4 text-[11px] font-black tracking-[0.2em] uppercase transition-all relative
                  ${tab === t ? 'text-primary' : 'text-white/40 hover:text-white/70'}`}
              >
                {t}
                {tab === t && <div className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-full shadow-[0_-5px_15px_rgba(234,179,8,0.5)]" />}
              </button>
            ))}
          </div>

          {/* Dynamic Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-black/10">
            <div ref={tabContentRef}>
              {tab === 'Overview' && <OverviewTab farmer={farmer} onIrrigate={() => irrigate(farmer.id)} onOpenFeature={setEmbeddedView} />}
              {tab === 'AI Advisor' && <AIAdvisorTab farmer={farmer} />}
              {tab === 'Simulation' && <SimulationTab farmer={farmer} />}
              {tab === 'Market' && <MarketTab farmer={farmer} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
//  PANCHAYAT PANEL — Full Village Admin
// ============================================================

type PanchayatTab = 'Dashboard' | 'Farmers' | 'Admin';

export function PanchayatPanel() {
  const show = useVillageStore((s) => s.showPanchayat);
  const close = useVillageStore((s) => s.setShowPanchayat);
  const farmers = useVillageStore((s) => s.farmers);
  const activeEmbeddedView = useVillageStore((s) => s.activeEmbeddedView);
  const setEmbeddedView = useVillageStore((s) => s.setEmbeddedView);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<PanchayatTab>('Dashboard');
  const [isClosing, setIsClosing] = useState(false);
  const prevTab = useRef<PanchayatTab>('Dashboard');

  useEffect(() => {
    if (show && panelRef.current && !isClosing) {
      setEmbeddedView(null);
      setTab('Dashboard');
      animatePanchayatPanelIn(panelRef.current);
    }
  }, [show, setEmbeddedView, isClosing]);

  useEffect(() => {
    if (show && contentRef.current && tabContentRef.current && tab !== prevTab.current) {
      prevTab.current = tab;
      animateTabContent(tabContentRef.current);
    }
  }, [tab, show]);

  const handleClose = () => {
    if (!panelRef.current) {
      close(false);
      setEmbeddedView(null);
      return;
    }
    if (isClosing) return;
    setIsClosing(true);
    animatePanchayatPanelOut(panelRef.current, () => {
      close(false);
      setEmbeddedView(null);
      setIsClosing(false);
    });
  };

  if (!show) return null;

  const farmerList = Object.values(farmers);
  const EmbeddedComponent = activeEmbeddedView ? PANCHAYAT_EMBEDDED_VIEWS[activeEmbeddedView] : null;

  return (
    <div ref={panelRef} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[44vw] max-w-[760px] min-w-[440px] max-h-[85vh] glass-panel z-50 flex flex-col shadow-2xl overflow-hidden border-white/10" style={{ borderRadius: '28px' }}>
      {EmbeddedComponent ? (
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          <EmbeddedComponent onBack={() => {
            setEmbeddedView(null);
          }} />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/5 backdrop-blur-3xl">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
                <Landmark size={28} className="text-primary" />
              </div>
              <div>
                <h2 className="title-text text-white text-3xl font-black tracking-tight drop-shadow-lg">Gram <span className="text-primary">Panchayat</span></h2>
                <p className="text-[10px] text-primary/60 tracking-[0.4em] uppercase font-bold mt-1">Village Administration Hub</p>
              </div>
            </div>
            <button 
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all hover:rotate-90 text-white/50 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex px-4 bg-black/40 backdrop-blur-md">
            {(['Dashboard', 'Farmers', 'Admin'] as PanchayatTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-4 text-[11px] font-black tracking-[0.2em] uppercase transition-all relative
                  ${tab === t ? 'text-primary' : 'text-white/40 hover:text-white/70'}`}
              >
                {t}
                {tab === t && <div className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-full shadow-[0_-5px_15px_rgba(234,179,8,0.5)]" />}
              </button>
            ))}
          </div>

          {/* Dynamic Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-black/10">
            <div ref={tabContentRef}>
              {tab === 'Dashboard' && <PanchayatDashboard farmers={farmerList} onOpenFeature={setEmbeddedView} />}
              {tab === 'Farmers' && <PanchayatFarmers farmers={farmerList} />}
              {tab === 'Admin' && <PanchayatAdmin farmers={farmerList} />}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// --- Simulation Tab (DOMINATION FEATURE) ---
function SimulationTab({ farmer }: { farmer: VillageFarmer }) {
  const [waterLevel, setWaterLevel] = useState(50);
  const [fertilizer, setFertilizer] = useState(50);

  // Simple mock simulation logic
  const healthBoost = (waterLevel > 40 && waterLevel < 80) ? 10 : (waterLevel > 80 ? -20 : -30);
  const fertBoost = (fertilizer > 30 && fertilizer < 70) ? 15 : (fertilizer > 70 ? -10 : -5);
  const totalYield = Math.max(10, 60 + healthBoost + fertBoost);
  const riskLevel = totalYield < 40 ? 'High' : totalYield < 70 ? 'Moderate' : 'Low';
  const riskColor = riskLevel === 'High' ? 'text-destructive' : riskLevel === 'Low' ? 'text-green-500' : 'text-yellow-500';
  const estProfit = Math.floor(farmer.income * (totalYield / 100));

  return (
    <>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical size={14} className="text-secondary" />
          <h4 className="text-xs font-semibold">Simulation Engine</h4>
        </div>
        <p className="text-[10px] text-muted-foreground mb-3">Adjust parameters to predict the season outcome.</p>

        <div className="space-y-4 bg-muted/20 rounded-lg p-3 border border-border/20">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span>Irrigation Level</span>
              <span className="font-bold">{waterLevel}%</span>
            </div>
            <input type="range" min="0" max="100" value={waterLevel} onChange={(e) => setWaterLevel(Number(e.target.value))} className="w-full accent-village-water" />
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span>Fertilizer Index (NPK)</span>
              <span className="font-bold">{fertilizer}%</span>
            </div>
            <input type="range" min="0" max="100" value={fertilizer} onChange={(e) => setFertilizer(Number(e.target.value))} className="w-full accent-secondary" />
          </div>
        </div>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
        <h4 className="text-[10px] font-bold text-primary mb-2 uppercase tracking-wider">Prediction Outcome</h4>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="bg-background/40 rounded p-2">
            <span className="text-muted-foreground text-[8px] block">Expected Yield</span>
            <span className="font-bold text-sm block">{totalYield}%</span>
          </div>
          <div className="bg-background/40 rounded p-2">
            <span className="text-muted-foreground text-[8px] block">Profit Impact</span>
            <span className="font-bold text-sm block">₹{estProfit.toLocaleString()}</span>
          </div>
          <div className="col-span-2 bg-background/40 rounded p-2 flex justify-between items-center">
            <span className="text-muted-foreground text-[8px] block">Crop Failure Risk</span>
            <span className={`font-bold ${riskColor}`}>{riskLevel} Risk</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          useVillageStore.getState().setWaterLevel(farmer.id, waterLevel);
          useVillageStore.getState().setHealth(farmer.id, Math.max(30, totalYield));
        }}
        className="w-full bg-primary/20 hover:bg-primary/30 text-foreground border border-primary/30 rounded-lg py-2 text-xs transition-all flex items-center justify-center gap-1.5 font-bold">
        <Sparkles size={12} /> Apply Optimal Settings
      </button>
    </>
  );
}

// --- Overview Tab ---
function OverviewTab({ farmer, onIrrigate, onOpenFeature }: { farmer: VillageFarmer; onIrrigate: () => void; onOpenFeature: (view: string) => void }) {
  return (
    <>
      {farmer.tasks.filter(a => !a.completed).length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">
          {farmer.tasks.filter(t => !t.completed).slice(0, 2).map((t) => (
            <p key={t.id} className="text-xs text-destructive flex items-center gap-1.5">
              <AlertTriangle size={11} /> {t.text}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <MiniStat label="Income" value={`₹${farmer.income.toLocaleString()}`} icon={<TrendingUp size={12} />} />
        <MiniStat label="Soil Water" value={`${Math.floor(farmer.waterLevel ?? 0)}%`} icon={<Droplets size={12} />} />
        <MiniStat label="Crop Health" value={`${Math.floor(farmer.health ?? 0)}%`} icon={<CheckCircle size={12} />} />
      </div>

      {/* Current Crop */}
      <div className="bg-muted/30 rounded-lg p-3 border border-border/30">
        <div className="flex items-center gap-2 mb-2">
          <Sprout size={14} className="text-primary" />
          <span className="text-xs font-semibold">Current Crop: {farmer.currentCrop.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          {[
            ['Planted', farmer.currentCrop.plantingDate],
            ['Stage', farmer.currentCrop.growthStage],
            ['Harvest', farmer.currentCrop.expectedHarvest],
            ['Health', farmer.currentCrop.health],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between">
              <span className="text-muted-foreground text-xs">{l}:</span>
              <span className="font-medium text-xs">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plots List */}
      <div>
        <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Farm Plots</h4>
        <div className="space-y-1.5">
          {Object.entries(farmer.plots).map(([key, plot]) => (
            <div key={key} className="flex items-center justify-between bg-muted/20 rounded-lg p-2 border border-border/20">
              <div>
                <p className="text-sm font-semibold">{plot.name}</p>
                <p className="text-xs text-muted-foreground">{plot.details.stage}</p>
              </div>
              <div className="text-right text-xs">
                {plot.details.metrics.map((m, i) => (
                  <p key={i} className={m.valueColor || ''}>{m.label}: <span className="font-bold">{m.value}</span></p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Predictive Engine Warnings */}
      <div className={`${(farmer.waterLevel ?? 80) < 40 ? 'bg-destructive/10 border-destructive/30' : 'bg-green-500/10 border-green-500/30'} border rounded-lg p-2.5`}>
        <div className="flex justify-between items-center mb-1">
          <span className={`text-[10px] font-bold uppercase flex items-center gap-1 ${(farmer.waterLevel ?? 80) < 40 ? 'text-destructive' : 'text-green-500'}`}>
            <AlertTriangle size={10} /> Predictive Risk Engine
          </span>
        </div>
        {(farmer.waterLevel ?? 80) < 40 ? (
          <>
            <p className="text-sm text-foreground mb-0.5">Critical Soil Moisture Drop</p>
            <p className="text-xs text-destructive font-medium">Yield risk: High probability of stunting. Irrigate Now!</p>
          </>
        ) : (
          <>
            <p className="text-sm text-foreground mb-0.5">Stable Environment</p>
            <p className="text-xs text-green-500 font-medium">Yield trajectory: Optimal growth speed.</p>
          </>
        )}
      </div>

      {/* Weather */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-2.5 border border-border/20">
        <Cloud size={14} />
        <span>Sensor: {farmer.soilSensor.temperature} · {farmer.soilSensor.humidity} humid</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onIrrigate}
          className="flex-1 bg-village-water/20 hover:bg-village-water/30 text-foreground border border-village-water/30 rounded-lg py-2 px-3 text-xs transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
        >
          <Droplets size={12} /> Irrigate
        </button>
        <button className="flex-1 bg-primary/20 hover:bg-primary/30 text-foreground border border-primary/30 rounded-lg py-2 px-3 text-xs transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5">
          <Brain size={12} /> AI Tips
        </button>
      </div>

      {/* === EMBEDDED FEATURE BUTTONS === */}
      <div>
        <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <ExternalLink size={10} /> AgriTech Modules
        </h4>
        <div className="grid grid-cols-4 gap-1.5">
          {farmFeatureButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => onOpenFeature(btn.key)}
              className="flex flex-col items-center gap-1 p-2 bg-muted/20 hover:bg-muted/40 border border-border/20 hover:border-primary/30 rounded-lg transition-all hover:scale-[1.03] active:scale-95"
            >
              <btn.icon size={16} className={btn.color} />
              <span className="text-[10px] font-semibold text-center leading-tight">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-muted/30 rounded-lg p-2 border border-border/20 text-center">
      <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-sm font-bold text-foreground">{value}</p>
    </div>
  );
}

// --- AI Advisor Tab ---
function AIAdvisorTab({ farmer }: { farmer: VillageFarmer }) {
  return (
    <>
      {/* Crop Suggestions */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb size={14} className="text-primary" />
          <h4 className="text-xs font-semibold">Next Crop Suggestions</h4>
        </div>
        <div className="space-y-2">
          {farmer.cropSuggestions.map((s) => (
            <div key={s.name} className="bg-muted/30 rounded-lg p-3 border border-border/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold">{s.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 bg-secondary/20 text-secondary rounded-full font-semibold">{s.profit}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">{s.reason}</p>
              <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-border/20 pt-2">
                <span><TrendingUp size={10} className="inline mr-1 text-secondary" />{s.revenue}</span>
                <span><Sprout size={10} className="inline mr-1 text-primary" />{s.growthTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pest Threats */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Bug size={14} className="text-destructive" />
          <h4 className="text-xs font-semibold">Pest Threats for {farmer.irrigationSchedule.pestThreats.crop}</h4>
        </div>
        <div className="flex flex-wrap gap-1">
          {farmer.irrigationSchedule.pestThreats.threats.map((t) => (
            <span key={t} className="text-[9px] px-2 py-1 bg-destructive/10 text-destructive rounded-full border border-destructive/20">{t}</span>
          ))}
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-primary">{farmer.irrigationSchedule.insight}</p>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Soil & Irrigation Tab ---
function SoilTab({ farmer }: { farmer: VillageFarmer }) {
  const s = farmer.soilSensor;
  return (
    <>
      {/* Sensor Data */}
      <div>
        <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Live Sensor Data</h4>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: <Droplet size={12} />, label: 'Moisture', val: s.moisture, status: s.moistureStatus },
            { icon: <Thermometer size={12} />, label: 'Temperature', val: s.temperature, status: s.tempStatus },
            { icon: <Wind size={12} />, label: 'Humidity', val: s.humidity, status: s.humidityStatus },
            { icon: <FlaskConical size={12} />, label: 'pH', val: s.ph, status: s.phStatus },
          ].map(({ icon, label, val, status }) => (
            <div key={label} className="bg-muted/30 rounded-lg p-2.5 border border-border/20">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-1">{icon}<span className="text-[9px]">{label}</span></div>
              <p className="text-lg font-bold">{val}</p>
              <p className="text-[9px]">{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Irrigation Schedule */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Droplets size={14} className="text-village-water" />
          <h4 className="text-xs font-semibold">Irrigation Schedule</h4>
        </div>
        <div className="space-y-1">
          {farmer.irrigationSchedule.schedule.map((item, i) => (
            <div key={i} className="flex items-center justify-between bg-muted/20 rounded-lg p-2 border border-border/20 text-[10px]">
              <span className="font-semibold w-16">{item.day}</span>
              <span className="text-muted-foreground">{item.time}</span>
              <span>{item.amount}</span>
              <span className={`font-bold ${item.status === 'Urgent' ? 'text-destructive' : item.status === 'Completed' ? 'text-secondary' : 'text-primary'}`}>{item.status}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 bg-primary/10 border border-primary/20 rounded-lg p-2.5">
          <p className="text-[10px] text-primary font-medium">
            <Lightbulb size={10} className="inline mr-1" />{farmer.irrigationSchedule.insight}
          </p>
        </div>
      </div>
    </>
  );
}

// --- Market Tab ---
function MarketTab({ farmer }: { farmer: VillageFarmer }) {
  const region = mandiData[farmer.region];
  if (!region) return <p className="text-xs text-muted-foreground">No market data for this region.</p>;

  return (
    <>
      <div>
        <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Nearby Mandi Prices (₹/quintal)</h4>
        {region.mandis.map((m) => (
          <div key={m.name} className="mb-3">
            <p className="text-[10px] font-semibold text-primary mb-1">{m.name}</p>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(m.prices).map(([crop, price]) => (
                <div key={crop} className="flex justify-between bg-muted/20 rounded px-2 py-1 border border-border/20 text-[10px]">
                  <span>{crop}</span>
                  <span className="font-bold">₹{price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Price Forecast */}
      <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={14} className="text-secondary" />
          <h4 className="text-xs font-semibold">Price Forecast: {region.forecastCrop}</h4>
        </div>
        <div className="flex items-end gap-1 h-12 mb-2">
          {region.forecastData.map((v, i) => {
            const max = Math.max(...region.forecastData);
            const min = Math.min(...region.forecastData);
            const h = ((v - min) / (max - min || 1)) * 100;
            return <div key={i} className="flex-1 bg-secondary/40 rounded-t" style={{ height: `${20 + h * 0.8}%` }} />;
          })}
        </div>
        <p className="text-[10px] text-muted-foreground">
          <Sparkles size={10} className="inline mr-1 text-secondary" />{region.forecastInsight}
        </p>
      </div>
    </>
  );
}

// ============================================================
//  PANCHAYAT PANEL — Full Village Admin
// ============================================================

// --- Panchayat Dashboard ---
function PanchayatDashboard({ farmers, onOpenFeature }: { farmers: VillageFarmer[]; onOpenFeature: (view: string) => void }) {
  const totalAlerts = farmers.reduce((s, f) => s + f.tasks.filter(t => !t.completed).length, 0);
  const criticalFarms = farmers.filter(f => (f.health ?? 100) < 40).length;
  const avgIncome = farmers.length > 0 ? Math.round(farmers.reduce((s, f) => s + f.income, 0) / farmers.length) : 0;
  const totalPlots = farmers.reduce((s, f) => s + Object.keys(f.plots).length, 0);

  // Crop distribution
  const cropCounts: Record<string, number> = {};
  farmers.forEach(f => {
    const crop = f.currentCrop.name.split(' (')[0];
    cropCounts[crop] = (cropCounts[crop] || 0) + 1;
  });

  return (
    <>
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        <MetricCard label="Farmers" value={String(farmers.length)} icon={<Users size={14} />} />
        <MetricCard label="Critical Farms" value={String(criticalFarms)} icon={<AlertTriangle size={14} />} alert={criticalFarms > 0} />
        <MetricCard label="Pending Tasks" value={String(totalAlerts)} icon={<Sparkles size={14} />} alert={false} />
        <MetricCard label="Avg Income" value={`₹${avgIncome.toLocaleString()}`} icon={<TrendingUp size={14} />} />
      </div>

      {/* AgriTech Quick Access */}
      <div>
        <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <ExternalLink size={10} /> AgriTech Modules
        </h4>
        <div className="grid grid-cols-3 gap-1.5">
          {panchayatFeatureButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => onOpenFeature(btn.key)}
              className="flex items-center gap-2 p-2 bg-muted/20 hover:bg-muted/40 border border-border/20 hover:border-primary/30 rounded-lg transition-all hover:scale-[1.02] active:scale-95"
            >
              <btn.icon size={14} className={btn.color} />
              <span className="text-[9px] font-semibold">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Crop Distribution */}
      <div>
        <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Crop Distribution</h4>
        <div className="space-y-1.5">
          {Object.entries(cropCounts).sort((a, b) => b[1] - a[1]).map(([crop, count]) => (
            <div key={crop} className="flex items-center gap-2">
              <span className="text-xs font-medium w-24 truncate">{crop}</span>
              <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden">
                <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${(count / farmers.length) * 100}%` }} />
              </div>
              <span className="text-[10px] font-bold w-6 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Brain size={14} className="text-primary" />
          <h4 className="text-xs font-semibold">AI Village Recommendations</h4>
        </div>
        <div className="space-y-1.5">
          {aiRecommendations.slice(0, 4).map((r, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px] bg-muted/20 rounded-lg p-2 border border-border/20">
              <Sparkles size={10} className="text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="text-muted-foreground">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Water Routing Optimization */}
      <div className="bg-village-water/10 border border-village-water/30 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Droplets size={14} className="text-village-water" />
          <h4 className="text-[10px] font-bold text-village-water uppercase tracking-wider">Smart Irrigation Routing</h4>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2">
          The AI has detected dry spots in the Northern Sector. Diverting water from the main river canal.
        </p>
        <div className="h-1.5 w-full bg-village-water/20 rounded-full overflow-hidden">
          <div className="h-full bg-village-water w-[70%]" />
        </div>
        <p className="text-[9px] text-right mt-1 font-mono text-village-water/80">Rerouting: 70% efficiency</p>
      </div>
    </>
  );
}

// --- Panchayat Farmer List ---
function PanchayatFarmers({ farmers }: { farmers: VillageFarmer[] }) {
  const selectFarmer = useVillageStore((s) => s.setSelectedFarmer);
  const closePanchayat = useVillageStore((s) => s.setShowPanchayat);

  const goToFarmer = (id: string) => {
    closePanchayat(false);
    setTimeout(() => selectFarmer(id), 300);
  };

  return (
    <>
      <p className="text-[10px] text-muted-foreground">Click a farmer to fly to their farm.</p>
      <div className="space-y-2">
        {farmers.map((f) => {
          const pendingTasks = f.tasks.filter(t => !t.completed).length;
          return (
            <button
              key={f.id}
              onClick={() => goToFarmer(f.id)}
              className="w-full flex items-center gap-3 bg-muted/20 hover:bg-muted/40 rounded-lg p-3 border border-border/20 transition-all text-left hover:scale-[1.01] active:scale-[0.99]"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Home size={14} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{f.currentCrop.name} · {f.region.replace('_', ' ')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold">₹{f.income.toLocaleString()}</p>
                {pendingTasks > 0 && (
                  <p className="text-[9px] text-destructive font-semibold">{pendingTasks} tasks</p>
                )}
              </div>
              <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </>
  );
}

// --- Panchayat Admin ---
function PanchayatAdmin({ farmers }: { farmers: VillageFarmer[] }) {
  const store = useVillageStore();
  const [newFarmerName, setNewFarmerName] = useState('');
  const [newFarmerCrop, setNewFarmerCrop] = useState('Rice');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCrop, setEditCrop] = useState('');
  const [addPlotFarmer, setAddPlotFarmer] = useState<string | null>(null);
  const [newPlotName, setNewPlotName] = useState('');
  const [newPlotCrop, setNewPlotCrop] = useState('Rice');

  const handleAddFarmer = () => {
    if (!newFarmerName.trim()) return;
    store.addFarmer(newFarmerName.trim(), newFarmerCrop);
    setNewFarmerName('');
    setNewFarmerCrop('Rice');
  };

  const handleRemove = (id: string, name: string) => {
    if (confirm(`Remove ${name}? This will remove their hut, wells, cropland and fencing from the village.`)) {
      store.removeFarmer(id);
    }
  };

  const startEdit = (f: VillageFarmer) => {
    setEditingId(f.id);
    setEditName(f.name);
    setEditCrop(f.currentCrop.name);
  };

  const saveEdit = () => {
    if (!editingId) return;
    if (editName.trim()) store.renameFarmer(editingId, editName.trim());
    if (editCrop.trim()) store.changeCrop(editingId, editCrop.trim());
    setEditingId(null);
  };

  const handleAddPlot = () => {
    if (!addPlotFarmer || !newPlotName.trim()) return;
    store.addPlot(addPlotFarmer, newPlotName.trim(), newPlotCrop);
    setAddPlotFarmer(null);
    setNewPlotName('');
    setNewPlotCrop('Rice');
  };

  return (
    <>
      {/* Add Farmer Section */}
      <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <Plus size={14} className="text-secondary" />
          <h4 className="text-xs font-bold">Add New Farmer</h4>
        </div>
        <p className="text-[9px] text-muted-foreground mb-2">This will create a new hut, well, cropland, and fencing in the village.</p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newFarmerName}
            onChange={(e) => setNewFarmerName(e.target.value)}
            placeholder="Farmer name..."
            className="flex-1 bg-background/50 border border-border/30 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            value={newFarmerCrop}
            onChange={(e) => setNewFarmerCrop(e.target.value)}
            className="bg-background/50 border border-border/30 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {cropOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2 w-full">
          <button
            onClick={handleAddFarmer}
            disabled={!newFarmerName.trim()}
            className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg py-2 text-[10px] font-semibold transition-all disabled:opacity-40 flex items-center justify-center gap-1"
          >
            <Home size={10} /> Std Plot
          </button>

          <button
            title="Draw custom border on map"
            onClick={() => {
              store.setShowPanchayat(false);
              store.setLassoMode(true);
            }}
            className="flex-1 bg-primary hover:bg-primary/80 text-primary-foreground rounded-lg py-2 text-[10px] font-semibold transition-all flex items-center justify-center gap-1"
          >
            <MapPin size={10} /> Custom Draw
          </button>
        </div>
      </div>

      {/* Manage Farmers */}
      <div>
        <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Manage Farms ({farmers.length})</h4>
        <div className="space-y-2">
          {farmers.map((f) => (
            <div key={f.id} className="bg-muted/20 border border-border/20 rounded-lg p-3">
              {editingId === f.id ? (
                // Edit Mode
                <div className="space-y-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-background/50 border border-border/30 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Farmer name"
                  />
                  <div className="flex gap-2">
                    <select
                      value={editCrop}
                      onChange={(e) => setEditCrop(e.target.value)}
                      className="flex-1 bg-background/50 border border-border/30 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {cropOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                      <option value={editCrop}>{editCrop}</option>
                    </select>
                    <button onClick={saveEdit} className="px-3 py-1 bg-primary text-primary-foreground rounded text-xs font-semibold">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-muted rounded text-xs">Cancel</button>
                  </div>

                  {/* Plot Management */}
                  <div className="border-t border-border/20 pt-2 mt-2">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1">Plots</p>
                    {Object.entries(f.plots).map(([pKey, plot]) => (
                      <div key={pKey} className="flex items-center justify-between py-1">
                        <span className="text-[10px]">{plot.name}</span>
                        <button
                          onClick={() => {
                            if (Object.keys(f.plots).length <= 1) { alert('Cannot remove the last plot.'); return; }
                            if (confirm(`Delete ${plot.name}?`)) store.removePlot(f.id, pKey);
                          }}
                          className="text-destructive hover:text-destructive/80 transition-colors"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                    {addPlotFarmer === f.id ? (
                      <div className="flex gap-1 mt-1">
                        <input value={newPlotName} onChange={(e) => setNewPlotName(e.target.value)} className="flex-1 bg-background/50 border border-border/30 rounded px-2 py-1 text-[10px]" placeholder="Plot name" />
                        <select value={newPlotCrop} onChange={(e) => setNewPlotCrop(e.target.value)} className="bg-background/50 border border-border/30 rounded px-1 py-1 text-[10px]">
                          {cropOptions.map(c => <option key={c}>{c}</option>)}
                        </select>
                        <button onClick={handleAddPlot} className="text-[10px] px-2 bg-secondary text-secondary-foreground rounded">Add</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddPlotFarmer(f.id)} className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-1">
                        <Plus size={8} /> Add Plot
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Home size={10} className="text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{f.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{f.currentCrop.name} · {Object.keys(f.plots).length} plots</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEdit(f)} className="p-1.5 hover:bg-muted/50 rounded transition-colors" title="Edit farmer">
                      <Edit3 size={12} className="text-primary" />
                    </button>
                    <button onClick={() => handleRemove(f.id, f.name)} className="p-1.5 hover:bg-destructive/10 rounded transition-colors" title="Remove farmer">
                      <Trash2 size={12} className="text-destructive" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function MetricCard({ label, value, icon, alert }: { label: string; value: string; icon: React.ReactNode; alert?: boolean }) {
  return (
    <div className={`metric-card rounded-lg p-2.5 border transition-all duration-300 hover:scale-105 cursor-default ${alert ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/30 border-border/50'}`}>
      <div className="flex items-center gap-1 text-[9px] text-muted-foreground mb-0.5">{icon} {label}</div>
      <p className={`text-sm font-bold ${alert ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
