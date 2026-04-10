import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useVillageStore } from '@/store/villageStore';
import { useIsMobile } from '@/hooks/use-mobile';

// Web Audio API ambient sound system — no external files needed
// Generates all sounds procedurally

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// Create gentle wind noise
function createWindNode(ctx: AudioContext): { node: AudioNode; gain: GainNode } {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Brownian noise (smoother than white for wind)
  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (last + 0.03 * white) / 1.03;
    last = data[i];
    data[i] *= 3.5;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // Bandpass for wind character
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 400;
  filter.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  source.connect(filter);
  filter.connect(gain);
  source.start();

  return { node: gain, gain };
}

// Create bird chirp using oscillators
function playBirdChirp(ctx: AudioContext, masterGain: GainNode) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  // Random bird frequency
  const baseFreq = 1800 + Math.random() * 2500;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, now);

  // Quick chirp modulation
  const chirpCount = 1 + Math.floor(Math.random() * 3);
  const chirpDuration = 0.06 + Math.random() * 0.04;

  for (let i = 0; i < chirpCount; i++) {
    const t = now + i * (chirpDuration + 0.02);
    osc.frequency.setValueAtTime(baseFreq + Math.random() * 500, t);
    osc.frequency.linearRampToValueAtTime(baseFreq - 200 + Math.random() * 400, t + chirpDuration);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.02, t + 0.01);
    gain.gain.linearRampToValueAtTime(0, t + chirpDuration);
  }

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + chirpCount * (chirpDuration + 0.02) + 0.1);
}

// Create rain patter using filtered noise
function createRainNode(ctx: AudioContext): { node: AudioNode; gain: GainNode } {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Pink-ish noise for rain
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    data[i] = (b0 + b1 + b2 + white * 0.5362) * 0.11;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  // High-pass for crisp rain
  const hiPass = ctx.createBiquadFilter();
  hiPass.type = 'highpass';
  hiPass.frequency.value = 2000;
  hiPass.Q.value = 0.3;

  // Low-pass to tame harshness
  const loPass = ctx.createBiquadFilter();
  loPass.type = 'lowpass';
  loPass.frequency.value = 8000;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  source.connect(hiPass);
  hiPass.connect(loPass);
  loPass.connect(gain);
  source.start();

  return { node: gain, gain };
}

function createMobileWindNode(ctx: AudioContext): { node: AudioNode; gain: GainNode } {
  const bufferSize = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  let last = 0;
  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (last + white * 0.02) / 1.02;
    last = data[i];
    data[i] *= 2.0;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const lowPass = ctx.createBiquadFilter();
  lowPass.type = 'lowpass';
  lowPass.frequency.value = 500;
  lowPass.Q.value = 0.4;

  const gain = ctx.createGain();
  gain.gain.value = 0;

  source.connect(lowPass);
  lowPass.connect(gain);
  source.start();

  return { node: gain, gain };
}

export function SoundSystem() {
  const introComplete = useVillageStore((s) => s.introComplete);
  const isRaining = useVillageStore((s) => s.isRaining);
  const timeOfDay = useVillageStore((s) => s.timeOfDay);
  const isMobile = useIsMobile();

  const initialized = useRef(false);
  const windGainRef = useRef<GainNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const lastBirdTime = useRef(0);
  const cleanupRefs = useRef<AudioBufferSourceNode[]>([]);

  // Initialize audio on first user interaction and keep it active during loading.
  useEffect(() => {
    if (initialized.current) return;

    const initAudio = () => {
      if (initialized.current) return;
      initialized.current = true;

      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      const masterGain = ctx.createGain();
      masterGain.gain.value = isMobile ? 2.2 : 6.0;
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      const wind = isMobile ? createMobileWindNode(ctx) : createWindNode(ctx);
      wind.gain.connect(masterGain);
      windGainRef.current = wind.gain;
      cleanupRefs.current.push(wind.node as AudioBufferSourceNode);

      if (!isMobile) {
        const rain = createRainNode(ctx);
        rain.gain.connect(masterGain);
        rainGainRef.current = rain.gain;
        cleanupRefs.current.push(rain.node as AudioBufferSourceNode);
      }
    };

    const handler = () => {
      initAudio();
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
    };

    window.addEventListener('click', handler);
    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
      cleanupRefs.current.forEach((source) => {
        try {
          source.stop();
        } catch {
          // ignore already stopped nodes
        }
      });
      cleanupRefs.current = [];
    };
  }, [isMobile]);

  // Update ambient sounds based on game state
  useFrame((state) => {
    if (!initialized.current) return;

    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Wind volume based on time (stronger at dusk/dawn, present during loading)
    if (windGainRef.current) {
      const baseWind = introComplete ? (isMobile ? 0.03 : 0.05) : (isMobile ? 0.02 : 0.07);
      const windTarget = isRaining ? (isMobile ? 0.09 : 0.14) : baseWind + Math.abs(timeOfDay - 0.5) * (isMobile ? 0.02 : 0.04);
      windGainRef.current.gain.linearRampToValueAtTime(windTarget, now + 0.5);
    }

    // Rain
    if (rainGainRef.current) {
      const rainTarget = isRaining ? 0.14 : 0;
      rainGainRef.current.gain.linearRampToValueAtTime(rainTarget, now + 1);
    }

    // Bird chirps (daytime only, random intervals)
    const isDay = timeOfDay > 0.28 && timeOfDay < 0.72;
    const elapsed = state.clock.elapsedTime;

    if (!isMobile && isDay && !isRaining && masterGainRef.current && elapsed - lastBirdTime.current > 2 + Math.random() * 5) {
      lastBirdTime.current = elapsed;
      playBirdChirp(ctx, masterGainRef.current);
    }
  });

  return null;
}
