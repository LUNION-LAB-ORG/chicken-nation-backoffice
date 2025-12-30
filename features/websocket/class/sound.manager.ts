class SoundManager {
    private audio: HTMLAudioElement | null = null;
    private intervalId: NodeJS.Timeout | null = null;
    private isPlaying = false;

    constructor(private config: {
        src: string;
        mode: 'once' | 'repeat';
        interval?: number;
    }) { }

    play(condition?: () => boolean) {
        if (typeof window === 'undefined') return;
        if (this.isPlaying && this.config.mode === 'repeat') return;

        this.audio = new Audio(this.config.src);
        this.audio.currentTime = 0;
        this.audio.play().catch(console.error);

        this.isPlaying = true;

        if (this.config.mode === 'repeat') {
            this.intervalId = setInterval(() => {
                if (condition && !condition()) {
                    this.stop();
                    return;
                }

                this.audio!.currentTime = 0;
                this.audio!.play().catch(console.error);
            }, this.config.interval ?? 3000);
        }
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
        }

        this.isPlaying = false;
    }
}

export default SoundManager;
