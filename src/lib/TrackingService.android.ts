import { NativeModules } from 'react-native';

const Native = NativeModules.TrackingServiceModule as {
  start(title: string, text: string): Promise<boolean>;
  stop(): Promise<boolean>;
};

export const TrackingService = {
  start(title: string, text: string) {
    return Native.start(title, text);
  },
  stop() {
    return Native.stop();
  },
};

