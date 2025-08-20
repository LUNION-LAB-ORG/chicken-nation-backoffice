// types/window.d.ts
declare global {
    interface Window {
      flutter_inappwebview: {
        callHandler: (handlerName: string, ...args: any[]) => Promise<any>;
      };
    }
  }
  
  export {};