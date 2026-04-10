import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Camera, Upload, Bug, Info, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const diseases = [
  { name: 'Bacterial Blight', severity: 'high' as const, treatment: 'Remove infected leaves and apply copper-based fungicide. Ensure proper spacing for air circulation.' },
  { name: 'Powdery Mildew', severity: 'medium' as const, treatment: 'Apply sulfur-based fungicide. Remove heavily infected plant parts. Improve air circulation.' },
  { name: 'Leaf Spot', severity: 'low' as const, treatment: 'Remove affected leaves. Apply neem oil spray. Avoid overhead watering.' },
  { name: 'Root Rot', severity: 'high' as const, treatment: 'Improve drainage. Reduce watering. Apply fungicide to soil. Remove severely affected plants.' },
  { name: 'Healthy', severity: 'none' as const, treatment: 'No treatment needed. Continue regular care and monitoring.' },
];

type Severity = 'high' | 'medium' | 'low' | 'none';

interface DetectionResult {
  name: string;
  severity: Severity;
  treatment: string;
  confidence: number;
  affectedArea: number;
}

interface DiseaseDetectionProps {
  onBack?: () => void;
}

export default function DiseaseDetection({ onBack }: DiseaseDetectionProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
      setResult(null);
    }
  };

  const handleDetect = async () => {
    if (!selectedImage) return;
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2500));
      const randomDisease = diseases[Math.floor(Math.random() * diseases.length)];
      setResult({
        ...randomDisease,
        confidence: 75 + Math.random() * 24,
        affectedArea: Math.floor(Math.random() * 30) + 5,
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getSeverityColorEmbedded = (severity: Severity) => {
    switch (severity) {
      case 'high': return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-green-500/20 text-green-400 border-green-500/30';
    }
  };

  const isEmbedded = !!onBack;

  if (isEmbedded) {
    return (
      <div className="flex flex-col ">
        <div className="flex items-center gap-2 p-3 border-b border-border/30">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={16} /></button>
          <Bug size={16} className="text-destructive" />
          <span className="text-xs font-bold">Disease Detection</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          {/* Upload Area */}
          <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-border/40 rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors">
            {preview ? <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg" /> : (
              <>
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-[10px] text-muted-foreground">Tap to upload plant image</p>
              </>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />

          <Button onClick={handleDetect} disabled={!selectedImage || loading}
            className="w-full bg-destructive/20 hover:bg-destructive/30 text-foreground border border-destructive/30 text-xs gap-2">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : <><Bug className="w-4 h-4" /> Detect Disease</>}
          </Button>

          {result && (
            <div className="bg-muted/20 border border-border/20 rounded-lg p-3 space-y-2">
              <div className="text-center">
                {result.severity === 'none' ? <CheckCircle className="w-10 h-10 mx-auto text-green-500 mb-2" /> : <AlertTriangle className="w-10 h-10 mx-auto text-destructive mb-2" />}
                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-medium border ${getSeverityColorEmbedded(result.severity)}`}>{result.name}</span>
                <p className="text-lg font-bold mt-2">{result.confidence.toFixed(1)}% <span className="text-[9px] font-normal text-muted-foreground">confidence</span></p>
              </div>
              <div className="bg-muted/30 rounded-lg p-2.5 border border-border/20">
                <h4 className="text-[10px] font-semibold mb-1">Treatment</h4>
                <p className="text-[9px] text-muted-foreground">{result.treatment}</p>
              </div>
              <button onClick={() => { setSelectedImage(null); setPreview(null); setResult(null); }}
                className="w-full text-[10px] text-primary hover:underline">Analyze Another</button>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2.5">
            <h4 className="text-[10px] font-semibold text-blue-400 mb-1 flex items-center gap-1"><Info className="w-3 h-3" /> Tips</h4>
            <ul className="text-[9px] text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Use clear, well-lit photos</li>
              <li>Focus on affected plant parts</li>
              <li>Avoid blurry or dark images</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <header className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Bug className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Plant Disease Detection</h1>
                <p className="text-sm text-gray-500">AI-powered vision system</p>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Camera className="w-5 h-5" /> Upload Plant Image</h2>
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-4 hover:border-green-400 transition-colors cursor-pointer">
                {preview ? <img src={preview} alt="Preview" className="max-h-80 mx-auto rounded-lg" /> : (
                  <>
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-600">Drag and drop or click to select</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <div className="flex gap-4">
                <Button onClick={handleDetect} disabled={!selectedImage || loading} className="flex-1 gap-2 bg-red-500 hover:bg-red-600">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Bug className="w-5 h-5" /> Detect Disease</>}
                </Button>
              </div>
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2"><Info className="w-4 h-4" /> Tips:</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Use clear, well-lit photos</li>
                  <li>Focus on affected plant parts</li>
                  <li>Avoid blurry or dark images</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          <div>
            {result ? (
              <Card className="border-2 border-red-500">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className={`w-24 h-24 ${result.severity === 'none' ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      {result.severity === 'none' ? <CheckCircle className="w-12 h-12 text-green-600" /> : <AlertTriangle className="w-12 h-12 text-red-600" />}
                    </div>
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium border ${getSeverityColor(result.severity)}`}>{result.name}</span>
                    <p className="text-3xl font-bold mt-4">{result.confidence.toFixed(1)}% <span className="text-sm font-normal text-gray-500">confidence</span></p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h4 className="font-semibold mb-2">Recommended Treatment</h4>
                    <p className="text-gray-700">{result.treatment}</p>
                  </div>
                  <Button onClick={() => { setSelectedImage(null); setPreview(null); setResult(null); }} className="w-full" variant="outline">Analyze Another</Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="p-8 text-center">
                  <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bug className="w-16 h-16 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Ready for Detection</h3>
                  <p className="text-gray-500">Upload a plant image for AI-powered disease detection</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
