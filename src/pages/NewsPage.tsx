import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Newspaper, Sun, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const news = [
  { id: 1, title: 'Government Launches New Subsidy for Smart Farming', category: 'Schemes', date: '2 hours ago', image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400&h=200&fit=crop' },
  { id: 2, title: 'Weather Alert: Heavy Rainfall Expected Next Week', category: 'Weather', date: '4 hours ago', image: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400&h=200&fit=crop' },
  { id: 3, title: 'Market Prices: Wheat Rises 5% on Export Demand', category: 'Market', date: '6 hours ago', image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=200&fit=crop' },
  { id: 4, title: 'New AI Tool for Early Disease Detection Launched', category: 'Technology', date: '1 day ago', image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=200&fit=crop' },
];

const marketPrices = [
  { crop: 'Wheat', price: 2250, trend: '+2.5%', status: 'up' as const },
  { crop: 'Rice', price: 2100, trend: '+1.8%', status: 'up' as const },
  { crop: 'Cotton', price: 6500, trend: '-0.5%', status: 'down' as const },
  { crop: 'Sugarcane', price: 350, trend: '0%', status: 'stable' as const },
  { crop: 'Soybean', price: 4800, trend: '+3.2%', status: 'up' as const },
  { crop: 'Maize', price: 1850, trend: '-1.0%', status: 'down' as const },
];

interface NewsPageProps {
  onBack?: () => void;
}

export default function NewsPage({ onBack }: NewsPageProps) {
  const isEmbedded = !!onBack;

  if (isEmbedded) {
    return (
      <div className="flex flex-col ">
        <div className="flex items-center gap-2 p-3 border-b border-border/30">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={16} /></button>
          <Newspaper size={16} className="text-indigo-400" />
          <span className="text-xs font-bold">News & Market</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* Market Prices */}
          <div className="bg-muted/20 border border-border/20 rounded-lg p-2.5">
            <h4 className="text-[10px] font-bold mb-2 flex items-center gap-1"><TrendingUp size={10} className="text-green-500" /> Market Prices</h4>
            <div className="space-y-1">
              {marketPrices.map((item) => (
                <div key={item.crop} className="flex items-center justify-between py-1 text-[10px]">
                  <span>{item.crop}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">₹{item.price}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${item.status === 'up' ? 'bg-green-500/20 text-green-400' : item.status === 'down' ? 'bg-destructive/20 text-destructive' : 'bg-muted/30 text-muted-foreground'}`}>{item.trend}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* News */}
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Latest News</h4>
          {news.map(item => (
            <div key={item.id} className="bg-muted/20 border border-border/20 rounded-lg p-2.5">
              <span className="text-[8px] px-1.5 py-0.5 bg-primary/20 text-primary rounded-full">{item.category}</span>
              <p className="text-[10px] font-semibold mt-1">{item.title}</p>
              <p className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-0.5"><Calendar size={8} />{item.date}</p>
            </div>
          ))}

          {/* Weather */}
          <div className="bg-muted/20 border border-border/20 rounded-lg p-2.5">
            <h4 className="text-[10px] font-bold mb-2 flex items-center gap-1"><Sun size={10} className="text-yellow-400" /> 5-Day Weather</h4>
            <div className="flex justify-between">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, idx) => (
                <div key={day} className="text-center">
                  <p className="text-[8px] text-muted-foreground">{day}</p>
                  <p className="text-sm">{['☀️', '⛅', '🌧️', '☀️', '⛅'][idx]}</p>
                  <p className="text-[8px] font-medium">{25 + idx}°</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/"><Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Newspaper className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Agricultural News</h1>
                <p className="text-sm text-gray-500">Latest updates & market prices</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Newspaper className="w-5 h-5" /> Latest News</h2>
            {news.map(item => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-48 h-32 md:h-auto bg-gray-200">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="flex-1 p-4">
                    <Badge className="mb-2">{item.category}</Badge>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500"><Calendar className="w-4 h-4" />{item.date}</div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600" /> Market Prices</h3>
                <div className="space-y-3">
                  {marketPrices.map((item) => (
                    <div key={item.crop} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="font-medium">{item.crop}</span>
                      <div className="text-right">
                        <span className="font-bold">₹{item.price}</span>
                        <Badge variant={item.status === 'up' ? 'default' : item.status === 'down' ? 'destructive' : 'secondary'} className="ml-2 text-xs">{item.trend}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-4 flex items-center gap-2"><Sun className="w-5 h-5 text-yellow-500" /> 5-Day Weather</h3>
                <div className="space-y-3">
                  {['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5'].map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span>{day}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{['☀️', '⛅', '🌧️', '☀️', '⛅'][idx]}</span>
                        <span className="font-medium">{25 + idx}°C</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
