// Rich farmer data ported from agrilogy-app and expanded to 10 farmers

export interface PlotData {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  details: {
    stage: string;
    metrics: { label: string; value: string; valueColor?: string }[];
  };
  moistureHistory: number[];
}

export interface CropSuggestion {
  name: string;
  profit: string;
  reason: string;
  revenue: string;
  growthTime: string;
}

export interface IrrigationItem {
  day: string;
  time: string;
  amount: string;
  status: string;
}

export interface RichFarmerData {
  id: string;
  name: string;
  region: string;
  location: { lat: number; lon: number };
  plots: Record<string, PlotData>;
  tasks: { id: number; text: string; completed: boolean }[];
  currentCrop: {
    name: string;
    plantingDate: string;
    growthStage: string;
    expectedHarvest: string;
    health: string;
  };
  cropSuggestions: CropSuggestion[];
  irrigationSchedule: {
    insight: string;
    schedule: IrrigationItem[];
    pestThreats: { crop: string; threats: string[] };
  };
  soilSensor: {
    moisture: string;
    temperature: string;
    humidity: string;
    ph: string;
    moistureStatus: string;
    tempStatus: string;
    humidityStatus: string;
    phStatus: string;
  };
  income: number;
}

export interface MandiRegion {
  mandis: { name: string; prices: Record<string, number> }[];
  forecastCrop: string;
  forecastData: number[];
  forecastInsight: string;
}

export const defaultFarmersData: Record<string, RichFarmerData> = {
  farmer0: {
    id: 'farmer0',
    name: 'Rajan Patel',
    region: 'gujarat',
    location: { lat: 23.02, lon: 72.57 },
    plots: {
      plotA: { name: 'Plot A: Rice', icon: 'Wheat', color: 'text-cyan-600', bgColor: '#ecfeff', details: { stage: 'Tillering Stage', metrics: [{ label: 'Moisture', value: '82%' }, { label: 'Health', value: '93%', valueColor: 'text-green-600' }] }, moistureHistory: [88, 86, 84, 83, 82, 82, 82] },
      plotB: { name: 'Plot B: Cotton', icon: 'Flower2', color: 'text-gray-500', bgColor: '#fafafa', details: { stage: 'Boll Development', metrics: [{ label: 'Moisture', value: '58%' }, { label: 'Health', value: '88%', valueColor: 'text-green-600' }] }, moistureHistory: [65, 63, 61, 59, 58, 58, 58] },
    },
    tasks: [{ id: 1, text: 'Water rice paddies', completed: false }, { id: 2, text: 'Scout cotton for bollworm', completed: true }],
    currentCrop: { name: 'Rice (Basmati)', plantingDate: 'Jul 10, 2025', growthStage: 'Tillering', expectedHarvest: 'Nov 20-30', health: '93% (Excellent)' },
    cropSuggestions: [{ name: 'Wheat', profit: 'Good Rotation', reason: 'Excellent follow-up to paddy.', revenue: '~₹45,000/acre', growthTime: '120 days' }, { name: 'Cumin', profit: 'High Value', reason: 'Winter spice with strong demand.', revenue: '~₹80,000/acre', growthTime: '110 days' }],
    irrigationSchedule: { insight: 'Paddy requires standing water at 2-3 inches.', schedule: [{ day: 'Today', time: '6:00 AM', amount: 'Top up', status: 'Completed' }, { day: 'Tomorrow', time: '6:00 AM', amount: 'Top up', status: 'Scheduled' }, { day: 'Wednesday', time: 'N/A', amount: 'Rain Expected', status: 'Skip' }], pestThreats: { crop: 'Rice', threats: ['Stem Borer', 'Brown Plant Hopper', 'Blast', 'Sheath Blight'] } },
    soilSensor: { moisture: '82%', temperature: '29°C', humidity: '72%', ph: '6.8', moistureStatus: '✅ Normal', tempStatus: '✅ Normal', humidityStatus: '✅ Normal', phStatus: '✅ Normal' },
    income: 42000,
  },
  farmer1: {
    id: 'farmer1',
    name: 'Sita Devi',
    region: 'uttar_pradesh',
    location: { lat: 26.85, lon: 80.95 },
    plots: {
      plotA: { name: 'Field 1: Sugarcane', icon: 'Wheat', color: 'text-green-700', bgColor: '#f0fdf4', details: { stage: 'Grand Growth Phase', metrics: [{ label: 'Moisture', value: '75%' }, { label: 'Health', value: '98%', valueColor: 'text-green-600' }] }, moistureHistory: [80, 82, 80, 78, 76, 75, 75] },
      plotB: { name: 'Field 2: Wheat', icon: 'Wheat', color: 'text-yellow-600', bgColor: '#fefce8', details: { stage: 'Growth Stage', metrics: [{ label: 'Moisture', value: '65%' }, { label: 'Health', value: '92%', valueColor: 'text-green-600' }] }, moistureHistory: [72, 70, 68, 66, 65, 65, 65] },
    },
    tasks: [{ id: 3, text: 'Apply urea to Field 2', completed: false }, { id: 4, text: 'Scout Field 1 for pests', completed: false }],
    currentCrop: { name: 'Sugarcane (Co 86032)', plantingDate: 'Mar 10, 2025', growthStage: 'Grand Growth', expectedHarvest: 'Feb 2026', health: '98% (Excellent)' },
    cropSuggestions: [{ name: 'Wheat', profit: 'Good Rotation', reason: 'Excellent for rotating with sugarcane.', revenue: '~₹40,000/acre', growthTime: '120-130 days' }, { name: 'Mustard', profit: 'Cash Crop', reason: 'Short duration cash crop.', revenue: '~₹38,000/acre', growthTime: '100-110 days' }],
    irrigationSchedule: { insight: 'Sugarcane requires consistent moisture during grand growth.', schedule: [{ day: 'Today', time: '7:00 PM', amount: '45 min', status: 'Scheduled' }, { day: 'Tomorrow', time: '7:00 PM', amount: '45 min', status: 'Scheduled' }, { day: 'Wednesday', time: '7:00 PM', amount: '40 min', status: 'Scheduled' }], pestThreats: { crop: 'Sugarcane', threats: ['Early Shoot Borer', 'Top Borer', 'Red Rot', 'Smut'] } },
    soilSensor: { moisture: '75%', temperature: '27°C', humidity: '68%', ph: '7.0', moistureStatus: '✅ Normal', tempStatus: '✅ Normal', humidityStatus: '✅ Normal', phStatus: '✅ Normal' },
    income: 48000,
  },
  farmer2: {
    id: 'farmer2',
    name: 'Mohan Kumar',
    region: 'karnataka',
    location: { lat: 15.35, lon: 75.13 },
    plots: {
      plotA: { name: 'Plot A: Tomatoes', icon: 'Carrot', color: 'text-red-500', bgColor: '#fef2f2', details: { stage: 'Flowering Stage', metrics: [{ label: 'Moisture', value: '42%' }, { label: 'Health', value: '85%', valueColor: 'text-green-600' }] }, moistureHistory: [55, 53, 50, 48, 46, 44, 42] },
      plotB: { name: 'Plot B: Wheat', icon: 'Wheat', color: 'text-yellow-600', bgColor: '#fefce8', details: { stage: 'Growth Stage', metrics: [{ label: 'Moisture', value: '65%' }, { label: 'Health', value: '92%', valueColor: 'text-green-600' }] }, moistureHistory: [75, 72, 70, 68, 66, 65, 65] },
      plotC: { name: 'Plot C: Fallow', icon: 'Shovel', color: 'text-slate-500', bgColor: '#f1f5f9', details: { stage: 'Ready for Planting', metrics: [{ label: 'Moisture', value: '55%' }, { label: 'Nutrients', value: 'Good', valueColor: 'text-yellow-500' }] }, moistureHistory: [60, 58, 55, 55, 56, 55, 55] },
    },
    tasks: [{ id: 5, text: 'Check pest traps in Plot B', completed: false }, { id: 6, text: 'Prepare Plot C for planting', completed: true }],
    currentCrop: { name: 'Tomato (Roma)', plantingDate: 'Aug 15, 2025', growthStage: 'Flowering', expectedHarvest: 'Nov 20-30', health: '85% (Good)' },
    cropSuggestions: [{ name: 'Spinach', profit: 'High Profit', reason: 'High demand in winter.', revenue: '~₹55,000/acre', growthTime: '40-55 days' }, { name: 'Lettuce', profit: 'Stable Market', reason: 'Fast growth cycle.', revenue: '~₹45,000/acre', growthTime: '50-70 days' }],
    irrigationSchedule: { insight: 'Rain forecasted Wednesday. Reduce irrigation frequency.', schedule: [{ day: 'Today', time: '6:00 AM', amount: '15 min', status: 'Completed' }, { day: 'Tomorrow', time: '6:30 AM', amount: '20 min', status: 'Scheduled' }, { day: 'Wednesday', time: 'N/A', amount: 'Rain Expected', status: 'Skip' }], pestThreats: { crop: 'Tomatoes', threats: ['Blight (Fungal)', 'Aphids', 'Whitefly', 'Hornworms'] } },
    soilSensor: { moisture: '42%', temperature: '28°C', humidity: '68%', ph: '6.4', moistureStatus: '✅ Normal', tempStatus: '✅ Normal', humidityStatus: '✅ Normal', phStatus: '⚠️ Slightly Acidic' },
    income: 35000,
  },
  farmer3: {
    id: 'farmer3',
    name: 'Lakshmi Bai',
    region: 'rajasthan',
    location: { lat: 26.9, lon: 75.7 },
    plots: {
      plotA: { name: 'Plot A: Mustard', icon: 'Flower2', color: 'text-yellow-500', bgColor: '#fefce8', details: { stage: 'Flowering', metrics: [{ label: 'Moisture', value: '32%' }, { label: 'Health', value: '65%', valueColor: 'text-yellow-500' }] }, moistureHistory: [45, 42, 40, 38, 35, 33, 32] },
      plotB: { name: 'Plot B: Chickpea', icon: 'Leaf', color: 'text-green-600', bgColor: '#f0fdf4', details: { stage: 'Pod Filling', metrics: [{ label: 'Moisture', value: '40%' }, { label: 'Health', value: '72%', valueColor: 'text-yellow-500' }] }, moistureHistory: [55, 52, 48, 45, 42, 41, 40] },
    },
    tasks: [{ id: 7, text: 'Irrigate Mustard field immediately', completed: false }, { id: 8, text: 'Check for pod borer pests', completed: false }],
    currentCrop: { name: 'Mustard (Pusa Bold)', plantingDate: 'Oct 20, 2025', growthStage: 'Flowering', expectedHarvest: 'Feb 15-25', health: '65% (Stressed)' },
    cropSuggestions: [{ name: 'Millet (Bajra)', profit: 'Drought Tolerant', reason: 'Highly suitable for arid climate.', revenue: '~₹28,000/acre', growthTime: '80-90 days' }, { name: 'Guar', profit: 'High Demand', reason: 'Industrial demand is high.', revenue: '~₹50,000/acre', growthTime: '90-100 days' }],
    irrigationSchedule: { insight: 'Mustard is water-stressed. Immediate deep irrigation critical.', schedule: [{ day: 'Today', time: 'Immediately', amount: '30 min', status: 'Urgent' }, { day: 'Tomorrow', time: '5:30 AM', amount: '25 min', status: 'Scheduled' }, { day: 'Wednesday', time: '5:30 AM', amount: '25 min', status: 'Scheduled' }], pestThreats: { crop: 'Mustard', threats: ['Aphids', 'Alternaria Blight', 'White Rust', 'Sawfly'] } },
    soilSensor: { moisture: '32%', temperature: '35°C', humidity: '38%', ph: '7.5', moistureStatus: '⚠️ Low', tempStatus: '⚠️ High', humidityStatus: '⚠️ Low', phStatus: '✅ Normal' },
    income: 22000,
  },
  farmer4: {
    id: 'farmer4',
    name: 'Arjun Singh',
    region: 'punjab',
    location: { lat: 31.63, lon: 74.87 },
    plots: {
      plotA: { name: 'Paddy Field 1', icon: 'Wheat', color: 'text-cyan-600', bgColor: '#ecfeff', details: { stage: 'Tillering Stage', metrics: [{ label: 'Moisture', value: '85%' }, { label: 'Health', value: '94%', valueColor: 'text-green-600' }] }, moistureHistory: [90, 88, 86, 85, 85, 85, 85] },
      plotB: { name: 'Paddy Field 2', icon: 'Wheat', color: 'text-cyan-600', bgColor: '#ecfeff', details: { stage: 'Tillering Stage', metrics: [{ label: 'Moisture', value: '88%' }, { label: 'Health', value: '96%', valueColor: 'text-green-600' }] }, moistureHistory: [92, 90, 88, 88, 88, 88, 88] },
      plotC: { name: 'Vegetable Patch', icon: 'Carrot', color: 'text-orange-500', bgColor: '#fff7ed', details: { stage: 'Harvesting', metrics: [{ label: 'Moisture', value: '45%' }, { label: 'Health', value: '91%', valueColor: 'text-green-600' }] }, moistureHistory: [60, 55, 50, 48, 46, 45, 45] },
    },
    tasks: [{ id: 9, text: 'Top-dress veggies with urea', completed: true }, { id: 10, text: 'Check water levels in Paddy', completed: false }],
    currentCrop: { name: 'Paddy (Basmati)', plantingDate: 'Jul 05, 2025', growthStage: 'Tillering', expectedHarvest: 'Nov 15-25', health: '94% (Good)' },
    cropSuggestions: [{ name: 'Potato', profit: 'High Yield', reason: 'Punjab soil is ideal after paddy.', revenue: '~₹90,000/acre', growthTime: '90-110 days' }, { name: 'Maize', profit: 'Versatile', reason: 'Breaks the rice-wheat cycle.', revenue: '~₹42,000/acre', growthTime: '100-120 days' }],
    irrigationSchedule: { insight: 'Paddy fields require standing water at 2-3 inches.', schedule: [{ day: 'Today', time: 'Check Level', amount: 'Top up', status: 'Ongoing' }, { day: 'Tomorrow', time: 'Check Level', amount: 'Top up', status: 'Ongoing' }, { day: 'Wednesday', time: 'Check Level', amount: 'Top up', status: 'Ongoing' }], pestThreats: { crop: 'Paddy', threats: ['Stem Borer', 'Brown Plant Hopper', 'Blast', 'Sheath Blight'] } },
    soilSensor: { moisture: '85%', temperature: '26°C', humidity: '75%', ph: '6.6', moistureStatus: '✅ Normal', tempStatus: '✅ Normal', humidityStatus: '✅ Normal', phStatus: '✅ Normal' },
    income: 55000,
  },
  farmer5: {
    id: 'farmer5',
    name: 'Priya Sharma',
    region: 'karnataka',
    location: { lat: 15.5, lon: 75.0 },
    plots: {
      plotA: { name: 'Plot A: Turmeric', icon: 'Leaf', color: 'text-yellow-700', bgColor: '#fef9c3', details: { stage: 'Rhizome Bulking', metrics: [{ label: 'Moisture', value: '70%' }, { label: 'Health', value: '88%', valueColor: 'text-green-600' }] }, moistureHistory: [78, 76, 74, 72, 71, 70, 70] },
    },
    tasks: [{ id: 11, text: 'Apply mulch to turmeric beds', completed: false }],
    currentCrop: { name: 'Turmeric (Salem)', plantingDate: 'May 15, 2025', growthStage: 'Rhizome Bulking', expectedHarvest: 'Jan 2026', health: '88% (Good)' },
    cropSuggestions: [{ name: 'Ginger', profit: 'High Value', reason: 'Similar growing conditions.', revenue: '~₹1,20,000/acre', growthTime: '240 days' }],
    irrigationSchedule: { insight: 'Turmeric beds need consistent moisture. Drip irrigation optimal.', schedule: [{ day: 'Today', time: '6:30 AM', amount: '20 min', status: 'Scheduled' }, { day: 'Tomorrow', time: '6:30 AM', amount: '20 min', status: 'Scheduled' }], pestThreats: { crop: 'Turmeric', threats: ['Rhizome Rot', 'Leaf Blotch', 'Scale Insects'] } },
    soilSensor: { moisture: '70%', temperature: '27°C', humidity: '72%', ph: '6.2', moistureStatus: '✅ Normal', tempStatus: '✅ Normal', humidityStatus: '✅ Normal', phStatus: '⚠️ Slightly Acidic' },
    income: 38000,
  },
  farmer6: {
    id: 'farmer6',
    name: 'Deepak Yadav',
    region: 'uttar_pradesh',
    location: { lat: 27.1, lon: 81.0 },
    plots: {
      plotA: { name: 'Plot A: Potato', icon: 'Leaf', color: 'text-amber-700', bgColor: '#fffbeb', details: { stage: 'Tuber Initiation', metrics: [{ label: 'Moisture', value: '62%' }, { label: 'Health', value: '80%', valueColor: 'text-green-600' }] }, moistureHistory: [70, 68, 66, 64, 63, 62, 62] },
      plotB: { name: 'Plot B: Onion', icon: 'Sprout', color: 'text-purple-500', bgColor: '#faf5ff', details: { stage: 'Bulb Formation', metrics: [{ label: 'Moisture', value: '55%' }, { label: 'Health', value: '76%', valueColor: 'text-yellow-500' }] }, moistureHistory: [65, 62, 60, 58, 56, 55, 55] },
    },
    tasks: [{ id: 12, text: 'Earthing up potato plants', completed: false }],
    currentCrop: { name: 'Potato (Kufri Jyoti)', plantingDate: 'Oct 10, 2025', growthStage: 'Tuber Initiation', expectedHarvest: 'Jan 15-25', health: '80% (Fair)' },
    cropSuggestions: [{ name: 'Green Peas', profit: 'Quick Return', reason: 'Fast growing winter crop.', revenue: '~₹60,000/acre', growthTime: '60-80 days' }],
    irrigationSchedule: { insight: 'Potato needs consistent moisture during tuber initiation.', schedule: [{ day: 'Today', time: '5:30 AM', amount: '25 min', status: 'Completed' }, { day: 'Tomorrow', time: '5:30 AM', amount: '25 min', status: 'Scheduled' }], pestThreats: { crop: 'Potato', threats: ['Late Blight', 'Early Blight', 'Potato Tuber Moth'] } },
    soilSensor: { moisture: '62%', temperature: '22°C', humidity: '65%', ph: '6.5', moistureStatus: '✅ Normal', tempStatus: '✅ Normal', humidityStatus: '✅ Normal', phStatus: '✅ Normal' },
    income: 32000,
  },
  farmer7: {
    id: 'farmer7',
    name: 'Kamla Devi',
    region: 'rajasthan',
    location: { lat: 26.5, lon: 75.5 },
    plots: {
      plotA: { name: 'Plot A: Millet', icon: 'Wheat', color: 'text-amber-600', bgColor: '#fef3c7', details: { stage: 'Grain Filling', metrics: [{ label: 'Moisture', value: '28%' }, { label: 'Health', value: '70%', valueColor: 'text-yellow-500' }] }, moistureHistory: [40, 38, 35, 32, 30, 29, 28] },
    },
    tasks: [{ id: 13, text: 'Bird scaring in millet field', completed: false }],
    currentCrop: { name: 'Millet (Bajra)', plantingDate: 'Jul 25, 2025', growthStage: 'Grain Filling', expectedHarvest: 'Oct 20-30', health: '70% (Fair)' },
    cropSuggestions: [{ name: 'Mustard', profit: 'Cash Crop', reason: 'Good winter crop for dry land.', revenue: '~₹35,000/acre', growthTime: '100 days' }],
    irrigationSchedule: { insight: 'Millet is drought-tolerant but needs moisture during grain filling.', schedule: [{ day: 'Today', time: '6:00 AM', amount: '15 min', status: 'Scheduled' }], pestThreats: { crop: 'Millet', threats: ['Shoot Fly', 'Ergot', 'Downy Mildew'] } },
    soilSensor: { moisture: '28%', temperature: '37°C', humidity: '32%', ph: '7.8', moistureStatus: '⚠️ Low', tempStatus: '⚠️ High', humidityStatus: '⚠️ Low', phStatus: '✅ Normal' },
    income: 18000,
  },
  farmer8: {
    id: 'farmer8',
    name: 'Suresh Reddy',
    region: 'karnataka',
    location: { lat: 15.2, lon: 75.3 },
    plots: {
      plotA: { name: 'Plot A: Soybean', icon: 'Sprout', color: 'text-lime-600', bgColor: '#f7fee7', details: { stage: 'Flowering', metrics: [{ label: 'Moisture', value: '68%' }, { label: 'Health', value: '90%', valueColor: 'text-green-600' }] }, moistureHistory: [75, 74, 72, 70, 69, 68, 68] },
      plotB: { name: 'Plot B: Groundnut', icon: 'Leaf', color: 'text-amber-700', bgColor: '#fffbeb', details: { stage: 'Pegging', metrics: [{ label: 'Moisture', value: '60%' }, { label: 'Health', value: '82%', valueColor: 'text-green-600' }] }, moistureHistory: [68, 66, 64, 62, 61, 60, 60] },
    },
    tasks: [{ id: 14, text: 'Apply neem oil spray', completed: false }],
    currentCrop: { name: 'Soybean (JS 335)', plantingDate: 'Jun 20, 2025', growthStage: 'Flowering', expectedHarvest: 'Oct 15-25', health: '90% (Good)' },
    cropSuggestions: [{ name: 'Wheat', profit: 'Safe Bet', reason: 'Reliable rabi crop after soybean.', revenue: '~₹40,000/acre', growthTime: '120 days' }],
    irrigationSchedule: { insight: 'Soybean needs moderate moisture. Avoid waterlogging.', schedule: [{ day: 'Today', time: '7:00 AM', amount: '15 min', status: 'Scheduled' }, { day: 'Tomorrow', time: '7:00 AM', amount: '15 min', status: 'Scheduled' }], pestThreats: { crop: 'Soybean', threats: ['Girdle Beetle', 'Stem Fly', 'Yellow Mosaic'] } },
    soilSensor: { moisture: '68%', temperature: '28°C', humidity: '70%', ph: '6.5', moistureStatus: '✅ Normal', tempStatus: '✅ Normal', humidityStatus: '✅ Normal', phStatus: '✅ Normal' },
    income: 40000,
  },
  farmer9: {
    id: 'farmer9',
    name: 'Anita Kumari',
    region: 'punjab',
    location: { lat: 31.5, lon: 75.0 },
    plots: {
      plotA: { name: 'Plot A: Maize', icon: 'Sprout', color: 'text-green-600', bgColor: '#f0fdf4', details: { stage: 'Tasseling', metrics: [{ label: 'Moisture', value: '72%' }, { label: 'Health', value: '91%', valueColor: 'text-green-600' }] }, moistureHistory: [80, 78, 76, 74, 73, 72, 72] },
      plotB: { name: 'Plot B: Wheat', icon: 'Wheat', color: 'text-yellow-600', bgColor: '#fefce8', details: { stage: 'Sowing', metrics: [{ label: 'Moisture', value: '58%' }, { label: 'Health', value: '85%', valueColor: 'text-green-600' }] }, moistureHistory: [65, 63, 61, 60, 59, 58, 58] },
    },
    tasks: [{ id: 15, text: 'Apply pre-sowing irrigation to wheat', completed: false }],
    currentCrop: { name: 'Maize (Hybrid)', plantingDate: 'Jun 15, 2025', growthStage: 'Tasseling', expectedHarvest: 'Oct 10-20', health: '91% (Good)' },
    cropSuggestions: [{ name: 'Potato', profit: 'High Return', reason: 'Punjab winter is ideal for potato.', revenue: '~₹90,000/acre', growthTime: '90 days' }],
    irrigationSchedule: { insight: 'Maize at tasseling stage needs adequate moisture for pollination.', schedule: [{ day: 'Today', time: '5:00 AM', amount: '25 min', status: 'Completed' }, { day: 'Tomorrow', time: '5:00 AM', amount: '25 min', status: 'Scheduled' }], pestThreats: { crop: 'Maize', threats: ['Fall Armyworm', 'Stem Borer', 'Leaf Blight'] } },
    soilSensor: { moisture: '72%', temperature: '25°C', humidity: '68%', ph: '6.8', moistureStatus: '✅ Normal', tempStatus: '✅ Normal', humidityStatus: '✅ Normal', phStatus: '✅ Normal' },
    income: 45000,
  },
};

export const mandiData: Record<string, MandiRegion> = {
  karnataka: {
    mandis: [
      { name: 'APMC Hubli', prices: { Tomato: 2100, Wheat: 2350, Soybean: 4500, Turmeric: 12000 } },
      { name: 'Central Market, Belgaum', prices: { Tomato: 2150, Wheat: 2320, Soybean: 4520, Turmeric: 12200 } },
    ],
    forecastCrop: 'Tomato',
    forecastData: [2150, 2180, 2250, 2350, 2320, 2300, 2280],
    forecastInsight: 'Prices expected to rise mid-week. Consider selling Thursday.',
  },
  uttar_pradesh: {
    mandis: [
      { name: 'Naveen Mandi, Lucknow', prices: { Sugarcane: 350, Potato: 1500, Wheat: 2200, Onion: 1800 } },
      { name: 'Kanpur Mandi', prices: { Sugarcane: 355, Potato: 1520, Wheat: 2250, Onion: 1840 } },
    ],
    forecastCrop: 'Sugarcane',
    forecastData: [350, 352, 355, 358, 356, 355, 354],
    forecastInsight: 'Stable demand. Prices expected to remain steady.',
  },
  rajasthan: {
    mandis: [
      { name: 'Jaipur Mandi', prices: { Mustard: 5500, Chickpea: 4800, Millet: 2100, Guar: 6000 } },
      { name: 'Jodhpur Mandi', prices: { Mustard: 5550, Chickpea: 4750, Millet: 2120, Guar: 6100 } },
    ],
    forecastCrop: 'Mustard',
    forecastData: [5500, 5520, 5480, 5600, 5590, 5550, 5540],
    forecastInsight: 'Slight dip then rise. Sell late in the week.',
  },
  gujarat: {
    mandis: [
      { name: 'Jamalpur, Ahmedabad', prices: { Rice: 3200, Cotton: 6500, Cumin: 25000, Groundnut: 7500 } },
      { name: 'Rajkot Yard', prices: { Rice: 3250, Cotton: 6450, Cumin: 25200, Groundnut: 7550 } },
    ],
    forecastCrop: 'Rice',
    forecastData: [3200, 3220, 3250, 3280, 3260, 3240, 3230],
    forecastInsight: 'Rice prices stable. Sell anytime this week.',
  },
  punjab: {
    mandis: [
      { name: 'Amritsar Mandi', prices: { Paddy: 3200, Potato: 1200, Maize: 2000, Wheat: 2250 } },
      { name: 'Ludhiana Mandi', prices: { Paddy: 3250, Potato: 1250, Maize: 1980, Wheat: 2260 } },
    ],
    forecastCrop: 'Paddy',
    forecastData: [3200, 3210, 3230, 3250, 3240, 3220, 3210],
    forecastInsight: 'Slight upward trend. Holding a few days might be profitable.',
  },
};

export const aiRecommendations = [
  { title: 'Skip Irrigation', body: 'High humidity detected. Skipping irrigation for affected plots saves water.' },
  { title: 'Apply Fertilizer', body: 'Soil analysis: low Nitrogen in multiple plots. Apply balanced NPK.' },
  { title: 'Pest Alert', body: 'Weather favorable for aphid growth. Inspect leaf undersides.' },
  { title: 'Market Opportunity', body: 'Local demand for leafy greens is high. Consider early harvest.' },
  { title: 'Soil Health', body: 'pH dropping in some plots. Apply lime before next cycle.' },
  { title: 'Water Management', body: 'Dry spell predicted. Check drip irrigation systems.' },
];

export const cropOptions = [
  'Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Millet', 'Maize', 'Lentils', 'Mustard',
  'Turmeric', 'Soybean', 'Tomato', 'Potato', 'Onion', 'Groundnut', 'Chickpea',
  'Guar', 'Paddy', 'Spinach', 'Lettuce', 'Cumin', 'Fennel', 'Green Peas', 'Ginger',
];
