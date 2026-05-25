// Web Audio API Retro Sound Sinthesizer for interactive feedback
class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMute(muted: boolean) {
    this.isMuted = muted;
  }

  getMute(): boolean {
    return this.isMuted;
  }

  // Play a short synth beep
  playBeep(freq = 600, duration = 0.08, type: OscillatorType = 'sine') {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play failure:', e);
    }
  }

  // Play a double chirp for clicking/navigating
  playClick() {
    this.playBeep(800, 0.04, 'sine');
    setTimeout(() => this.playBeep(1100, 0.04, 'sine'), 40);
  }

  // Play the pleasant "Ding-Dong" chord for correct answers
  playCorrect() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      
      // Tone 1: E6 (1318 Hz)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.frequency.setValueAtTime(1046, now); // C6
      gain1.gain.setValueAtTime(0.1, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start();
      osc1.stop(now + 0.35);

      // Tone 2: G6 (1568 Hz) after 0.1s
      setTimeout(() => {
        if (!this.ctx) return;
        const o2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        o2.frequency.setValueAtTime(1318, this.ctx.currentTime);
        g2.gain.setValueAtTime(0.12, this.ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        o2.connect(g2);
        g2.connect(this.ctx.destination);
        o2.start();
        o2.stop(this.ctx.currentTime + 0.4);
      }, 100);

    } catch (e) {
      console.warn('Audio play failure:', e);
    }
  }

  // Play the deep flat buzzer drop for errors
  playWrong() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(150, now + 0.3);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.3);
    } catch (e) {
      console.warn('Audio play failure:', e);
    }
  }

  // Ink stamp thud sound
  playStamp() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Deep low impact thud
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(now + 0.25);

      // Squeaky friction noise of ink pressing
      setTimeout(() => {
        if (!this.ctx) return;
        const o2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        o2.type = 'sine';
        o2.frequency.setValueAtTime(450, this.ctx.currentTime);
        g2.gain.setValueAtTime(0.05, this.ctx.currentTime);
        g2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
        o2.connect(g2);
        g2.connect(this.ctx.destination);
        o2.start();
        o2.stop(this.ctx.currentTime + 0.08);
      }, 50);
    } catch (e) {
      console.warn('Audio play failure:', e);
    }
  }

  // Play ascending fanfare notes upon full completion
  playFanfare() {
    if (this.isMuted) return;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 0.15, 'triangle');
      }, idx * 130);
    });
    // Final joyful blast
    setTimeout(() => {
      this.playBeep(523.25, 0.4, 'sine');
      this.playBeep(659.25, 0.4, 'sine');
    }, notes.length * 130 + 10);
  }
}

export const audio = new RetroAudioEngine();
