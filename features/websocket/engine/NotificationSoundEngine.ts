import { SOUND_RULES } from '../constantes/sound-rules.constante';
import SoundManager from '../class/sound.manager';
import { useNotificationStateStore } from '../stores/notificationState.store';
import { SoundContext } from '../hooks/useSoundContext';

class NotificationSoundEngine {
  private managers = new Map<string, SoundManager>();
  private getContext!: () => SoundContext;

  constructor() {
    SOUND_RULES.forEach(rule => {
      this.managers.set(
        rule.id,
        new SoundManager({
          src: rule.src,
          mode: rule.mode,
          interval: rule.interval,
        })
      );
    });
  }

  /** 🔌 injection du contexte */
  setContextProvider(provider: () => SoundContext) {
    this.getContext = provider;
  }

  start() {
    useNotificationStateStore.subscribe((state) => {
      const ctx = this.getContext?.();
      if (!ctx) return;

      SOUND_RULES.forEach(rule => {
        const manager = this.managers.get(rule.id);
        if (!manager) return;

        if (rule.condition(state, ctx)) {
          manager.play(() =>
            rule.condition(
              useNotificationStateStore.getState(),
              ctx
            )
          );
        } else {
          manager.stop();
        }
      });
    });
  }
}

export const notificationSoundEngine = new NotificationSoundEngine();
