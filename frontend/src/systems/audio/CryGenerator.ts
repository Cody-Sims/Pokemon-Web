import Phaser from 'phaser';

// ─── Waveform lookup ───

const WAVEFORMS: OscillatorType[] = ['square', 'sawtooth', 'triangle'];

// ─── CryGenerator Singleton ───

export class CryGenerator {
  private static instance: CryGenerator;
  private ctx: AudioContext | null = null;

  private constructor() {}

  static getInstance(): CryGenerator {
    if (!CryGenerator.instance) {
      CryGenerator.instance = new CryGenerator();
    }
    return CryGenerator.instance;
  }

  /** Grab the Web Audio context from Phaser's sound manager. */
  init(scene: Phaser.Scene): void {
    try {
      const webAudioManager = scene.sound as Phaser.Sound.WebAudioSoundManager;
      if (webAudioManager && webAudioManager.context) {
        this.ctx = webAudioManager.context;
      }
    } catch {
      // WebAudioSoundManager not available — cries will be silently skipped
      this.ctx = null;
    }
  }

  /**
   * Synthesise and play a unique cry for the given Pokémon dex number.
   * Same dex number always produces the same sound (deterministic).
   */
  async playCry(dexNumber: number, volume = 0.5): Promise<void> {
    if (!this.ctx) return;

    // Resume suspended context (browser autoplay policy)
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch {
        return;
      }
    }

    // AUDIT-054: Support dex numbers beyond Gen I (cap at 1010 for future expansion)
    const dex = Math.max(1, Math.min(1010, dexNumber));

    // ── Deterministic parameters seeded from dex number ──
    const baseFreq = 800 - (dex * 3) + ((dex * 7) % 200);
    const waveform = WAVEFORMS[dex % 3];
    const duration = 0.3 + (dex % 5) * 0.1;
    const segmentCount = (dex % 3 === 0) ? 3 : 2;

    const segmentFreqs = [
      baseFreq,
      baseFreq * (1.2 + (dex % 4) * 0.1),
      baseFreq * 0.8,
    ];

    const segmentDuration = duration / segmentCount;
    const lfoRate = 5 + (dex % 11);  // 5–15 Hz
    const lfoDepth = 20 + (dex % 31); // ±20–50 Hz

    const masterGain = this.ctx.createGain();
    masterGain.gain.value = Math.max(0, Math.min(1, volume));
    masterGain.connect(this.ctx.destination);

    const now = this.ctx.currentTime + 0.01;
    let lastOsc: OscillatorNode | null = null;

    for (let i = 0; i < segmentCount; i++) {
      const segStart = now + i * segmentDuration;
      const segEnd = segStart + segmentDuration;
      const freq = segmentFreqs[i];

      // Main oscillator
      const osc = this.ctx.createOscillator();
      osc.type = waveform;
      osc.frequency.setValueAtTime(freq, segStart);

      // LFO for vibrato
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = lfoRate;
      lfoGain.gain.value = lfoDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      // Amplitude envelope: 20ms attack, sustain, 50ms decay
      const envGain = this.ctx.createGain();
      const attackEnd = Math.min(segStart + 0.02, segEnd);
      const decayStart = Math.max(segEnd - 0.05, attackEnd);

      envGain.gain.setValueAtTime(0, segStart);
      envGain.gain.linearRampToValueAtTime(1, attackEnd);
      envGain.gain.setValueAtTime(1, decayStart);
      envGain.gain.linearRampToValueAtTime(0, segEnd);

      // Connect: osc → envelope → master gain → destination
      osc.connect(envGain);
      envGain.connect(masterGain);

      osc.start(segStart);
      osc.stop(segEnd);
      lfo.start(segStart);
      lfo.stop(segEnd);

      lastOsc = osc;
    }

    // Resolve when the last oscillator segment ends
    return new Promise<void>((resolve) => {
      if (lastOsc) {
        lastOsc.onended = () => {
          masterGain.disconnect();
          resolve();
        };
      } else {
        resolve();
      }
    });
  }
}
