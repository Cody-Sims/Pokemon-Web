import Phaser from 'phaser';
import { BGM, SFX } from '../../utils/audio-keys';

interface BGMMood {
  chords: number[][];
  duration: number;
  volume: number;
}

interface SFXProfile {
  startFreq: number;
  endFreq: number;
  duration: number;
  volume: number;
  waveform: 'sine' | 'square';
}

/** Generates placeholder audio buffers at runtime using Web Audio API.
 *  Call `registerPlaceholders()` in PreloadScene after normal asset loading
 *  so every BGM/SFX key resolves, even without real WAV files. */
export class ProceduralAudio {
  /** Register placeholder audio buffers for any BGM/SFX keys not yet loaded. */
  static registerPlaceholders(scene: Phaser.Scene): void {
    const webSound = scene.sound as Phaser.Sound.WebAudioSoundManager;
    if (!webSound?.context) return;
    const ctx = webSound.context;

    for (const key of Object.values(BGM)) {
      if (!scene.cache.audio.exists(key)) {
        const buffer = ProceduralAudio.generateBGM(ctx, key);
        scene.cache.audio.add(key, { audioBuffer: buffer });
      }
    }

    for (const key of Object.values(SFX)) {
      if (!scene.cache.audio.exists(key)) {
        const buffer = ProceduralAudio.generateSFX(ctx, key);
        scene.cache.audio.add(key, { audioBuffer: buffer });
      }
    }
  }

  /** Generate a BGM placeholder — a looping chord progression (4-8 seconds). */
  private static generateBGM(ctx: AudioContext, key: string): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const mood = ProceduralAudio.moodForBGM(key);
    const duration = mood.duration;
    const length = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    const chords = mood.chords;
    const chordLen = Math.floor(length / chords.length);

    for (let c = 0; c < chords.length; c++) {
      const freqs = chords[c];
      const offset = c * chordLen;
      for (let i = 0; i < chordLen && offset + i < length; i++) {
        const t = i / sampleRate;
        let sample = 0;
        for (const freq of freqs) {
          sample += Math.sin(2 * Math.PI * freq * t) * 0.15;
          sample += Math.sin(2 * Math.PI * freq * 2 * t) * 0.05;
        }
        // Fade envelope at chord boundaries
        const env = Math.min(
          i / (sampleRate * 0.05),
          1,
          (chordLen - i) / (sampleRate * 0.05),
        );
        data[offset + i] = sample * env * mood.volume;
      }
    }

    return buffer;
  }

  /** Generate an SFX placeholder — a short beep/chirp (100-500ms). */
  private static generateSFX(ctx: AudioContext, key: string): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const profile = ProceduralAudio.profileForSFX(key);
    const length = Math.floor(sampleRate * profile.duration);
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const progress = i / length;
      const freq =
        profile.startFreq +
        (profile.endFreq - profile.startFreq) * progress;
      let sample = Math.sin(2 * Math.PI * freq * t);

      if (profile.waveform === 'square') {
        sample = sample > 0 ? 1 : -1;
      }

      // Envelope: attack-sustain-release
      const attackEnd = 0.05;
      const releaseStart = 0.7;
      let env = 1;
      if (progress < attackEnd) {
        env = progress / attackEnd;
      } else if (progress > releaseStart) {
        env = 1 - (progress - releaseStart) / (1 - releaseStart);
      }

      data[i] = sample * env * profile.volume;
    }

    return buffer;
  }

  /** Choose chord progression and mood based on BGM key name. */
  private static moodForBGM(key: string): BGMMood {
    const happy: BGMMood = {
      chords: [
        [262, 330, 392],
        [294, 370, 440],
        [330, 415, 494],
        [294, 370, 440],
      ],
      duration: 6,
      volume: 0.6,
    };

    const spooky: BGMMood = {
      chords: [
        [220, 262, 330],
        [196, 233, 294],
        [185, 220, 277],
        [196, 233, 294],
      ],
      duration: 8,
      volume: 0.5,
    };

    const battle: BGMMood = {
      chords: [
        [330, 415, 494],
        [370, 466, 554],
        [392, 494, 587],
        [370, 466, 554],
      ],
      duration: 4,
      volume: 0.7,
    };

    const industrial: BGMMood = {
      chords: [
        [196, 247, 294],
        [220, 277, 330],
        [196, 247, 294],
        [185, 233, 277],
      ],
      duration: 4,
      volume: 0.6,
    };

    const calm: BGMMood = {
      chords: [
        [262, 330, 392],
        [247, 311, 370],
        [220, 277, 330],
        [247, 311, 370],
      ],
      duration: 6,
      volume: 0.5,
    };

    const cave: BGMMood = {
      chords: [
        [131, 165, 196],
        [147, 185, 220],
        [131, 165, 196],
        [123, 156, 185],
      ],
      duration: 8,
      volume: 0.4,
    };

    const victory: BGMMood = {
      chords: [
        [330, 415, 494],
        [349, 440, 523],
        [392, 494, 587],
        [440, 554, 659],
      ],
      duration: 4,
      volume: 0.7,
    };

    if (key.includes('battle') || key.includes('rival') || key.includes('gym'))
      return battle;
    if (key.includes('legendary') || key.includes('villain'))
      return { ...battle, volume: 0.75 };
    if (key.includes('spooky') || key.includes('wraithmoor')) return spooky;
    if (key.includes('cave') || key.includes('dungeon')) return cave;
    if (
      key.includes('industrial') ||
      key.includes('voltara') ||
      key.includes('cinderfall')
    )
      return industrial;
    if (key.includes('mountain') || key.includes('scalecrest')) return calm;
    if (key.includes('victory') || key.includes('credits')) return victory;
    if (key.includes('evolution')) return victory;
    if (
      key.includes('town') ||
      key.includes('pallet') ||
      key.includes('coastal') ||
      key.includes('harbor')
    )
      return calm;
    if (key.includes('pokemon-center')) return calm;
    if (key.includes('route')) return happy;
    if (key.includes('title')) return happy;

    return happy;
  }

  /** Choose SFX profile based on key name. */
  private static profileForSFX(key: string): SFXProfile {
    const click: SFXProfile = {
      startFreq: 800,
      endFreq: 600,
      duration: 0.1,
      volume: 0.3,
      waveform: 'sine',
    };
    const chime: SFXProfile = {
      startFreq: 600,
      endFreq: 1200,
      duration: 0.3,
      volume: 0.4,
      waveform: 'sine',
    };
    const beep: SFXProfile = {
      startFreq: 440,
      endFreq: 440,
      duration: 0.15,
      volume: 0.3,
      waveform: 'square',
    };
    const descend: SFXProfile = {
      startFreq: 800,
      endFreq: 300,
      duration: 0.25,
      volume: 0.35,
      waveform: 'sine',
    };
    const ascend: SFXProfile = {
      startFreq: 400,
      endFreq: 900,
      duration: 0.25,
      volume: 0.35,
      waveform: 'sine',
    };
    const hit: SFXProfile = {
      startFreq: 200,
      endFreq: 80,
      duration: 0.15,
      volume: 0.5,
      waveform: 'square',
    };
    const jingle: SFXProfile = {
      startFreq: 523,
      endFreq: 784,
      duration: 0.5,
      volume: 0.4,
      waveform: 'sine',
    };
    const step: SFXProfile = {
      startFreq: 150,
      endFreq: 80,
      duration: 0.1,
      volume: 0.2,
      waveform: 'sine',
    };

    if (key.includes('cursor')) return click;
    if (key.includes('confirm')) return chime;
    if (key.includes('cancel')) return descend;
    if (key.includes('error'))
      return { ...beep, startFreq: 200, endFreq: 200 };

    if (key.includes('hit') || key.includes('crit')) return hit;
    if (key.includes('faint')) return { ...descend, duration: 0.4 };
    if (key.includes('ball-throw')) return ascend;
    if (key.includes('ball-shake')) return { ...beep, duration: 0.2 };
    if (key.includes('catch')) return jingle;
    if (key.includes('exp-fill'))
      return { ...ascend, duration: 0.4, startFreq: 300, endFreq: 600 };
    if (key.includes('level-up')) return jingle;
    if (key.includes('stat-raise') || key.includes('stat-up')) return ascend;
    if (key.includes('stat-lower') || key.includes('stat-down'))
      return descend;
    if (key.includes('status-inflict'))
      return { ...beep, startFreq: 300, endFreq: 300, duration: 0.3 };
    if (key.includes('synthesis'))
      return { ...chime, startFreq: 500, endFreq: 1000, duration: 0.4 };
    if (key.includes('run-success')) return ascend;
    if (key.includes('run-fail')) return descend;
    if (key.includes('low-hp')) return beep;

    if (key.includes('item')) return chime;
    if (key.includes('badge')) return jingle;
    if (key.includes('heal')) return { ...jingle, duration: 0.4 };
    if (key.includes('save')) return chime;
    if (key.includes('pokedex'))
      return { ...jingle, startFreq: 600, endFreq: 900, duration: 0.35 };

    if (key.includes('door'))
      return { ...click, startFreq: 300, endFreq: 200, duration: 0.15 };
    if (key.includes('ledge')) return { ...descend, duration: 0.2 };
    if (key.includes('bump')) return { ...hit, volume: 0.25 };
    if (key.includes('encounter'))
      return { ...ascend, duration: 0.3, volume: 0.5 };

    if (key.includes('footstep')) return step;
    if (key.includes('splash'))
      return { ...step, startFreq: 300, endFreq: 100, duration: 0.15 };

    if (key.includes('pc-on')) return { ...ascend, duration: 0.2 };
    if (key.includes('pc-off')) return { ...descend, duration: 0.2 };

    return beep;
  }
}
