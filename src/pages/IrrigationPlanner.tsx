import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Droplets, Clock, Sun, CloudRain, Zap, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface IrrigationPlannerProps {
  onBack?: () => void;
}

export default function IrrigationPlanner({ onBack }: IrrigationPlannerProps) {
  const [moisture] = useState(68);
  const [evapotranspiration] = useState(4.2);
  const [waterSaved] = useState(35);

  const getIrrigationStatus = () => {
    if (moisture >= 60) return { status: 'optimal', message: 'No irrigation needed', color: 'green' };
    if (moisture >= 40) return { status: 'moderate', message: 'Irrigation recommended in 24h', color: 'yellow' };
    return { status: 'urgent', message: 'Immediate irrigation required', color: 'red' };
  };
  const status = getIrrigationStatus();

  const isEmbedded = !!onBack;

  if (isEmbedded) {
    return (
      <div className="flex flex-col ">
        <div className="flex items-center gap-2 p-3 border-b border-border/30">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={16} /></button>
          <Droplets size={16} className="text-cyan-400" />
          <span className="text-xs font-bold">Irrigation Planner</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* Status Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className={`bg-${status.color === 'green' ? 'green-500' : status.color === 'yellow' ? 'yellow-500' : 'destructive'}/10 border border-${status.color === 'green' ? 'green-500' : status.color === 'yellow' ? 'yellow-500' : 'destructive'}/20 rounded-lg p-2 text-center`}>
              <Droplets className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <p className="text-sm font-bold">{moisture}%</p>
              <p className="text-[7px] text-muted-foreground">Moisture</p>
            </div>
            <div className="bg-muted/20 border border-border/20 rounded-lg p-2 text-center">
              <Sun className="w-5 h-5 mx-auto mb-1 text-orange-400" />
              <p className="text-sm font-bold">{evapotranspiration}mm</p>
              <p className="text-[7px] text-muted-foreground">ET Rate</p>
            </div>
            <div className="bg-muted/20 border border-border/20 rounded-lg p-2 text-center">
              <CloudRain className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <p className="text-sm font-bold">{waterSaved}%</p>
              <p className="text-[7px] text-muted-foreground">Saved</p>
            </div>
          </div>

          <div className={`text-center p-2 rounded-lg text-[9px] font-medium ${status.color === 'green' ? 'bg-green-500/10 text-green-400' : status.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-destructive/10 text-destructive'}`}>
            {status.message}
          </div>

          {/* Weekly Schedule */}
          <div className="bg-muted/20 border border-border/20 rounded-lg p-2.5">
            <h4 className="text-[10px] font-bold mb-2 flex items-center gap-1"><Clock size={10} /> Weekly Schedule</h4>
            <div className="grid grid-cols-7 gap-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className={`text-center py-1.5 rounded-lg ${idx === 2 || idx === 5 ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-muted/10'}`}>
                  <p className="text-[8px] font-medium">{day}</p>
                  {(idx === 2 || idx === 5) && <Droplets className="w-3 h-3 mx-auto mt-0.5 text-blue-400" />}
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded-lg border border-green-500/20">
              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium">Optimal conditions maintained</p>
                <p className="text-[8px] text-muted-foreground">System working efficiently</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Zap className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium">Drip irrigation recommended</p>
                <p className="text-[8px] text-muted-foreground">Saves 35% more water</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-medium">Rain expected in 48 hours</p>
                <p className="text-[8px] text-muted-foreground">Consider skipping next irrigation</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Droplets className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Irrigation Planner</h1>
                <p className="text-sm text-gray-500">Smart water management system</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className={`border-2 ${status.color === 'green' ? 'border-green-500' : status.color === 'yellow' ? 'border-yellow-500' : 'border-red-500'}`}>
            <CardContent className="p-6 text-center">
              <Droplets className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <Badge className={`mb-4 ${status.color === 'green' ? 'bg-green-100 text-green-700' : status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{status.status.toUpperCase()}</Badge>
              <p className="text-4xl font-bold mb-2">{moisture}%</p>
              <p className="text-gray-500">Current Soil Moisture</p>
              <p className="text-sm text-gray-400 mt-2">{status.message}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Sun className="w-12 h-12 mx-auto mb-4 text-orange-500" />
              <p className="text-4xl font-bold mb-2">{evapotranspiration}mm</p>
              <p className="text-gray-500">Daily Evapotranspiration</p>
              <p className="text-sm text-orange-600 mt-2">High temperature expected</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <CloudRain className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <p className="text-4xl font-bold mb-2">{waterSaved}%</p>
              <p className="text-gray-500">Water Saved</p>
              <p className="text-sm text-green-600 mt-2">vs Traditional Methods</p>
            </CardContent>
          </Card>
        </div>
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> Irrigation Schedule</h2>
            <div className="grid md:grid-cols-7 gap-4">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                <div key={day} className={`p-4 rounded-xl text-center ${idx === 2 || idx === 5 ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'}`}>
                  <p className="font-semibold">{day}</p>
                  {idx === 2 || idx === 5 ? (
                    <>
                      <Droplets className="w-6 h-6 mx-auto my-2 text-blue-500" />
                      <p className="text-sm text-blue-600">6:00 AM</p>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 mt-6">Rest</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Smart Recommendations</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckCircle2 className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Optimal conditions maintained</p>
                  <p className="text-sm text-gray-500">Smart irrigation system is working efficiently</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <Zap className="w-6 h-6 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium">Drip irrigation recommended</p>
                  <p className="text-sm text-gray-500">Saves 35% more water than flood irrigation</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <AlertTriangle className="w-6 h-6 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium">Rain expected in 48 hours</p>
                  <p className="text-sm text-gray-500">Consider skipping next scheduled irrigation</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex-col gap-2"><Droplets className="w-6 h-6" /> Manual Irrigation</Button>
              <Button variant="outline" className="h-20 flex-col gap-2"><Clock className="w-6 h-6" /> Schedule Override</Button>
              <Link to="/iot-dashboard"><Button variant="outline" className="h-20 flex-col gap-2 w-full"><Droplets className="w-6 h-6" /> View Sensors</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
