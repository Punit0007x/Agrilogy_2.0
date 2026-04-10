import { useState, useEffect } from 'react';
import { useVillageStore } from '@/store/villageStore';
import { Bot, Send, Loader2, X, CloudRain, Sun as SunIcon, CloudSun, Compass } from 'lucide-react';
import gsap from 'gsap';

export function CinematicOverlay() {
  const introComplete = useVillageStore((s) => s.introComplete);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (introComplete) {
      gsap.to('.cinematic-overlay', {
        opacity: 0,
        duration: 1.5,
        ease: 'power2.out',
        onComplete: () => setVisible(false),
      });
    }
  }, [introComplete]);

  if (!visible) return null;

  return (
    <div className="cinematic-overlay fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className="text-center">
        <h1 className="title-text text-4xl md:text-6xl text-primary glow-gold tracking-widest">
          AGRILOGY
        </h1>
        <p className="text-muted-foreground text-sm md:text-base mt-3 tracking-[0.3em] uppercase">
          Smart Village
        </p>
      </div>
    </div>
  );
}

export function HUD() {
  const introComplete = useVillageStore((s) => s.introComplete);
  const timeOfDay = useVillageStore((s) => s.timeOfDay);
  const setTimeOfDay = useVillageStore((s) => s.setTimeOfDay);
  const fogDensity = useVillageStore((s) => s.fogDensity);
  const setFogDensity = useVillageStore((s) => s.setFogDensity);
  const hoveredObject = useVillageStore((s) => s.hoveredObject);
  const farmers = useVillageStore((s) => s.farmers);
  const lassoMode = useVillageStore((s) => s.lassoMode);
  const lassoPoints = useVillageStore((s) => s.lassoPoints);
  const clearLasso = useVillageStore((s) => s.clearLasso);
  const setShowPanchayat = useVillageStore((s) => s.setShowPanchayat);
  
  const [showBuildPopup, setShowBuildPopup] = useState(false);
  const [farmerName, setFarmerName] = useState('');
  const [soilType, setSoilType] = useState('Loamy');
  const [finalNodes, setFinalNodes] = useState<[number, number, number][]>([]);

  const calculateArea = (points: [number, number, number][]) => {
    if (points.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      area += (p1[0] * p2[2]) - (p2[0] * p1[2]);
    }
    return Math.abs(area / 2) * 0.05; // 0.05 scaling factor for realistic acre look
  };

  const getAiPrediction = () => {
    let yieldBonus = Math.floor(Math.random() * 5) + 5;
    const crop = useVillageStore.getState().buildCrop;
    if (crop === 'Rice' && (soilType === 'Clay' || soilType === 'Loamy')) yieldBonus += 12;
    if (crop === 'Wheat' && soilType === 'Loamy') yieldBonus += 10;
    if (crop === 'Cotton' && soilType === 'Black') yieldBonus += 15;
    if (timeOfDay > 0.3 && timeOfDay < 0.7) yieldBonus += 2; // good sunlight
    
    return `AI Insight: ${soilType} soil selected for ${crop}. Analyzed local topography and current conditions. Predicting optimal yield trajectory of +${yieldBonus}% above regional baseline.`;
  };

  const currentArea = calculateArea(lassoPoints.length >= 3 ? lassoPoints : (lassoPoints.length === 2 && useVillageStore.getState().buildShape === 'rectangle' ? [
    lassoPoints[0], [lassoPoints[1][0], 0, lassoPoints[0][2]], lassoPoints[1], [lassoPoints[0][0], 0, lassoPoints[1][2]]
  ] : []));

  if (!introComplete) return null;

  const timeLabel = timeOfDay < 0.25 ? 'Night' : timeOfDay < 0.4 ? 'Dawn' : timeOfDay < 0.6 ? 'Day' : timeOfDay < 0.8 ? 'Dusk' : 'Night';

  // Resolve hover tooltip content
  let tooltipText = '';
  if (hoveredObject) {
    if (hoveredObject.startsWith('house-')) {
      const fid = hoveredObject.replace('house-', '');
      const f = farmers[fid];
      tooltipText = f ? `🏠 ${f.name} — ${f.currentCrop.name}` : '🏠 Click to view farmer';
    } else if (hoveredObject.startsWith('crop-')) {
      const fid = hoveredObject.replace('crop-', '');
      const f = farmers[fid];
      tooltipText = f ? `🌾 ${f.name}'s cropland — ${f.currentCrop.growthStage}` : '🌾 Click to view farm';
    } else if (hoveredObject.startsWith('well-')) {
      tooltipText = '💧 Water well — Click for details';
    } else if (hoveredObject === 'panchayat') {
      tooltipText = '🏛️ Gram Panchayat — Village Command Center';
    } else {
      tooltipText = hoveredObject;
    }
  }

  return (
    <>
      {/* Controls hint */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 glass-panel px-5 py-2.5 text-xs text-muted-foreground flex gap-4 items-center">
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[9px] font-mono">WASD</kbd> Move</span>
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted/50 rounded text-[9px] font-mono">Q/E</kbd> Up/Down</span>
        <span>🖱️ Drag → Pan</span>
        <span>Scroll → Zoom</span>
        <span>Right-click → Rotate</span>
      </div>

      {/* Time control + Weather + Fog */}
      <div className="fixed top-4 right-4 z-30 glass-panel px-4 py-2.5 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{timeLabel}</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
            className="w-24 accent-primary h-1"
          />
          {/* Rain toggle */}
          <button
            onClick={() => useVillageStore.getState().toggleRain()}
            title={useVillageStore.getState().isRaining ? 'Stop Rain' : 'Start Rain'}
            className={`p-1.5 rounded-md transition-all ${
              useVillageStore.getState().isRaining 
                ? 'bg-blue-500/30 text-blue-300 shadow-[0_0_8px_rgba(59,130,246,0.4)]' 
                : 'hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            <CloudRain size={14} />
          </button>
          {/* Weather indicator */}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {useVillageStore.getState().isRaining ? (
              <><CloudRain size={10} className="text-blue-400" /> Rainy</>
            ) : timeOfDay > 0.28 && timeOfDay < 0.72 ? (
              <><SunIcon size={10} className="text-yellow-400" /> Sunny</>
            ) : (
              <><CloudSun size={10} className="text-gray-400" /> Clear</>
            )}
          </div>
        </div>
        
        {/* Automated Fog - Removed slider as per user request */}
      </div>

      {/* Hover tooltip */}
      {tooltipText && (
        <div className="fixed top-1/2 left-1/2 translate-x-4 -translate-y-8 z-30 floating-label text-foreground max-w-xs">
          {tooltipText}
        </div>
      )}

      {/* Title */}
      <div className="fixed top-4 left-4 z-30">
        <h1 className="title-text text-primary text-sm tracking-[0.2em]">AGRILOGY</h1>
        <p className="text-[10px] text-muted-foreground tracking-widest">SMART VILLAGE · DIGITAL TWIN</p>
      </div>

      {/* Compass */}
      <div className="fixed bottom-20 right-6 z-30 glass-panel w-12 h-12 flex items-center justify-center" title="North">
        <Compass size={20} className="text-primary animate-pulse-glow" />
      </div>

      {/* Custom Builder Toolbox UI Overlay */}
      {lassoMode && (
        <div className="fixed top-20 left-4 z-50 glass-panel px-6 py-4 flex flex-col gap-4 w-72 pointer-events-auto">
          <div className="flex justify-between items-center">
            <h2 className="text-secondary font-bold text-sm tracking-widest uppercase">Custom Builder</h2>
            <button onClick={clearLasso} className="text-muted-foreground hover:text-destructive">✕</button>
          </div>
          
          {/* Tool Selection */}
          <div className="flex gap-2">
            {[
              { id: 'select', icon: '👆', label: 'Select' },
              { id: 'polygon', icon: '✏️', label: 'Draw' },
              { id: 'rectangle', icon: '⬛', label: 'Box' },
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => useVillageStore.getState().setBuildShape(tool.id as 'select' | 'polygon' | 'rectangle')}
                title={tool.label}
                className={`flex-1 p-2 rounded flex justify-center items-center ${useVillageStore.getState().buildShape === tool.id ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-secondary/20'}`}
              >
                {tool.icon}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground uppercase">Target Crop</label>
            <select 
              value={useVillageStore.getState().buildCrop}
              onChange={(e) => useVillageStore.getState().setBuildCrop(e.target.value)}
              className="bg-background border border-border rounded px-2 py-1.5 text-sm w-full"
            >
              <option value="Rice">Rice</option>
              <option value="Wheat">Wheat</option>
              <option value="Sugarcane">Sugarcane</option>
              <option value="Cotton">Cotton</option>
              <option value="Vegetables">Vegetables</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground uppercase">Soil Type</label>
            <select 
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="bg-background border border-border rounded px-2 py-1.5 text-sm w-full"
            >
              <option value="Alluvial">Alluvial</option>
              <option value="Black">Black</option>
              <option value="Red">Red</option>
              <option value="Laterite">Laterite</option>
              <option value="Loamy">Loamy</option>
              <option value="Sandy">Sandy</option>
              <option value="Clay">Clay</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs text-muted-foreground uppercase">Fencing</label>
            <select 
              value={useVillageStore.getState().buildFence}
              onChange={(e) => useVillageStore.getState().setBuildFence(e.target.value)}
              className="bg-background border border-border rounded px-2 py-1.5 text-sm w-full"
            >
              <option value="none">None</option>
              <option value="wood">Wooden Fence</option>
              <option value="stone">Stone Wall</option>
              <option value="wire">Barbed Wire</option>
            </select>
          </div>

          {useVillageStore.getState().buildShape !== 'select' && (
            <div className="mt-2 pt-3 border-t border-border">
               <div className="flex justify-between text-xs text-muted-foreground mb-2">
                 <span>Points: <span className="font-bold text-foreground">{lassoPoints.length}</span></span>
                 {currentArea > 0 && <span className="text-emerald-500 font-bold">{currentArea.toFixed(1)} Acres</span>}
               </div>
               <button 
                onClick={() => {
                  if (useVillageStore.getState().buildShape === 'polygon' && lassoPoints.length < 3) { alert("Draw at least 3 points for a custom polygon"); return; }
                  if (useVillageStore.getState().buildShape === 'rectangle' && lassoPoints.length < 2) { alert("Draw 2 points for a rectangle (corner to corner)"); return; }
                  
                  let finalPoints = lassoPoints;
                  if (useVillageStore.getState().buildShape === 'rectangle' && lassoPoints.length >= 2) {
                     const p1 = lassoPoints[0];
                     const p2 = lassoPoints[1];
                     finalPoints = [
                       p1,
                       [p2[0], 0, p1[2]],
                       p2,
                       [p1[0], 0, p2[2]]
                     ];
                  }
                  
                  setFinalNodes(finalPoints);
                  setFarmerName("");
                  setShowBuildPopup(true);
                }}
                disabled={lassoPoints.length < (useVillageStore.getState().buildShape === 'rectangle' ? 2 : 3)}
                className={`w-full ${lassoPoints.length >= (useVillageStore.getState().buildShape === 'rectangle' ? 2 : 3) ? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground' : 'bg-muted text-muted-foreground'} rounded px-3 py-2 text-sm font-bold transition-all`}
              >
                Continue Setup
              </button>
            </div>
          )}
        </div>
      )}

      {/* Build Farm Registration Popup */}
      {showBuildPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 pointer-events-auto backdrop-blur-sm">
          <div className="glass-panel p-6 w-[450px] max-w-full flex flex-col gap-5 border border-primary/30 shadow-[0_0_40px_rgba(45,140,46,0.15)] animate-in fade-in zoom-in-95 duration-300">
            <div>
              <h2 className="text-xl font-bold text-primary tracking-wide">Register Custom Farm</h2>
              <p className="text-xs text-muted-foreground">Assign ownership and details to your new land parcel.</p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Farmer / Owner Name</label>
               <input 
                 type="text" 
                 value={farmerName} 
                 onChange={(e) => setFarmerName(e.target.value)} 
                 placeholder="e.g. Ramesh Kumar"
                 className="bg-background/80 border border-border hover:border-primary/50 focus:border-primary rounded px-3 py-2 text-foreground w-full outline-none transition-colors"
                 autoFocus
               />
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Parcel Details</label>
              <div className="bg-background/40 border border-secondary/20 rounded p-4 text-sm flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-border/50 pb-2">
                  <span className="text-muted-foreground flex items-center gap-2"><span className="text-lg">📏</span> Total Area</span>
                  <span className="font-bold text-emerald-400 text-lg">{calculateArea(finalNodes).toFixed(1)} Acres</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2"><span className="text-lg">🌱</span> Target Crop</span>
                  <span className="font-bold text-secondary text-base">{useVillageStore.getState().buildCrop}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-2"><span className="text-lg">🪨</span> Soil Base</span>
                  <span className="font-bold">{soilType}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-primary/10 border border-primary/20 rounded-md text-xs leading-relaxed text-primary-foreground/90 glow-primary-text">
              <strong>✨ AI Analytics:</strong> {getAiPrediction()}
            </div>

            <div className="flex gap-3 mt-2">
              <button 
                onClick={() => setShowBuildPopup(false)} 
                className="flex-1 py-2.5 rounded border border-border hover:bg-secondary/20 transition-colors text-muted-foreground font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (!farmerName.trim()) return;
                  useVillageStore.getState().addLassoFarmer(farmerName.trim(), finalNodes);
                  setShowBuildPopup(false);
                  setShowPanchayat(true);
                }}
                disabled={!farmerName.trim()}
                className="flex-1 py-2.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(45,140,46,0.5)] transition-all font-bold disabled:opacity-50 disabled:hover:shadow-none"
              >
                Register & Construct
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant FAB and Chat */}
      <AIAssistantChat />
    </>
  );
}

// --- Live OpenAI Assistant Chat ---
function AIAssistantChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hello! I am your AI Agrilogy Planner. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userText }]);
    setIsThinking(true);

    // Analyze store state for high-fidelity responses
    const store = useVillageStore.getState();
    const farmersArray = Object.values(store.farmers);
    const criticalFarms = farmersArray.filter(f => (f.health ?? 100) < 40).length;
    const avgWater = farmersArray.length ? farmersArray.reduce((acc, f) => acc + (f.waterLevel ?? 0), 0) / farmersArray.length : 0;
    
    // Simulate thinking time
    setTimeout(() => {
      let response = "";
      const lowerText = userText.toLowerCase();

      // Context-aware logic
      if (lowerText.includes('irrigate') || lowerText.includes('water')) {
        if (store.isRaining) {
          response = `It is currently raining in the village. 🌧️ Additional irrigation is not recommended. The average water level is now at ${avgWater.toFixed(1)}%.`;
        } else if (avgWater < 50) {
          response = `Current soil moisture levels are low (Avg: ${avgWater.toFixed(1)}%). 💧 I recommend activating the irrigation system for the western sectors immediately.`;
        } else {
          response = "Water levels are stable across most farms. ✅ No urgent irrigation required, but keep an eye on the sensors if the heat increases.";
        }
      } else if (lowerText.includes('help') || lowerText.includes('status')) {
        response = `Village status report: We have ${farmersArray.length} active farms. ${criticalFarms > 0 ? `Alert: ${criticalFarms} farms are in critical health condition.` : "All farms are currently healthy."} Average water hydration is ${avgWater.toFixed(1)}%. How can I assist with specific farm management?`;
      } else if (lowerText.includes('weather')) {
        response = store.isRaining 
          ? "Heavy rain is detected. 🌦️ This is beneficial for the Rice crops but ensure drainage channels are clear to prevent flooding."
          : "The current weather is clear. ☀️ It's a prime time for fertilizer application and general maintenance.";
      } else if (lowerText.includes('crop') || lowerText.includes('yield')) {
        response = `Analyzing yield trajectories... 🌾 Based on current ${store.isRaining ? "rainy" : "sunny"} conditions, we are on track for a +12% yield improvement.`;
      } else if (lowerText.includes('hello') || lowerText.includes('hi')) {
        response = "Hello! I am your Agrilogy AI assistant. 🤖 I have analyzed the latest IoT sensor data from the village. What would you like to know?";
      } else {
        const defaults = [
          "I've analyzed the current IoT telemetry. The village ecosystem is stable, but I recommend checking the sensors in the eastern quadrant.",
          "Based on the latest satellite imagery and ground sensors, the nutrient levels in the soil are optimal for the current growth cycle.",
          `That's an interesting question. From a precision agriculture perspective, I'd suggest focusing on resource optimization for our ${farmersArray.length} active farms.`,
          "I am monitoring the village metrics 24/7. Currently, the hydration and health stats look promising.",
          "Neural network analysis suggests we should prepare for the harvest cycle in approximately 3 weeks for the early-sown patches."
        ];
        response = defaults[Math.floor(Math.random() * defaults.length)];
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setIsThinking(false);
    }, 1200);
  };

  return (
    <>
      <button 
        onClick={() => setOpen(!open)}
        title="Ask AI Advisor"
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#2D8C2E] text-white rounded-full shadow-[0_0_15px_rgba(45,140,46,0.6)] flex items-center justify-center hover:scale-110 transition-transform z-50 group"
      >
        <Bot size={28} className={open ? "" : "animate-pulse"} />
      </button>

      {open && (
        <div className="fixed bottom-24 right-6 w-[340px] h-[480px] glass-panel z-50 flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-[#2D8C2E]/40 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-gradient-to-r from-[#2D8C2E] to-[#1a6faa] p-3.5 flex items-center justify-between shadow-md">
             <div className="flex items-center gap-2">
                <Bot className="text-white" size={18} />
                <h3 className="font-bold text-white text-sm tracking-wide">Agrilogy AI Agent</h3>
             </div>
             <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors"><X size={16} /></button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-background/95">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${m.role === 'user' ? 'bg-[#2D8C2E] text-white rounded-2xl rounded-tr-sm' : 'bg-muted border border-border/50 text-foreground rounded-2xl rounded-tl-sm'}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                 <div className="bg-muted border border-border/50 text-muted-foreground rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-xs flex items-center gap-2">
                   <Loader2 size={12} className="animate-spin" /> Analyzing scenario...
                 </div>
              </div>
            )}
          </div>
          
          <div className="p-3 border-t border-border/40 bg-background flex gap-2 items-center">
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="e.g. 'Should I irrigate today?'"
              className="flex-1 bg-muted/50 border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#2D8C2E]/50 transition-colors"
              autoFocus
            />
            <button 
              onClick={handleSend}
              disabled={isThinking || !input.trim()}
              className="w-9 h-9 bg-[#2D8C2E] text-white rounded-xl flex items-center justify-center hover:bg-[#2D8C2E]/90 disabled:opacity-50 transition-all shadow-sm"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
