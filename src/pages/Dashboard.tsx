import { Link } from 'react-router-dom';
import {
  Sprout, Bug, Cpu, Tractor, Newspaper, Activity, Droplets, Brain,
  ArrowRight, Leaf, Sun, CloudRain, TrendingUp, Users, BarChart3, Landmark
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const features = [
  { title: 'AI Assistant', desc: 'Chat with AgriBot for 24/7 farming support', icon: Brain, path: '/ai-assistant', gradient: 'from-violet-500 to-purple-600', emoji: '🤖' },
  { title: 'Crop Recommendation', desc: 'ML-based crop suggestions for your land', icon: Sprout, path: '/crop-recommendation', gradient: 'from-green-500 to-emerald-600', emoji: '🌾' },
  { title: 'Disease Detection', desc: 'AI vision system for plant diseases', icon: Bug, path: '/disease-detection', gradient: 'from-red-500 to-orange-600', emoji: '🦠' },
  { title: 'IoT Dashboard', desc: 'Real-time sensor monitoring', icon: Cpu, path: '/iot-dashboard', gradient: 'from-blue-500 to-cyan-600', emoji: '📡' },
  { title: 'Equipment Rent', desc: 'Agricultural marketplace for equipment', icon: Tractor, path: '/equipment-rent', gradient: 'from-orange-500 to-amber-600', emoji: '🚜' },
  { title: 'Soil Analysis', desc: 'Plough-mounted IoT soil sensors', icon: Activity, path: '/soil-analysis', gradient: 'from-amber-500 to-orange-600', emoji: '🌱' },
  { title: 'Irrigation Planner', desc: 'Smart water management system', icon: Droplets, path: '/irrigation', gradient: 'from-cyan-500 to-blue-600', emoji: '💧' },
  { title: 'News & Market', desc: 'Agricultural news and market intelligence', icon: Newspaper, path: '/news', gradient: 'from-indigo-500 to-purple-600', emoji: '📰' },
  { title: 'Cultivation Workflow', desc: 'End-to-end farming workflow', icon: Leaf, path: '/cultivation-workflow', gradient: 'from-lime-500 to-green-600', emoji: '🔄' },
  { title: 'Loan Application', desc: 'Crop score based loan financing', icon: Landmark, path: '/loan-application', gradient: 'from-emerald-500 to-teal-600', emoji: '🏦' },
];

const stats = [
  { label: 'Active Farms', value: '2,847', icon: Users, trend: '+12%' },
  { label: 'Crop Health', value: '94%', icon: Sprout, trend: '+3%' },
  { label: 'Water Saved', value: '35%', icon: Droplets, trend: '+8%' },
  { label: 'Revenue Up', value: '₹2.4L', icon: TrendingUp, trend: '+18%' },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-300 to-emerald-400 bg-clip-text text-transparent">
                  Agrilogy Village
                </h1>
                <p className="text-sm text-gray-400">Smart Agriculture Command Center</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white gap-2 shadow-lg shadow-green-500/20">
                  <Sun className="w-4 h-4" /> Enter 3D Village
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-all duration-300 group">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400/20 to-emerald-500/20 rounded-xl flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-xs text-green-400 font-semibold bg-green-400/10 px-2 py-1 rounded-full">{stat.trend}</span>
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Weather Banner */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-6 mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-5xl">☀️</div>
            <div>
              <p className="text-xl font-bold text-white">28°C - Clear Sky</p>
              <p className="text-sm text-gray-300">Ludhiana, Punjab · Humidity: 65% · Wind: 12 km/h</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
              <div key={day} className="text-center">
                <p className="text-xs text-gray-400">{day}</p>
                <p className="text-lg my-1">{['☀️', '⛅', '🌧️', '☀️', '⛅'][i]}</p>
                <p className="text-xs font-medium">{25 + i}°</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-400" /> AgriTech Modules
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link key={feature.title} to={feature.path}>
              <Card className="bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group cursor-pointer overflow-hidden h-full hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-green-300 transition-colors">
                    {feature.emoji} {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{feature.desc}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
