import { useRef } from 'react';
import SoundManager from '../class/sound.manager';
import { SoundRulesConfig } from '../constantes/sound-rules.constante';

export const useSound = (
    config: SoundRulesConfig,
    disabled = false
) => {
    const managerRef = useRef<SoundManager | null>(null);

    if (!managerRef.current) {
        managerRef.current = new SoundManager(config);
    }

    const play = (condition?: () => boolean) => {
        if (disabled) return;
        managerRef.current?.play(condition);
    };

    const stop = () => {
        managerRef.current?.stop();
    };

    return {
        play,
        stop,
    };
};
