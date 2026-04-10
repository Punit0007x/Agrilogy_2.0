import { create } from 'zustand';
import { defaultFarmersData, type RichFarmerData, type PlotData } from '@/data/farmersData';

export interface VillageFarmer extends RichFarmerData {
  position: [number, number, number];
  customPolygon?: [number, number, number][];
  fenceType?: string;
  health: number;
  waterLevel: number;
  soilType: string;
}

interface VillageState {
  // Core data
  farmers: Record<string, VillageFarmer>;
  farmerOrder: string[]; // ordered list of farmer IDs for position calculation

  // Selection
  selectedFarmerId: string | null;
  selectedBuilding: string | null;
  showPanchayat: boolean;
  showSchool: boolean;
  activeEmbeddedView: string | null;

  // Scene
  timeOfDay: number;
  isRaining: boolean;
  fogDensity: number;
  introComplete: boolean;
  hoveredObject: string | null;
  irrigatingFarms: Record<string, number>;
  cropGrowth: Record<string, number>;
  cameraTarget: { position: [number, number, number]; lookAt: [number, number, number] } | null;

  // Lasso & Custom Build feature
  lassoMode: boolean; // if true, the builder toolbox is open
  buildShape: 'select' | 'polygon' | 'rectangle';
  buildCrop: string;
  buildFence: string;
  lassoPoints: [number, number, number][];
  cursorPosition: [number, number, number] | null;
  setLassoMode: (v: boolean) => void;
  setBuildShape: (s: 'select' | 'polygon' | 'rectangle') => void;
  setBuildCrop: (c: string) => void;
  setBuildFence: (f: string) => void;
  setCursorPosition: (p: [number, number, number] | null) => void;
  addLassoPoint: (p: [number, number, number]) => void;
  clearLasso: () => void;
  addLassoFarmer: (name: string, polygon: [number, number, number][], soilType?: string) => void;
  setWaterLevel: (id: string, level: number) => void;
  setHealth: (id: string, level: number) => void;

  // Selection actions
  setSelectedFarmer: (id: string | null) => void;
  setSelectedBuilding: (b: string | null) => void;
  setShowPanchayat: (v: boolean) => void;
  setShowSchool: (v: boolean) => void;
  setEmbeddedView: (view: string | null) => void;

  // Scene actions
  setTimeOfDay: (t: number) => void;
  setIsRaining: (v: boolean) => void;
  setFogDensity: (d: number) => void;
  toggleRain: () => void;
  setIntroComplete: (v: boolean) => void;
  setHoveredObject: (o: string | null) => void;
  irrigateCrop: (id: string) => void;
  stopIrrigating: (id: string) => void;
  updateCropGrowth: (id: string, delta: number) => void;
  setCameraTarget: (t: { position: [number, number, number]; lookAt: [number, number, number] } | null) => void;

  // === PANCHAYAT ADMIN CRUD ===
  addFarmer: (name: string, cropName: string) => void;
  removeFarmer: (id: string) => void;
  renameFarmer: (id: string, name: string) => void;
  changeCrop: (farmerId: string, cropName: string) => void;
  addPlot: (farmerId: string, plotName: string, cropName: string) => void;
  removePlot: (farmerId: string, plotKey: string) => void;
  updateTask: (farmerId: string, taskId: number, completed: boolean) => void;
  addTask: (farmerId: string, text: string) => void;
  removeTask: (farmerId: string, taskId: number) => void;
}

function calcPosition(index: number): [number, number, number] {
  const side = index % 2; // 0 = left row, 1 = right row
  const slot = Math.floor(index / 2); // which slot in that row

  // Introduce organic curve and spacing
  const zBase = 30 + slot * 25; // increased spacing
  const roadCurve = Math.sin(zBase * 0.05) * 12; // more exaggerated curve

  // Make the village wider and staggered
  const xOffset = side === 0 ? -30 : 30; // wider village
  const xRandom = (Math.random() - 0.5) * 6;
  const zRandom = (Math.random() - 0.5) * 6;

  const x = xOffset + roadCurve + xRandom;
  const z = zBase + zRandom;

  return [x, 0, z];
}

function recalcPositions(order: string[], farmers: Record<string, VillageFarmer>) {
  const updated = { ...farmers };
  order.forEach((id, i) => {
    if (updated[id]) {
      updated[id] = { ...updated[id], position: calcPosition(i) };
    }
  });
  return updated;
}

function buildInitialFarmers(): { farmers: Record<string, VillageFarmer>; order: string[] } {
  const order = Object.keys(defaultFarmersData);
  const farmers: Record<string, VillageFarmer> = {};
  const soils = ['Loamy', 'Black', 'Alluvial', 'Red'];
  order.forEach((id, i) => {
    farmers[id] = {
      ...defaultFarmersData[id],
      position: calcPosition(i),
      health: 50 + Math.random() * 50, // 50 to 100
      waterLevel: 20 + Math.random() * 80, // 20 to 100
      soilType: soils[i % soils.length],
    };
  });
  return { farmers, order };
}

const { farmers: initialFarmers, order: initialOrder } = buildInitialFarmers();

const initialGrowth: Record<string, number> = {};
initialOrder.forEach(id => {
  initialGrowth[id] = 0.3 + Math.random() * 0.4;
});

function makeDefaultPlot(cropName: string): PlotData {
  return {
    name: `Plot: ${cropName}`,
    icon: 'Sprout',
    color: 'text-green-600',
    bgColor: '#f0fdf4',
    details: {
      stage: 'Seedling',
      metrics: [
        { label: 'Moisture', value: '50%' },
        { label: 'Health', value: '75%', valueColor: 'text-yellow-500' },
      ],
    },
    moistureHistory: [50, 50, 50, 50, 50, 50, 50],
  };
}

export const useVillageStore = create<VillageState>((set, get) => ({
  farmers: initialFarmers,
  farmerOrder: initialOrder,
  selectedFarmerId: null,
  selectedBuilding: null,
  showPanchayat: false,
  showSchool: false,
  activeEmbeddedView: null,
  timeOfDay: 0.35,
  isRaining: false,
  fogDensity: 0.002,
  introComplete: false,
  hoveredObject: null,
  irrigatingFarms: {},
  cropGrowth: initialGrowth,
  cameraTarget: null,
  lassoMode: false,
  buildShape: 'polygon',
  buildCrop: 'Rice',
  buildFence: 'wood',
  lassoPoints: [],
  cursorPosition: null,

  setSelectedFarmer: (id) => {
    if (id) {
      const f = get().farmers[id];
      if (!f) return;
      const [x, , z] = f.position;
      
      // Determine if house is on left or right of road (approx x=0)
      const isLeft = x < 0;
      
      // Define a "Front-to-Back" view: 
      // Camera is placed closer to the road, looking OUT towards the farm.
      const camX = isLeft ? x + 18 : x - 18;
      const camY = 9; // Slightly higher for better overview
      const camZ = z + 10; // Slightly offset Z for dynamic angle

      // Look at a point between house and farm (deeper in the X direction)
      const lookX = isLeft ? x - 4 : x + 4;
      const lookY = 1.5;
      const lookZ = z;

      set({
        selectedFarmerId: id,
        showPanchayat: false,
        cameraTarget: {
          position: [camX, camY, camZ],
          lookAt: [lookX, lookY, lookZ],
        },
      });
    } else {
      set({ selectedFarmerId: null, cameraTarget: null });
    }
  },

  setSelectedBuilding: (b) => {
    if (b === 'well') set({ selectedBuilding: b });
    else set({ selectedBuilding: b, cameraTarget: null });
  },

  setShowSchool: (v) => {
    if (v) {
      set({
        showSchool: true,
        selectedFarmerId: null,
        cameraTarget: { position: [40, 15, 20], lookAt: [15, 2, 25] },
      });
    } else {
      set({ showSchool: false, cameraTarget: null });
    }
  },

  setShowPanchayat: (v) => {
    if (v) {
      set({
        showPanchayat: true,
        selectedFarmerId: null,
        cameraTarget: { position: [8, 6, 8], lookAt: [0, 1, 0] },
      });
    } else {
      set({ showPanchayat: false, cameraTarget: null });
    }
  },

  setEmbeddedView: (view) => set({ activeEmbeddedView: view }),
  setTimeOfDay: (t) => set({ timeOfDay: t }),
  setIsRaining: (v) => set({ isRaining: v }),
  setFogDensity: (d) => set({ fogDensity: d }),
  toggleRain: () => set((s) => ({ isRaining: !s.isRaining })),
  setIntroComplete: (v) => set({ introComplete: v }),
  setHoveredObject: (o) => set({ hoveredObject: o }),

  irrigateCrop: (id) =>
    set((s) => {
      const farmer = s.farmers[id];
      if (!farmer) return {};
      return {
        irrigatingFarms: { ...s.irrigatingFarms, [id]: Date.now() },
      };
    }),

  stopIrrigating: (id) =>
    set((s) => {
      const n = { ...s.irrigatingFarms };
      delete n[id];
      return { irrigatingFarms: n };
    }),

  updateCropGrowth: (id, delta) =>
    set((s) => {
      const f = s.farmers[id];
      if (!f) return s;

      const isIrrigating = !!s.irrigatingFarms[id];
      const isRaining = s.isRaining;
      const timeOfDay = s.timeOfDay;

      // Calculate water delta
      let waterDelta = 0;
      if (isIrrigating || isRaining) {
        waterDelta = 50 * delta; // Replenish rapidly
      } else {
        const evaporation = (timeOfDay > 0.3 && timeOfDay < 0.7) ? 5 : 1; // Evaporate faster in daylight
        waterDelta = -evaporation * delta;
      }
      const newWater = Math.max(0, Math.min(100, f.waterLevel + waterDelta));

      // Calculate health delta
      let healthDelta = 0;
      if (newWater < 30) {
        healthDelta = -5 * delta; // Heavy degradation
      } else if (newWater > 85 && f.currentCrop.name !== 'Rice') {
        healthDelta = -2 * delta; // Overwatering damage unless Rice
      } else if (newWater > 50) {
        healthDelta = 5 * delta; // Recovery
      }
      const newHealth = Math.max(0, Math.min(100, f.health + healthDelta));

      const newGrowth = Math.min(1, (s.cropGrowth[id] || 0.3) + delta * (newHealth / 100));

      return {
        cropGrowth: { ...s.cropGrowth, [id]: newGrowth },
        farmers: {
          ...s.farmers,
          [id]: { ...f, waterLevel: newWater, health: newHealth }
        }
      };
    }),

  setCameraTarget: (t) => set({ cameraTarget: t }),

  setLassoMode: (v) => set({ lassoMode: v }),
  setBuildShape: (s) => set({ buildShape: s, lassoPoints: [] }),
  setBuildCrop: (c) => set({ buildCrop: c }),
  setBuildFence: (f) => set({ buildFence: f }),
  setCursorPosition: (p) => set({ cursorPosition: p }),
  addLassoPoint: (p) => set((s) => ({ lassoPoints: [...s.lassoPoints, p] })),
  clearLasso: () => set({ lassoMode: false, lassoPoints: [], cursorPosition: null }),

  // ========== PANCHAYAT ADMIN CRUD ==========

  setWaterLevel: (id, level) =>
    set((s) => ({
      farmers: { ...s.farmers, [id]: { ...s.farmers[id], waterLevel: level } }
    })),

  setHealth: (id, level) =>
    set((s) => ({
      farmers: { ...s.farmers, [id]: { ...s.farmers[id], health: level } }
    })),

  addFarmer: (name, cropName) =>
    set((s) => {
      const newId = `farmer_${Date.now()}`;
      const newOrder = [...s.farmerOrder, newId];
      const newFarmer: VillageFarmer = {
        id: newId,
        name,
        region: 'karnataka',
        location: { lat: 15 + Math.random() * 10, lon: 75 + Math.random() * 5 },
        plots: { plotA: makeDefaultPlot(cropName) },
        tasks: [],
        currentCrop: {
          name: cropName,
          plantingDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          growthStage: 'Seedling',
          expectedHarvest: 'TBD',
          health: '75% (New)',
        },
        cropSuggestions: [
          { name: 'Wheat', profit: 'Safe Bet', reason: 'Reliable crop.', revenue: '~₹40,000/acre', growthTime: '120 days' },
        ],
        irrigationSchedule: {
          insight: 'New farm setup. Monitor soil moisture closely.',
          schedule: [{ day: 'Today', time: '6:00 AM', amount: '15 min', status: 'Scheduled' }],
          pestThreats: { crop: cropName, threats: ['Monitor for local pests'] },
        },
        soilSensor: {
          moisture: '50%', temperature: '28°C', humidity: '65%', ph: '6.8',
          moistureStatus: '✅ Normal', tempStatus: '✅ Normal', humidityStatus: '✅ Normal', phStatus: '✅ Normal',
        },
        income: 0,
        position: [0, 0, 0], // will be recalculated
        health: 100,
        waterLevel: 80,
        soilType: 'Loamy',
      };
      const newFarmers = { ...s.farmers, [newId]: newFarmer };
      const positionedFarmers = recalcPositions(newOrder, newFarmers);
      return {
        farmers: positionedFarmers,
        farmerOrder: newOrder,
        cropGrowth: { ...s.cropGrowth, [newId]: 0.1 },
      };
    }),

  addLassoFarmer: (name, polygon, soilType = 'Loamy') =>
    set((s) => {
      const newId = `farmer_${Date.now()}`;
      const newOrder = [...s.farmerOrder, newId]; // Doesn't need recalc since position is overridden
      // Compute simple centroid of polygon to place the house
      let cx = 0, cz = 0;
      polygon.forEach(p => { cx += p[0]; cz += p[2]; });
      cx /= polygon.length;
      cz /= polygon.length;

      const newFarmer: VillageFarmer = {
        id: newId,
        name,
        region: 'karnataka',
        location: { lat: 15 + Math.random() * 10, lon: 75 + Math.random() * 5 },
        plots: { plotA: makeDefaultPlot(s.buildCrop) },
        tasks: [],
        currentCrop: {
          name: s.buildCrop,
          plantingDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          growthStage: 'Seedling',
          expectedHarvest: 'TBD',
          health: '75% (New)',
        },
        cropSuggestions: [
          { name: 'Wheat', profit: 'Safe Bet', reason: 'Reliable crop.', revenue: '~₹40,000/acre', growthTime: '120 days' },
        ],
        irrigationSchedule: {
          insight: 'New custom farm setup. Monitor soil moisture closely.',
          schedule: [{ day: 'Today', time: '6:00 AM', amount: '15 min', status: 'Scheduled' }],
          pestThreats: { crop: s.buildCrop, threats: ['Monitor for local pests'] },
        },
        soilSensor: {
          moisture: '50%', temperature: '28°C', humidity: '65%', ph: '6.8',
          moistureStatus: '✅ Normal', tempStatus: '✅ Normal', humidityStatus: '✅ Normal', phStatus: '✅ Normal',
        },
        income: 0,
        position: [cx, 0, cz], // Centroid position for house
        customPolygon: polygon,
        fenceType: s.buildFence,
        health: 100,
        waterLevel: 80,
        soilType: soilType,
      };
      return {
        farmers: { ...s.farmers, [newId]: newFarmer },
        farmerOrder: newOrder, // Placed at the end but rendering will use customPolygon
        cropGrowth: { ...s.cropGrowth, [newId]: 0.1 },
        lassoMode: false,
        lassoPoints: [],
      };
    }),

  removeFarmer: (id) =>
    set((s) => {
      const newFarmers = { ...s.farmers };
      delete newFarmers[id];
      const newOrder = s.farmerOrder.filter((fid) => fid !== id);
      const positionedFarmers = recalcPositions(newOrder, newFarmers);
      const newGrowth = { ...s.cropGrowth };
      delete newGrowth[id];
      return {
        farmers: positionedFarmers,
        farmerOrder: newOrder,
        cropGrowth: newGrowth,
        selectedFarmerId: s.selectedFarmerId === id ? null : s.selectedFarmerId,
      };
    }),

  renameFarmer: (id, name) =>
    set((s) => {
      const f = s.farmers[id];
      if (!f) return {};
      return { farmers: { ...s.farmers, [id]: { ...f, name } } };
    }),

  changeCrop: (farmerId, cropName) =>
    set((s) => {
      const f = s.farmers[farmerId];
      if (!f) return {};
      return {
        farmers: {
          ...s.farmers,
          [farmerId]: {
            ...f,
            currentCrop: { ...f.currentCrop, name: cropName, growthStage: 'Seedling', health: '75% (New)' },
          },
        },
      };
    }),

  addPlot: (farmerId, plotName, cropName) =>
    set((s) => {
      const f = s.farmers[farmerId];
      if (!f) return {};
      const plotKey = `plot_${Date.now()}`;
      return {
        farmers: {
          ...s.farmers,
          [farmerId]: {
            ...f,
            plots: { ...f.plots, [plotKey]: { ...makeDefaultPlot(cropName), name: plotName } },
          },
        },
      };
    }),

  removePlot: (farmerId, plotKey) =>
    set((s) => {
      const f = s.farmers[farmerId];
      if (!f) return {};
      const newPlots = { ...f.plots };
      delete newPlots[plotKey];
      return {
        farmers: { ...s.farmers, [farmerId]: { ...f, plots: newPlots } },
      };
    }),

  updateTask: (farmerId, taskId, completed) =>
    set((s) => {
      const f = s.farmers[farmerId];
      if (!f) return {};
      return {
        farmers: {
          ...s.farmers,
          [farmerId]: {
            ...f,
            tasks: f.tasks.map((t) => (t.id === taskId ? { ...t, completed } : t)),
          },
        },
      };
    }),

  addTask: (farmerId, text) =>
    set((s) => {
      const f = s.farmers[farmerId];
      if (!f) return {};
      return {
        farmers: {
          ...s.farmers,
          [farmerId]: {
            ...f,
            tasks: [...f.tasks, { id: Date.now(), text, completed: false }],
          },
        },
      };
    }),

  removeTask: (farmerId, taskId) =>
    set((s) => {
      const f = s.farmers[farmerId];
      if (!f) return {};
      return {
        farmers: {
          ...s.farmers,
          [farmerId]: {
            ...f,
            tasks: f.tasks.filter((t) => t.id !== taskId),
          },
        },
      };
    }),
}));
