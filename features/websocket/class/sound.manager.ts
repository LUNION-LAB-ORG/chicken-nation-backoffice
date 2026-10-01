

class SoundManager {
    private audio: HTMLAudioElement | null = null;
    private intervalId: NodeJS.Timeout | null = null;
    private isPlaying = false;

    constructor(private config: {
        src: string;
        mode: 'once' | 'repeat';
        interval?: number;
    }) { }

    /**
     * Joue le son. Renvoie `false` si le navigateur refuse la lecture (aucun
     * geste de l'utilisateur depuis le chargement de la page) : l'appelant
     * peut alors proposer « Activer le son ». `true` si le son joue, ou
     * jouait déjà.
     */
    async play(condition?: () => boolean): Promise<boolean> {
        if (typeof window === 'undefined') return false;
        // Anti-re-jeu pour LES DEUX modes : le moteur rappelle play() à chaque changement de
        // store tant que la condition est vraie. Sans ce garde, un son `once` se rejouerait à
        // chaque tick. Il ne se réarme qu'après un stop() (condition redevenue fausse).
        if (this.isPlaying) return true;

        this.audio = new Audio(this.config.src);
        this.audio.currentTime = 0;
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

        try {
            await this.audio.play();
            return true;
        } catch (error) {
            console.error(error);
            // Refus : un son `once` se réarme, sinon il resterait muet jusqu'au
            // prochain stop(). Un son `repeat` garde sa minuterie, qui retente
            // seule à chaque tour : la relancer ici en créerait une seconde.
            if (this.config.mode === 'once') this.isPlaying = false;
            return false;
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
