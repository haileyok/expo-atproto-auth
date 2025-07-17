import type { Key, RuntimeImplementation } from '@atproto/oauth-client'
import { default as NativeModule } from './ExpoAtprotoAuthModule'
import { generateJwk } from './react-native-key'

export class ReactNativeRuntimeImplementation implements RuntimeImplementation {
  async createKey(algs: string[]): Promise<Key> {
    if (!algs.includes('ES256')) {
      throw TypeError('ES256 is the only supported algo')
    }
    // @ts-expect-error TODO:
    return generateJwk('ES256')
  }

  getRandomValues(length: number): Uint8Array | PromiseLike<Uint8Array> {
    return NativeModule.getRandomValues(length)
  }

  digest(
    bytes: Uint8Array,
    algorithim: { name: string }
  ): Uint8Array | PromiseLike<Uint8Array> {
    if (algorithim.name === 'sha256') {
      return NativeModule.digest(bytes, algorithim.name)
    }

    throw new TypeError(`Unsupported algorithim: ${algorithim.name}`)
  }
}
