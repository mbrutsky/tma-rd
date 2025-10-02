interface Window {
  _originalFetch: typeof fetch;
  Telegram?: {
    WebApp: {
      initData: string;
      initDataUnsafe: any;
      ready: () => void;
      close: () => void;
      expand: () => void;
      showAlert: (message: string, callback?: () => void) => void;
      showPopup: (
        params: {
          title?: string;
          message: string;
          buttons?: Array<{ type: string; text?: string }>;
        },
        callback?: (buttonId: string) => void
      ) => void;
      HapticFeedback?: {
        notificationOccurred: (type: "error" | "success" | "warning") => void;
        impactOccurred: (style: "light" | "medium" | "heavy") => void;
      };
      MainButton: {
        show: () => void;
        hide: () => void;
        setText: (text: string) => void;
        onClick: (callback: () => void) => void;
      };
      BackButton: {
        show: () => void;
        hide: () => void;
        onClick: (callback: () => void) => void;
      };
    };
  };
}
