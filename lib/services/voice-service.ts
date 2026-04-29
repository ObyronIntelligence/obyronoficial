import {
  AudioAnalyzer,
  SpeechEngine,
  VoiceSynthesizer,
  type VoiceCallbacks,
  type VoiceState,
} from "@/lib/voice/speech";

class NeuralVoiceRuntime {
  private engine: SpeechEngine | null = null;
  private synthesizer: VoiceSynthesizer | null = null;
  private analyzer: AudioAnalyzer | null = null;
  private callbacks: VoiceCallbacks;

  constructor(callbacks: VoiceCallbacks) {
    this.callbacks = callbacks;
  }

  async initialize() {
    const engine = new SpeechEngine(this.callbacks);
    const speechEnabled = engine.init();
    this.engine = engine;

    const synthesizer = new VoiceSynthesizer();
    synthesizer.init();
    this.synthesizer = synthesizer;

    const analyzer = new AudioAnalyzer();
    const audioEnabled = await analyzer.init();
    this.analyzer = audioEnabled ? analyzer : null;

    return {
      speechEnabled,
      audioEnabled,
    };
  }

  startListening() {
    this.engine?.startListening();
  }

  stopListening() {
    this.engine?.stopListening();
  }

  speak(text: string, onEnd?: () => void) {
    this.synthesizer?.speak(text, onEnd);
  }

  stopSpeaking() {
    this.synthesizer?.stop();
  }

  getAudioLevel() {
    return this.analyzer?.getAmplitude() || 0;
  }

  isSpeaking() {
    return this.synthesizer?.isSpeaking() || false;
  }

  destroy() {
    this.engine?.stopListening();
    this.synthesizer?.stop();
    this.analyzer?.disconnect();
    this.engine = null;
    this.synthesizer = null;
    this.analyzer = null;
  }
}

export const voiceService = {
  create(callbacks: VoiceCallbacks) {
    return new NeuralVoiceRuntime(callbacks);
  },
  isBrowserSupported() {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  },
};

export type { VoiceState };

