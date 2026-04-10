import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Droplets, Thermometer, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SoilAnalysisProps {
  onBack?: () => void;
}

export default function SoilAnalysis({ onBack }: SoilAnalysisProps) {
  const [sensorData] = useState({
    moisture: 45,
    temperature: 28,
    nitrogen: 72,
    phosphorus: 38,
    potassium: 35,
    ph: 6.5,
    organic: 2.8,
  });

  const getStatus = (value: number, min: number, max: number) => {
    if (value < min) return { label: 'Low', color: 'yellow' };
    if (value > max) return { label: 'High', color: 'red' };
    return { label: 'Optimal', color: 'green' };
  };

  const isEmbedded = !!onBack;

  if (isEmbedded) {
    return (
      <div className="flex flex-col ">
        <div className="flex items-center gap-2 p-3 border-b border-border/30">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={16} /></button>
          <Activity size={16} className="text-amber-400" />
          <span className="text-xs font-bold">Soil Analysis</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Droplets size={14} className="text-blue-400" />, label: 'Moisture', value: `${sensorData.moisture}%`, min: 40, max: 60, actual: sensorData.moisture },
              { icon: <Thermometer size={14} className="text-red-400" />, label: 'Temp', value: `${sensorData.temperature}°C`, min: 20, max: 35, actual: sensorData.temperature },
              { icon: <Activity size={14} className="text-purple-400" />, label: 'pH', value: `${sensorData.ph}`, min: 6, max: 7, actual: sensorData.ph },
              { icon: <Zap size={14} className="text-yellow-400" />, label: 'Organic', value: `${sensorData.organic}%`, min: 2, max: 4, actual: sensorData.organic },
            ].map(item => {
              const status = getStatus(item.actual, item.min, item.max);
              return (
                <div key={item.label} className="bg-muted/20 border border-border/20 rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">{item.icon}</div>
                  <p className="text-sm font-bold">{item.value}</p>
                  <p className="text-[8px] text-muted-foreground">{item.label}</p>
                  <span className={`text-[7px] px-1.5 py-0.5 rounded-full ${status.color === 'green' ? 'bg-green-500/20 text-green-400' : status.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-destructive/20 text-destructive'}`}>{status.label}</span>
                </div>
              );
            })}
          </div>

          {/* NPK */}
          <div className="bg-muted/20 border border-border/20 rounded-lg p-2.5">
            <h4 className="text-[10px] font-bold mb-2">NPK Analysis</h4>
            {[
              { label: 'Nitrogen (N)', value: sensorData.nitrogen },
              { label: 'Phosphorus (P)', value: sensorData.phosphorus },
              { label: 'Potassium (K)', value: sensorData.potassium },
            ].map(item => (
              <div key={item.label} className="mb-1.5">
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span>{item.label}</span><span className="font-bold">{item.value} kg/ha</span>
                </div>
                <Progress value={item.value} className="h-1.5" />
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium">Suitable for Rice cultivation</p>
                <p className="text-[8px] text-muted-foreground">NPK ratio is optimal for paddy</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium">Consider adding lime</p>
                <p className="text-[8px] text-muted-foreground">pH slightly acidic</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-50">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Soil Analysis</h1>
                <p className="text-sm text-gray-500">Plough-mounted IoT sensor data</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Droplets className="w-8 h-8 text-blue-500" />, value: `${sensorData.moisture}%`, label: 'Moisture', status: getStatus(sensorData.moisture, 40, 60) },
            { icon: <Thermometer className="w-8 h-8 text-red-500" />, value: `${sensorData.temperature}°C`, label: 'Temperature', status: getStatus(sensorData.temperature, 20, 35) },
            { icon: <Activity className="w-8 h-8 text-purple-500" />, value: `${sensorData.ph}`, label: 'pH Level', status: getStatus(sensorData.ph, 6, 7) },
            { icon: <Zap className="w-8 h-8 text-yellow-500" />, value: `${sensorData.organic}%`, label: 'Organic Matter', status: getStatus(sensorData.organic, 2, 4) },
          ].map(item => (
            <Card key={item.label} className={`border-2 ${item.status.color === 'green' ? 'border-green-500' : 'border-yellow-500'}`}>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">{item.icon}</div>
                <p className="text-3xl font-bold">{item.value}</p>
                <p className="text-sm text-gray-500">{item.label}</p>
                <Badge className={`mt-2 ${item.status.color === 'green' ? 'bg-green-100 text-green-700' : item.status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{item.status.label}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">NPK Analysis</h2>
            <div className="space-y-4">
              {[
                { label: 'Nitrogen (N)', value: sensorData.nitrogen },
                { label: 'Phosphorus (P)', value: sensorData.phosphorus },
                { label: 'Potassium (K)', value: sensorData.potassium },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{item.label}</span>
                    <span>{item.value} kg/ha</span>
                  </div>
                  <Progress value={item.value} className="h-3" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">AI Recommendations</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Soil is suitable for Rice cultivation</p>
                  <p className="text-sm text-gray-500">NPK ratio is optimal for paddy fields</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium">Consider adding lime</p>
                  <p className="text-sm text-gray-500">pH slightly acidic, consider correction</p>
                </div>
              </div>
            </div>
            <Link to="/crop-recommendation">
              <Button className="w-full mt-4 gap-2"><CheckCircle2 className="w-4 h-4" /> Get Crop Recommendation</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
