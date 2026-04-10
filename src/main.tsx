import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Suppress noisy third-party font warnings in the console
const originalDebug = console.debug;
console.debug = (...args) => {
  if (typeof args[0] === 'string' && (args[0].includes('unsupported GPOS') || args[0].includes('unsupported GSUB'))) {
    return;
  }
  originalDebug(...args);
};

createRoot(document.getElementById("root")!).render(<App />);
