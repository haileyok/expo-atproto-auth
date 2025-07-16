import { registerWebModule, NativeModule } from 'expo';

import { ExpoAtprotoAuthModuleEvents } from './ExpoAtprotoAuth.types';

class ExpoAtprotoAuthModule extends NativeModule<ExpoAtprotoAuthModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(ExpoAtprotoAuthModule, 'ExpoAtprotoAuthModule');
