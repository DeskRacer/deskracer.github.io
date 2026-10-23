/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Motor synthesizer nodes
  private motorOsc1: OscillatorNode | null = null;
  private motorOsc2: OscillatorNode | null = null;
  private motorGain: GainNode | null = null;
  private motorFilter: BiquadFilterNode | null = null;

  // Tire skid synthesizer nodes
  private skidNode: AudioBufferSourceNode | null = null;
  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;

  // Master output
  private masterGain: GainNode | null = null;
  private initialized: boolean = false;

  constructor() {
    // Lazy initialize on first user interaction
  }

  public init() {
    if (this.initialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();

      // Master output
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 1. Motor Synthesis (Dual oscillator for electric RC brushless whine)
      this.motorOsc1 = this.ctx.createOscillator();
      this.motorOsc2 = this.ctx.createOscillator();
      this.motorOsc1.type = 'sawtooth';
      this.motorOsc2.type = 'triangle';

      this.motorFilter = this.ctx.createBiquadFilter();
      this.motorFilter.type = 'lowpass';
      this.motorFilter.frequency.setValueAtTime(600, this.ctx.currentTime);
      this.motorFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      this.motorGain = this.ctx.createGain();
      this.motorGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.motorOsc1.connect(this.motorFilter);
      this.motorOsc2.connect(this.motorFilter);
      this.motorFilter.connect(this.motorGain);
      this.motorGain.connect(this.masterGain);

      this.motorOsc1.start();
      this.motorOsc2.start();

      // 2. Tire Skid Noise Synthesis
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.skidNode = this.ctx.createBufferSource();
      this.skidNode.buffer = noiseBuffer;
      this.skidNode.loop = true;

      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = 'bandpass';
      this.skidFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      this.skidFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

      this.skidNode.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(this.masterGain);

      this.skidNode.start();

      this.initialized = true;
    } catch {
      // Audio not supported or blocked
    }
  }

  public updateMotor(rpm: number, speedRatio: number, isDrifting: boolean, slipRatio: number) {
    if (!this.initialized || !this.ctx || this.isMuted) return;

    const t = this.ctx.currentTime;
    const clampedRpm = Math.max(0.05, Math.min(1.0, rpm));

    // Base pitch for electric motor
    // 90Hz idle up to 720Hz high RPM + harmonic at 1.5x
    const baseFreq = 85 + clampedRpm * 580;
    if (this.motorOsc1 && this.motorOsc2) {
      this.motorOsc1.frequency.setTargetAtTime(baseFreq, t, 0.04);
      this.motorOsc2.frequency.setTargetAtTime(baseFreq * 1.5, t, 0.04);
    }

    if (this.motorFilter) {
      const cutoff = 400 + clampedRpm * 1800;
      this.motorFilter.frequency.setTargetAtTime(cutoff, t, 0.05);
    }

    if (this.motorGain) {
      const targetGain = 0.12 + clampedRpm * 0.28;
      this.motorGain.gain.setTargetAtTime(targetGain, t, 0.04);
    }

    // Tire Skid Synthesis
    if (this.skidGain && this.skidFilter) {
      const activeSlip = isDrifting || (slipRatio > 0.35 && speedRatio > 0.25);
      const targetSkidGain = activeSlip ? Math.min(0.42, slipRatio * speedRatio * 0.5) : 0;
      this.skidGain.gain.setTargetAtTime(targetSkidGain, t, 0.05);

      const targetFreq = 1200 + speedRatio * 800;
      this.skidFilter.frequency.setTargetAtTime(targetFreq, t, 0.05);
    }
  }

  public stopMotor() {
    if (this.motorGain && this.ctx) {
      this.motorGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    }
    if (this.skidGain && this.ctx) {
      this.skidGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
    }
  }

  public playCheckpointChime(isStartFinish: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    this.init();

    try {
      const t = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const f1 = isStartFinish ? 880 : 659.25; // E5 or A5
      const f2 = isStartFinish ? 1318.51 : 987.77; // E6 or B5

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(f1, t);
      osc2.frequency.setValueAtTime(f2, t);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.65);
      osc2.stop(t + 0.65);
    } catch {
      // Audio fallback
    }
  }

  public playCountdownBeep(isGo: boolean = false) {
    if (!this.ctx || this.isMuted) return;
    this.init();

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isGo ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isGo ? 880 : 440, t);

      const duration = isGo ? 0.6 : 0.22;
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(t);
      osc.stop(t + duration);
    } catch {
      // Audio fallback
    }
  }

  public playCollisionThud(intensity: number = 0.5) {
    if (!this.ctx || this.isMuted) return;
    this.init();

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.15);

      const vol = Math.min(0.4, 0.1 + intensity * 0.3);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    } catch {
      // Audio fallback
    }
  }

  public playVictoryFanfare() {
    if (!this.ctx || this.isMuted) return;
    this.init();

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const noteTimes = [0, 0.14, 0.28, 0.44];

    notes.forEach((freq, idx) => {
      try {
        if (!this.ctx) return;
        const t = this.ctx.currentTime + noteTimes[idx];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        const dur = idx === notes.length - 1 ? 0.8 : 0.22;
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        osc.connect(gain);
        gain.connect(this.masterGain || this.ctx.destination);

        osc.start(t);
        osc.stop(t + dur);
      } catch {
        // Audio fallback
      }
    });
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const soundEngine = new SoundEngine();
