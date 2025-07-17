import type {
  DidDocument,
  InternalStateData,
  OAuthAuthorizationServerMetadata,
  OAuthProtectedResourceMetadata,
  ResolvedHandle,
  Session,
  TokenSet,
  Key,
} from '@atproto/oauth-client'
import { type SimpleStore, type Value } from '@atproto-labs/simple-store'
import { MMKV } from 'react-native-mmkv'
import { JWK } from './ExpoAtprotoAuth.types'
import { ExpoKey } from './expo-key'

type Item<V> = {
  value: V
  expiresAt: null | number
}

type CryptoKeyPair = {
  publicKey: JWK
  privateKey: JWK
}

type EncodedKey = {
  keyId: string
  keyPair: CryptoKeyPair
}

function encodeKey(key: Key): EncodedKey {
  if (!key.privateJwk || !key.publicJwk || !key.kid) {
    throw new Error('Invalid key object')
  }

  const encodedKey = {
    keyId: key.kid,
    keyPair: {
      publicKey: key.publicJwk,
      privateKey: key.privateJwk,
    },
  }

  // @ts-expect-error
  return encodedKey
}

async function decodeKey(encoded: EncodedKey): Promise<ExpoKey> {
  return new ExpoKey(encoded.keyPair.privateKey)
}

export type Schema = {
  state: Item<{
    dpopKey: EncodedKey
    iss: string
    verifier?: string
    appState?: string
  }>
  session: Item<{
    dpopKey: EncodedKey
    tokenSet: TokenSet
  }>
  didCache: Item<DidDocument>
  dpopNonceCache: Item<string>
  handleCache: Item<ResolvedHandle>
  authorizationServerMetadataCache: Item<OAuthAuthorizationServerMetadata>
  protectedResourceMetadataCache: Item<OAuthProtectedResourceMetadata>
}

export type DatabaseStore<V extends Value> = SimpleStore<string, V> & {
  getKeys: () => Promise<string[]>
}

const STORES = [
  'state',
  'session',
  'didCache',
  'dpopNonceCache',
  'handleCache',
  'authorizationServerMetadataCaache',
  'protectedResourceMetadataCache',
]

export type ExpoOAuthDatabaseOptions = {
  name?: string
  durability?: 'strict' | 'relaxed'
  cleanupInterval?: number
}

export class ExpoOAuthDatabase {
  #cleanupInterval?: ReturnType<typeof setInterval>
  #mmkv?: MMKV

  constructor(options?: ExpoOAuthDatabaseOptions) {
    this.#cleanupInterval = setInterval(() => {
      this.cleanup()
    }, options?.cleanupInterval ?? 30e3)
    this.#mmkv = new MMKV({ id: 'react-native-oauth-client' })
  }

  delete = async (key: string) => {
    this.#mmkv?.delete(key)
    this.#mmkv?.delete(`${key}.expiresAt`)
  }

  protected createStore<N extends keyof Schema, V extends Value>(
    name: N,
    {
      encode,
      decode,
      expiresAt,
    }: {
      encode: (value: V) => Schema[N]['value'] | PromiseLike<Schema[N]['value']>
      decode: (encoded: Schema[N]['value']) => V | PromiseLike<V>
      expiresAt: (value: V) => null | number
    }
  ): DatabaseStore<V> {
    return {
      get: async (key) => {
        const item = this.#mmkv?.getString(`${name}.${key}`)

        if (item === undefined) return undefined

        const storedExpiresAt = this.#mmkv?.getNumber(
          `${name}.${key}.expiresAt`
        )
        if (storedExpiresAt && storedExpiresAt < Date.now()) {
          await this.delete(`${name}.${key}`)
          return undefined
        }

        const res = decode(JSON.parse(item))
        return res
      },

      getKeys: async () => {
        const keys = this.#mmkv?.getAllKeys() ?? []
        return keys.filter((key) => key.startsWith(`${name}.`))
      },

      set: async (key, value) => {
        let encoded = await encode(value)
        encoded = JSON.stringify(encoded)

        const _expiresAt = expiresAt(value)

        this.#mmkv?.set(`${name}.${key}`, encoded)
        if (_expiresAt) {
          this.#mmkv?.set(`${name}.${key}.expiresAt`, _expiresAt)
        }
      },
      del: async (key) => {
        await this.delete(`${name}.${key}`)
      },
    }
  }

  getSessionStore(): DatabaseStore<Session> {
    return this.createStore('session', {
      expiresAt: ({ tokenSet }) =>
        tokenSet.refresh_token || tokenSet.expires_at == null
          ? null
          : new Date(tokenSet.expires_at).valueOf(),
      encode: ({ dpopKey, ...session }) => ({
        ...session,
        dpopKey: encodeKey(dpopKey),
      }),
      // @ts-expect-error
      decode: async ({ dpopKey, ...encoded }) => ({
        ...encoded,
        dpopKey: await decodeKey(dpopKey),
      }),
    })
  }

  getStateStore(): DatabaseStore<InternalStateData> {
    return this.createStore('state', {
      expiresAt: (_value) => Date.now() + 10 * 60e3,
      encode: ({ dpopKey, ...session }) => ({
        ...session,
        dpopKey: encodeKey(dpopKey),
      }),
      // @ts-expect-error
      decode: async ({ dpopKey, ...encoded }) => ({
        ...encoded,
        dpopKey: await decodeKey(dpopKey),
      }),
    })
  }

  getDpopNonceCache(): undefined | DatabaseStore<string> {
    return this.createStore('dpopNonceCache', {
      expiresAt: (_value) => Date.now() + 600e3,
      encode: (value) => value,
      decode: (encoded) => encoded,
    })
  }

  getDidCache(): undefined | DatabaseStore<DidDocument> {
    return this.createStore('didCache', {
      expiresAt: (_value) => Date.now() + 60e3,
      encode: (value) => value,
      decode: (encoded) => encoded,
    })
  }

  getHandleCache(): undefined | DatabaseStore<ResolvedHandle> {
    return this.createStore('handleCache', {
      expiresAt: (_value) => Date.now() + 60e3,
      encode: (value) => value,
      decode: (encoded) => encoded,
    })
  }

  getAuthorizationServerMetadataCache():
    | undefined
    | DatabaseStore<OAuthAuthorizationServerMetadata> {
    return this.createStore('authorizationServerMetadataCache', {
      expiresAt: (_value) => Date.now() + 60e3,
      encode: (value) => value,
      decode: (encoded) => encoded,
    })
  }

  getProtectedResourceMetadataCache():
    | undefined
    | DatabaseStore<OAuthProtectedResourceMetadata> {
    return this.createStore('protectedResourceMetadataCache', {
      expiresAt: (_value) => Date.now() + 60e3,
      encode: (value) => value,
      decode: (encoded) => encoded,
    })
  }

  async cleanup() {
    for (const name of STORES) {
      const keys = this.#mmkv?.getAllKeys() ?? []
      for (const key of keys) {
        if (key.startsWith(`${name}.`)) {
          const expiresAt = this.#mmkv?.getNumber(`${name}.${key}.expiresAt`)
          if (expiresAt && Number(expiresAt) < Date.now()) {
            this.#mmkv?.delete(key)
            this.#mmkv?.delete(`${name}.${key}.expiresAt`)
          }
        }
      }
    }
  }

  async [Symbol.asyncDispose]() {
    clearInterval(this.#cleanupInterval)
  }
}
