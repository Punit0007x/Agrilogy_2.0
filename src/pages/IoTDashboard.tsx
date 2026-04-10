import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cpu, Thermometer, Droplets, Sun, RefreshCw, Wind, CloudRain, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const generateHistory = (baseValue: number, variance: number) => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    data.push({ time: `${i.toString().padStart(2, '0')}:00`, value: +(baseValue + (Math.random() - 0.5) * variance).toFixed(1) });
  }
  return data;
};

interface SensorItem {
  id: string;
  name: string;
  value: number;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  history: { time: string; value: number }[];
}

interface IoTDashboardProps {
  onBack?: () => void;
}

export default function IoTDashboard({ onBack }: IoTDashboardProps) {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [telemetryData, setTelemetryData] = useState<SensorItem[]>([
    { id: '1', name: 'Soil Temperature', value: 24.5, unit: '°C', icon: Thermometer, color: '#ff6b6b', history: generateHistory(24, 5) },
    { id: '2', name: 'Soil Moisture', value: 68, unit: '%', icon: Droplets, color: '#4dabf7', history: generateHistory(68, 15) },
    { id: '3', name: 'Light Intensity', value: 850, unit: 'lux', icon: Sun, color: '#ffd43b', history: generateHistory(850, 200) },
    { id: '4', name: 'Air Humidity', value: 72, unit: '%', icon: Wind, color: '#69db7c', history: generateHistory(72, 10) },
    { id: '5', name: 'Rainfall Risk', value: 15, unit: '%', icon: CloudRain, color: '#748ffc', history: generateHistory(15, 20) },
    { id: '6', name: 'pH Level', value: 6.8, unit: 'pH', icon: Activity, color: '#f06595', history: generateHistory(6.8, 0.5) },
  ]);

  const handleRefresh = () => {
    setTelemetryData(data => data.map(item => ({
      ...item,
      value: item.unit === 'lux' ? Math.round(800 + Math.random() * 200) : +(item.value + (Math.random() - 0.5) * 2).toFixed(1),
      history: [...item.history.slice(1), { time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), value: item.value }],
    })));
    setLastUpdated(new Date());
  };

  useEffect(() => {
    const interval = setInterval(handleRefresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const isEmbedded = !!onBack;

  if (isEmbedded) {
    return (
      <div className="flex flex-col ">
        <div className="flex items-center justify-between p-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={16} /></button>
            <Cpu size={16} className="text-blue-400" />
            <span className="text-xs font-bold">IoT Sensors</span>
          </div>
          <button onClick={handleRefresh} className="text-[9px] text-muted-foreground flex items-center gap-1 hover:text-foreground">
            <RefreshCw size={10} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {telemetryData.map(item => (
            <div key={item.id} className="bg-muted/20 border border-border/20 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${item.color}20` }}>
                    <item.icon className="w-4 h-4" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground">{item.name}</p>
                    <p className="text-sm font-bold" style={{ color: item.color }}>{item.value} {item.unit}</p>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={50}>
                <LineChart data={item.history}>
                  <Line type="monotone" dataKey="value" stroke={item.color} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Cpu className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">IoT Dashboard</h1>
                  <p className="text-sm text-gray-500">Real-time sensor monitoring</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <Button onClick={handleRefresh} variant="outline" className="gap-2"><RefreshCw className="w-4 h-4" /> Refresh</Button>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {telemetryData.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${item.color}20`, color: item.color }}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{item.name}</p>
                      <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value} {item.unit}</p>
                    </div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={item.history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke={item.color} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
