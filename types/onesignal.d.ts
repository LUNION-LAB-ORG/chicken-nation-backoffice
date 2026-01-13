export { };

interface OneSignalInstance {
    init(options: { appId: string }): Promise<void>;
}

declare global {
    interface Window {
        OneSignalDeferred?: Array<(OneSignal: OneSignalInstance) => void>;
        OneSignal?: OneSignalInstance;
    }
}
