// lib/crossfade.ts

export interface CrossfadeConfig {
  duration: number; // crossfade duration in seconds
  prebufferTime: number; // seconds before end to start buffering
  onCrossfadeStart?: () => void;
  onCrossfadeEnd?: () => void;
}

export class CrossfadeController {
  private primaryAudio: HTMLAudioElement | null = null;
  private secondaryAudio: HTMLAudioElement | null = null;
  private animationFrame: number | null = null;
  private config: CrossfadeConfig;
  private isCrossfading = false;
  private crossfadeStartTime = 0;
  constructor(config: CrossfadeConfig) {
    this.config = config;
  }

  setAudioElements(primary: HTMLAudioElement, secondary: HTMLAudioElement): void {
    this.primaryAudio = primary;
    this.secondaryAudio = secondary;
  }

  startCrossfade(): void {
    if (!this.primaryAudio || !this.secondaryAudio || this.isCrossfading) {
      return;
    }

    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
    }

    this.isCrossfading = true;
    this.crossfadeStartTime = performance.now();
    this.config.onCrossfadeStart?.();

    // Ensure secondary starts from 0
    this.secondaryAudio.currentTime = 0;
    this.secondaryAudio.volume = 0;
    
    // Start playback
    const playPromise = this.secondaryAudio.play();
    
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.error('Crossfade playback failed:', error);
        this.cancelCrossfade();
      });
    }

    this.animateCrossfade();
  }

  private animateCrossfade(): void {
    if (!this.primaryAudio || !this.secondaryAudio || !this.isCrossfading) {
      return;
    }

    const elapsed = (performance.now() - this.crossfadeStartTime) / 1000;
    const progress = Math.min(elapsed / this.config.duration, 1);

    // Exponential easing for smoother transition
    const easeProgress = this.easeInOutQuad(progress);

    // Ramp volumes
    this.primaryAudio.volume = Math.max(0, 1 - easeProgress);
    this.secondaryAudio.volume = Math.min(1, easeProgress);

    if (progress < 1) {
      this.animationFrame = requestAnimationFrame(() => this.animateCrossfade());
    } else {
      this.completeCrossfade();
    }
  }

  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  private completeCrossfade(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.isCrossfading = false;
    this.config.onCrossfadeEnd?.();
  }

  cancelCrossfade(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.isCrossfading = false;

    // Restore volumes
    if (this.primaryAudio) {
      this.primaryAudio.volume = 1;
    }
    if (this.secondaryAudio) {
      this.secondaryAudio.volume = 0;
      this.secondaryAudio.pause();
    }
  }

  isActive(): boolean {
    return this.isCrossfading;
  }

  destroy(): void {
    this.cancelCrossfade();
    this.primaryAudio = null;
    this.secondaryAudio = null;
  }
}