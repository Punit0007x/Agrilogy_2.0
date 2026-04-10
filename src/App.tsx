import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import AIAssistant from "./pages/AIAssistant";
import CropRecommendation from "./pages/CropRecommendation";
import DiseaseDetection from "./pages/DiseaseDetection";
import IoTDashboard from "./pages/IoTDashboard";
import EquipmentRent from "./pages/EquipmentRent";
import NewsPage from "./pages/NewsPage";
import SoilAnalysis from "./pages/SoilAnalysis";
import IrrigationPlanner from "./pages/IrrigationPlanner";
import CultivationWorkflow from "./pages/CultivationWorkflow";
import LoanApplication from "./pages/LoanApplication";
import LoanReview from "./pages/LoanReview";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/crop-recommendation" element={<CropRecommendation />} />
            <Route path="/disease-detection" element={<DiseaseDetection />} />
            <Route path="/iot-dashboard" element={<IoTDashboard />} />
            <Route path="/equipment-rent" element={<EquipmentRent />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/soil-analysis" element={<SoilAnalysis />} />
            <Route path="/irrigation" element={<IrrigationPlanner />} />
            <Route path="/cultivation-workflow" element={<CultivationWorkflow />} />
            <Route path="/loan-application" element={<LoanApplication />} />
            <Route path="/loan-review" element={<LoanReview />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
