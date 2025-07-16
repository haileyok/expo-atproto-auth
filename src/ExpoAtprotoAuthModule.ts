import { NativeModule, requireNativeModule } from 'expo';

import { ExpoAtprotoAuthModuleEvents } from './ExpoAtprotoAuth.types';

declare class ExpoAtprotoAuthModule extends NativeModule<ExpoAtprotoAuthModuleEvents> {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAtprotoAuthModule>('ExpoAtprotoAuth');
