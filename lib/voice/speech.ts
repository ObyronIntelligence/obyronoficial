// ============================================
// OBYRON NEURAL — VOICE ENGINE
// Speech Recognition + Speech Synthesis
// ============================================

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

export interface VoiceCallbacks {
  onTranscript: (text: string, isFinal: boolean) => void;
  onStateChange: (state: VoiceState) => void;
  onError: (error: string) => void;
}

/**
 * Gerenciador de reconhecimento de voz (Speech-to-Text)
 */
export class SpeechEngine {
  private recognition: any = null;
  private callbacks: VoiceCallbacks;
  private isListening = false;

  constructor(callbacks: VoiceCallbacks) {
    this.callbacks = callbacks;
  }

  init(): boolean {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this.callbacks.onError("SpeechRecognition não suportado neste navegador.");
      return false;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "pt-BR";
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      let transcript = "";
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) isFinal = true;
      }

      this.callbacks.onTranscript(transcript, isFinal);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Não mudar o estado aqui — o componente controla
    };

    this.recognition.onerror = (event: any) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        this.callbacks.onError(`Erro de reconhecimento: ${event.error}`);
      }
      this.isListening = false;
    };

    return true;
  }

  startListening() {
    if (!this.recognition) return;
    if (this.isListening) return;

    try {
      this.isListening = true;
      this.callbacks.onStateChange("listening");
      this.recognition.start();
    } catch (e) {
      this.isListening = false;
    }
  }

  stopListening() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch {}
    this.isListening = false;
  }

  getIsListening() {
    return this.isListening;
  }
}

/**
 * Text-to-Speech com voz configurável
 */
export class VoiceSynthesizer {
  private synth: SpeechSynthesis | null = null;
  private voice: SpeechSynthesisVoice | null = null;
  private onEndCallback: (() => void) | null = null;

  init() {
    if (typeof window === "undefined") return;
    this.synth = window.speechSynthesis;

    // Carregar vozes (precisa de um delay em alguns browsers)
    const loadVoices = () => {
      const voices = this.synth!.getVoices();
      // Prioridade: voz pt-BR masculina → qualquer pt-BR → inglês
      this.voice =
        voices.find((v) => v.lang.startsWith("pt-BR") && v.name.toLowerCase().includes("male")) ||
        voices.find((v) => v.lang.startsWith("pt-BR")) ||
        voices.find((v) => v.lang.startsWith("pt")) ||
        voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("male")) ||
        voices[0] || null;
    };

    loadVoices();
    this.synth.onvoiceschanged = loadVoices;
  }

  speak(text: string, onEnd?: () => void) {
    if (!this.synth) return;

    // Cancelar fala anterior
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1.7;   // Muito mais rápido (1.0 é o padrão, 1.7 é bem acelerado)
    utterance.pitch = 0.85;
    utterance.volume = 1.0;

    if (this.voice) {
      utterance.voice = this.voice;
    }

    utterance.onend = () => {
      onEnd?.();
    };

    this.synth.speak(utterance);
  }

  stop() {
    this.synth?.cancel();
  }

  isSpeaking(): boolean {
    return this.synth?.speaking ?? false;
  }
}

/**
 * Audio Analyzer — captura amplitude do microfone para a orbe
 */
export class AudioAnalyzer {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;

  async init(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
      return true;
    } catch (e) {
      console.error("[AudioAnalyzer] Erro ao acessar microfone:", e);
      return false;
    }
  }

  /**
   * Retorna amplitude normalizada (0.0 → 1.0)
   */
  getAmplitude(): number {
    if (!this.analyser || !this.dataArray) return 0;

    this.analyser.getByteFrequencyData(this.dataArray);

    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }

    return sum / (this.dataArray.length * 255);
  }

  disconnect() {
    this.source?.disconnect();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
  }
}
