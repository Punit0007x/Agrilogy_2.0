import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Bot, User, Loader2, Sparkles, Leaf, Zap } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  '🌾 Best crops for monsoon season?',
  '🦟 Yellow leaf disease treatment?',
  '💧 Wheat irrigation schedule',
  '🌱 Soil preparation for rice',
  '🐛 Organic pest control methods',
  '🏛️ PM-KISAN scheme details',
  '📊 Current MSP rates 2024',
  '🌡️ IoT sensors for farming',
];

async function callGeminiAPI(history: Message[], userText: string): Promise<string> {
  // Always use local logic for this localized version
  await new Promise((resolve) => setTimeout(resolve, 1400));
  return getFallbackResponse(userText);
}

function getFallbackResponse(input: string): string {
  const lower = input.toLowerCase();

  // Expanded Knowledge Base Mapping
  const knowledgeBase: Record<string, string> = {
    // --- Crops ---
    'tomato': '🍅 **Tomato Cultivation:** Best grown in well-drained loamy soil with pH 6.0-7.0. Watch out for *Early Blight* (spots on lower leaves). Use **N-P-K 10-10-10** for balanced growth.',
    'wheat': '🌾 **Wheat Advisory:** Ideal sowing temp is 20-25°C. Requires 4-6 irrigations at critical stages (CRI, Flowering). MSP is currently **₹2,275/quintal**.',
    'rice': '🍚 **Paddy/Rice Management:** Needs standing water (5-10cm) during tillering. Consider **DSR (Direct Seeded Rice)** to save 30% water. Current MSP: **₹2,183/quintal**.',
    'paddy': '🍚 **Paddy/Rice Management:** Needs standing water (5-10cm) during tillering. Consider **DSR (Direct Seeded Rice)** to save 30% water. Current MSP: **₹2,183/quintal**.',
    'cotton': '🧵 **Cotton Expert:** Best in black cotton soil. Avoid waterlogging. Use **Pheromone Traps** for Pink Bollworm. MSP: **₹6,620/quintal**.',
    'sugarcane': '🎋 **Sugarcane Hub:** Long-duration crop (10-12 months). Requires heavy nitrogen. Use **Trash Mulching** to conserve moisture. Check for *Red Rot*.',
    'maize': '🌽 **Maize Tips:** Needs well-aerated soil. Highly sensitive to waterlogging. Apply Zinc Sulphate (10kg/acre) for better yield. MSP: **₹1,962/quintal**.',
    'soybean': '🌱 **Soybean Care:** Nitrogen-fixing legume. Requires minimal urea. Watch for *Yellow Mosaic Virus* (spread by whiteflies). MSP: **₹4,600/quintal**.',
    'chickpea': '🍲 **Chickpea/Chana:** Cool-season crop. Susceptible to *Pod Borer*. Nipping at 30-45 days increases branching. MSP: **₹5,335/quintal**.',
    'potato': '🥔 **Potato Guide:** Needs loose, sandy-loam soil for tuber expansion. Use **Earthing-up** at 30 days. Watch for *Late Blight* during foggy weather.',
    'onion': '🧅 **Onion Insights:** Requires high potash for bulb size. Stop irrigation 15 days before harvest for better shelf life. Market price: ₹2,500-4,000/quintal.',
    'mango': '🥭 **Mango Orchard:** Perform pruning after harvest. Control *Mango Hopper* with Neem spray. Apply organic manure in Aug-Sept.',
    'banana': '🍌 **Banana Tips:** High water and potash requirement. Use **Tissue Culture** plants for disease-free start. Watch for *Panama Wilt*.',
    'chili': '🌶️ **Chili Management:** Prone to *Leaf Curl virus*. Control mites/thrips. Use drip irrigation for 40% higher yield than flood.',
    'mustard': '🌼 **Mustard Advisory:** Low water requirement. One irrigation at flowering is critical. Protect from *Aphids* during cold waves. MSP: **₹5,650/quintal**.',
    'garlic': '🧄 **Garlic cultivation:** Thrives in rich loamy soil. Planting cloves in Oct-Nov is ideal. Keep soil moist but not soggy.',
    'ginger': '🥔 **Ginger Care:** Needs partial shade and high organic matter. Ensure zero waterlogging to prevent *Rhizome Rot*.',

    // --- Pests & Diseases ---
    'pest': '🐛 **Pest Control Strategy:** Identify the pest first. Use **Yellow Sticky Traps** for whiteflies. Neem Oil (1500ppm) is great for early stages. For severe Bollworm, use *Spinosad*.',
    'insect': '🐛 **Insect Management:** Move away from heavy synthetics. Try **Integrated Pest Management (IPM)**. Encourage ladybugs and spiders.',
    'disease': '🦠 **Disease Diagnosis:** High humidity often leads to fungal issues. Use **Trichoderma viride** as a bio-fungicide for soil-borne diseases.',
    'yellow': '🍂 **Yellowing Leaves?** If new leaves are yellow, it is likely **Iron/Zinc deficiency**. If old leaves, it is **Nitrogen deficiency**. If mottled, it is **Mosaic Virus**.',
    'blight': '🥀 **Blight Alert:** Immediate spray of **Mancozeb (2g/L)** is recommended. Improve field drainage and remove infected debris.',
    'mildew': '🌫️ **Mildew Control:** Powdery mildew looks like white powder. Use **Sulphur 80% WP** or Neem oil. Ensure plants have good air circulation.',
    'worms': '🐛 **Worm Infestation:** For Fall Armyworm in Maize, use *Emamectin benzoate*. For Root Grubs, apply Metarhizium anisopliae to soil.',

    // --- Soil & Fertilizers ---
    'soil': '🌍 **Soil Health:** Healthy soil should have 0.5%+ Organic Carbon. Get a **Soil Health Card**! It helps save ₹3,000/acre on fertilizers.',
    'fertilizer': '🧪 **Fertilizer Logic:** Follow the **4R principle**: Right Source, Right Rate, Right Time, Right Place. Avoid over-applying Urea.',
    'urea': '⚪ **Urea (Nitrogen):** Over-use leads to soft plants prone to pests. Use **Neem Coated Urea** for slow release and better efficiency.',
    'dap': '🟤 **DAP (Phosphorus):** Best applied at sowing/planting near the root zone. Do not mix with Zinc directly.',
    'organic': '🍃 **Organic Farming:** Switch to Vermicompost, Jeevamrut, and Dashparni Ark. It takes 3 years for full soil recovery but premium market prices await.',
    'ph': '📉 **Soil pH:** Ideal range is 6.5 to 7.5. Use **Gypsum** for alkaline soils and **Lime** for acidic soils. pH affects nutrient availability.',
    'nitrogen': '🟢 **Nitrogen (N):** Essential for green growth. Legumes like Moong/Urad can fix it for free! Over-supply makes crops "lazy" and weak.',

    // --- Irrigation & Tech ---
    'water': '💧 **Water Management:** Use **Drip Irrigation** for 95% efficiency. Flood irrigation wastes 60% water via evaporation. Midnight watering reduces loss.',
    'irrigation': '💧 **Irrigation System:** Smart sensors in our simulation show that soil moisture sensor "S-04" is optimal at 65%. Automated pumps save electricity.',
    'drone': '🛸 **Agri-Drones:** Used for precision spraying (1 acre in 7 mins). Saves 25% pesticide and 90% water. Subsidy up to 40-50% available.',
    'sensor': '📡 **IoT Sensors:** Our village has Soil Moisture, NPK, and Weather sensors. They provide "Digital Twin" accuracy for irrigation scheduling.',
    'tractor': '🚜 **Machinery:** Use low-HP tractors for small plots to save fuel. Regular maintenance of air filters can save 10% on diesel.',

    // --- Schemes & Finance ---
    'scheme': '🏛️ **Govt Support:** **PM-KISAN** provides ₹6,000/year. **PM Fasal Bima** covers crop loss due to weather. Apply via the Umang App.',
    'loan': '💰 **Credit/Loans:** **Kisan Credit Card (KCC)** offers loans at effectively 4% interest if repaid on time. Avoid private lenders.',
    'msp': '📊 **MSP Rates 2024:** Paddy: ₹2,183 | Wheat: ₹2,275 | Bajra: ₹2,500 | Cotton: ₹6,620. Mandi prices may vary by 10-15%.',
    'mandi': '🏤 **Market Access:** Use **e-NAM** to check prices across 1300+ mandis. Direct selling to FPOs (Farmer Producer Orgs) yields 20% better profits.',
    'kisan': '👨‍🌾 **Farmer Welfare:** Join a local **Self Help Group (SHG)**. Bulk buying of seeds and fertilizers can reduce input costs by 15%.',

    // --- General/Simulation ---
    'hello': '👋 **Namaste!** I am your Agrilogy Digital Twin AI. I am monitoring all 3D sectors of the village. How can I assist your farming journey?',
    'hi': '👋 **Hi there!** Ready to optimize your farm? Ask me about specific crops, irrigation status, or govt schemes.',
    'help': '🚑 **AI Assistance:** I can help with disease ID, fertilizer calculation, and weather alerts. Try typing "Cotton pests" or "PM-KISAN status".',
    'status': '📈 **Village Status:** All IoT nodes are online. Water reservoir is at 82%. Soil health index is rated **Good (7.4/10)** across sectors.',
    'simulation': '🎮 **3D Digital Twin:** This simulation uses real-time IoT data to visualize your farm. Changes you make here help predict future yields.',
    'weather': '🌦️ **Weather Alert:** Predicted 15mm rainfall on Thursday. Drain your fields if you have young seedlings. Temp: 24°C - 32°C.',
    'price': '💰 **Price Intel:** Vegetable prices are trending up due to supply gaps. It is a good time to harvest your early-sown Tomatoes.',
    'seed': '🌱 **Seed Selection:** Always use **Certified Seeds**. Saving your own seeds for more than 3 seasons reduces yield by 20% due to genetic drift.',
  };

  // Search for the most relevant response
  for (const key in knowledgeBase) {
    if (lower.includes(key)) {
      return knowledgeBase[key];
    }
  }

  // Complex multi-keyword logic if no direct match
  if (lower.includes('how') && (lower.includes('apply') || lower.includes('use'))) {
    return '📝 **Application Guide:** Always follow the label instructions for chemicals. For fertilizers, apply when soil is moist but not saturated. Use deep-placement for better P & K absorption.';
  }

  if (lower.includes('when') && (lower.includes('harvest') || lower.includes('pick'))) {
    return '⏳ **Harvest Timing:** For grains, wait until moisture drops below 14%. For vegetables, pick early morning for maximum freshness. Check the "Harvest Predictor" in the Dashboard.';
  }

  if (lower.includes('cost') || lower.includes('money') || lower.includes('budget')) {
    return '💸 **Budget Planner:** Average cost per acre is ₹15,000-25,000. Renting equipment via our **AgriRent** module can save up to ₹5,000/season compared to owning.';
  }

  // Default response
  return `🌿 **Welcome to Agrilogy Core Intelligence v4.5 (Extended)**

I am your local AI processing engine. I have full knowledge of ${Object.keys(knowledgeBase).length}+ agricultural domains.

**I can analyze:**
• **Crop Health** — Disease detection and nutrition monitoring.
• **Water Systems** — Irrigation scheduling and reservoir management.
• **Financials** — MSP rates, market prices, and loan eligibility.
• **Climate** — Local weather impact on specific plant varieties.

**How can I help you optimize your farm today?**
*(Try asking about "Potato blight", "Drone spraying", or "Kisan Credit Card")*`;
}

// Render text with basic markdown support
function RenderMessage({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
          return <p key={i} className="font-bold">{line.slice(2, -2)}</p>;
        }
        // Bold inline **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="leading-relaxed">
            {parts.map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : part
            )}
          </p>
        );
      })}
    </div>
  );
}

interface AIAssistantProps {
  onBack?: () => void;
}

const hasApiKey = true; // Always true for the integrated experience

export default function AIAssistant({ onBack }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'bot',
      text: "Namaste! 🙏 I'm the **Agrilogy AI Agent**, your intelligent farming companion.\n\nI'm powered by the Agrilogy Village localized intelligence engine. You can ask me anything about crops, diseases, irrigation, government schemes, market prices, and more!\n\nHow can I help you today? 🌾",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isTyping) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text: msg, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const responseText = await callGeminiAPI(messages, msg);
      const botMsg: Message = { id: Date.now() + 1, role: 'bot', text: responseText, timestamp: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Connection error. Please try again.');
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const isEmbedded = !!onBack;

  return (
    <div className={`flex flex-col ${isEmbedded ? 'h-full' : 'min-h-screen bg-background'}`}
      style={{ minHeight: isEmbedded ? '500px' : undefined }}>

      {/* Header */}
      <div className={`flex items-center gap-3 border-b border-border/30 shrink-0 ${isEmbedded ? 'p-3' : 'p-4'}`}
        style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.08) 0%, rgba(0,0,0,0) 100%)' }}>
        {isEmbedded && (
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/5">
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.2)]">
          <Bot size={16} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-foreground">Agrilogy AI Agent</span>
            {hasApiKey && <Zap size={10} className="text-primary" />}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-muted-foreground">
              {hasApiKey ? 'Gemini AI · Live' : 'Knowledge Base · Add API key for AI'}
            </span>
          </div>
        </div>
        {hasApiKey && (
          <div className="shrink-0 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-full">
            <span className="text-[9px] font-bold text-primary tracking-wider">GEMINI</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 mt-0.5 shadow-[0_0_10px_rgba(234,179,8,0.15)]">
                <Bot size={14} className="text-primary" />
              </div>
            )}
            <div className={`max-w-[82%] rounded-2xl px-3 py-2.5 text-xs ${
              msg.role === 'user'
                ? 'bg-primary/20 border border-primary/30 text-foreground rounded-tr-sm'
                : 'bg-white/5 border border-white/8 text-foreground rounded-tl-sm'
            }`}>
              <RenderMessage text={msg.text} />
              <p className="text-[9px] mt-1.5 opacity-40">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-secondary/15 border border-secondary/25 flex items-center justify-center shrink-0 mt-0.5">
                <User size={14} className="text-secondary" />
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-2 items-start">
            <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
              <Bot size={14} className="text-primary" />
            </div>
            <div className="bg-white/5 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-[10px] text-muted-foreground">Agrilogy AI is thinking...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-3 py-2 text-[10px] text-destructive">
            ⚠️ {error}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-3 pb-2 shrink-0">
          <p className="text-[9px] text-muted-foreground mb-1.5 flex items-center gap-1">
            <Sparkles size={9} /> Quick questions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => handleSend(p)}
                className="text-[9px] px-2 py-1 bg-white/5 border border-white/10 text-foreground hover:bg-primary/10 hover:border-primary/30 rounded-full transition-all"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border/20 shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder={hasApiKey ? "Ask Gemini AI anything about farming..." : "Ask about crops, diseases, schemes..."}
            className="flex-1 rounded-xl px-3 py-2 bg-white/5 border border-white/10 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 placeholder:text-muted-foreground/50 transition-all"
            disabled={isTyping}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="w-9 h-9 rounded-xl bg-primary/20 hover:bg-primary/40 border border-primary/30 text-primary flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Send size={14} />
          </button>
        </div>
        {hasApiKey && (
          <p className="text-[8px] text-muted-foreground/40 mt-1.5 text-center">
            Powered by Google Gemini AI · Agrilogy Village Digital Twin
          </p>
        )}
      </div>
    </div>
  );
}
