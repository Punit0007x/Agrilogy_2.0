import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Search, Star, Tractor, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const equipmentData = [
  { id: 1, name: 'John Deere 5055E Tractor', category: 'Tractors', price: 2500, unit: 'day', rating: 4.8, location: 'Ludhiana, Punjab', image: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&h=300&fit=crop' },
  { id: 2, name: 'Mahindra 575 DI Tractor', category: 'Tractors', price: 2000, unit: 'day', rating: 4.6, location: 'Nashik, Maharashtra', image: 'https://images.unsplash.com/photo-1535960061961-1d5e3c8e3d4e?w=400&h=300&fit=crop' },
  { id: 3, name: 'Kisan Drone Sprayer', category: 'Spraying Drones', price: 5000, unit: 'day', rating: 4.9, location: 'Coimbatore, Tamil Nadu', image: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=400&h=300&fit=crop' },
  { id: 4, name: 'Combine Harvester', category: 'Harvesters', price: 8000, unit: 'day', rating: 4.7, location: 'Bathinda, Punjab', image: 'https://images.unsplash.com/photo-1591638931034-e8c5d0a6a4c0?w=400&h=300&fit=crop' },
  { id: 5, name: 'Rotavator 6ft', category: 'Soil Tillers', price: 1500, unit: 'day', rating: 4.5, location: 'Bhopal, MP', image: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&h=300&fit=crop' },
  { id: 6, name: 'Mini Tractor 25HP', category: 'Tractors', price: 1800, unit: 'day', rating: 4.4, location: 'Jaipur, Rajasthan', image: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=400&h=300&fit=crop' },
];

const categories = ['All', 'Tractors', 'Harvesters', 'Spraying Drones', 'Soil Tillers'];

interface EquipmentRentProps {
  onBack?: () => void;
}

export default function EquipmentRent({ onBack }: EquipmentRentProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<typeof equipmentData[0] | null>(null);
  const [bookingDates, setBookingDates] = useState({ start: '', end: '' });

  const filteredEquipment = equipmentData.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const calculateTotal = () => {
    if (!bookingDates.start || !bookingDates.end || !selectedEquipment) return 0;
    const days = Math.ceil((new Date(bookingDates.end).getTime() - new Date(bookingDates.start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return days * selectedEquipment.price;
  };

  const isEmbedded = !!onBack;

  if (isEmbedded) {
    return (
      <div className="flex flex-col ">
        <div className="flex items-center gap-2 p-3 border-b border-border/30">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={16} /></button>
          <Tractor size={16} className="text-orange-400" />
          <span className="text-xs font-bold">Equipment Rent</span>
        </div>
        <div className="p-3 border-b border-border/20">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search equipment..."
            className="w-full bg-muted/20 border border-border/30 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex flex-wrap gap-1 mt-2">
            {categories.map(cat => (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className={`text-[8px] px-2 py-0.5 rounded-full border transition-all ${selectedCategory === cat ? 'bg-primary/30 border-primary/50' : 'bg-muted/20 border-border/30 text-muted-foreground'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {filteredEquipment.map(item => (
            <div key={item.id} className="bg-muted/20 border border-border/20 rounded-lg p-2.5 hover:bg-muted/30 transition-all">
              <div className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold truncate">{item.name}</p>
                  <p className="text-[8px] text-muted-foreground flex items-center gap-0.5"><MapPin size={8} />{item.location}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star size={8} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-[8px]">{item.rating}</span>
                    <span className="text-[10px] font-bold text-primary ml-auto">₹{item.price}/{item.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
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
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Tractor className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AgriRent - Equipment Marketplace</h1>
                <p className="text-sm text-gray-500">Rent farm equipment at affordable rates</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Search className="w-5 h-5" /> Filters</h3>
                <div className="mb-6">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search equipment..." className="w-full px-3 py-2 border rounded-lg" />
                </div>
                <div className="space-y-2">
                  {categories.map(category => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="category" checked={selectedCategory === category} onChange={() => setSelectedCategory(category)} className="w-4 h-4 text-green-600" />
                      <span>{category}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
          <main className="lg:col-span-3">
            <p className="text-gray-600 mb-6">Showing {filteredEquipment.length} items</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEquipment.map(item => (
                <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gray-200">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    <Badge className="absolute top-3 left-3 bg-white/90 text-green-600">{item.category}</Badge>
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold mb-2">{item.name}</h3>
                    <div className="flex items-center gap-1 text-gray-500 text-sm mb-3"><MapPin className="w-4 h-4" />{item.location}</div>
                    <div className="flex items-center gap-1 mb-4"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /><span className="font-medium">{item.rating}</span></div>
                    <div className="flex items-center justify-between">
                      <div><span className="text-2xl font-bold text-green-600">₹{item.price}</span><span className="text-gray-500 text-sm">/{item.unit}</span></div>
                      <Button onClick={() => setSelectedEquipment(item)} size="sm">Book Now</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
      {selectedEquipment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
            <button onClick={() => setSelectedEquipment(null)} className="absolute top-4 right-4"><X className="w-6 h-6" /></button>
            <h2 className="text-2xl font-bold mb-4">Book Equipment</h2>
            <img src={selectedEquipment.image} alt={selectedEquipment.name} className="w-full h-48 object-cover rounded-xl mb-4" />
            <h3 className="font-semibold">{selectedEquipment.name}</h3>
            <div className="space-y-4 my-6">
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input type="date" value={bookingDates.start} onChange={(e) => setBookingDates({ ...bookingDates, start: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input type="date" value={bookingDates.end} onChange={(e) => setBookingDates({ ...bookingDates, end: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 mb-6 flex justify-between">
              <div><p className="font-medium">Estimated Total</p><p className="text-sm text-gray-500">Includes 20% security</p></div>
              <p className="text-2xl font-bold text-green-600">₹{calculateTotal().toLocaleString()}</p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setSelectedEquipment(null)} variant="outline" className="flex-1">Cancel</Button>
              <Button className="flex-1">Confirm Booking</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
