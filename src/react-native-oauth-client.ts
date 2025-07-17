import {
  type Fetch,
  type OAuthClientMetadataInput,
  type OAuthClientOptions,
  type OAuthResponseMode,
  atprotoLoopbackClientMetadata,
  OAuthClient,
} from '@atproto/oauth-client'
import { ReactNativeRuntimeImplementation } from './react-native-runtime-implementation'
import { ReactNativeOAuthDatabase } from './react-native-oauth-database'

export type Simplify<T> = { [K in keyof T]: T[K] } & NonNullable<unknown>

export type ReactNativeOAuthClientOptions = Simplify<
  {
    clientMetadata?: Readonly<OAuthClientMetadataInput>
    responseMode?: Exclude<OAuthResponseMode, 'form_post'>
    fetch?: Fetch
  } & Omit<
    OAuthClientOptions,
    | 'clientMetadata'
    | 'responseMode'
    | 'keyset'
    | 'fetch'
    | 'runtimeImplementation'
    | 'sessionStore'
    | 'stateStore'
    | 'didCache'
    | 'handleCache'
    | 'dpopNonceCache'
    | 'authorizationServerMetadataCache'
    | 'protectedResourceMetadataCache'
  >
>

export class ReactNativeOAuthClient extends OAuthClient {
  constructor({
    responseMode = 'fragment',
    ...options
  }: ReactNativeOAuthClientOptions) {
    const database = new ReactNativeOAuthDatabase()

    if (!['query', 'fragment'].includes(responseMode)) {
      throw new TypeError(`Invalid response mode: ${responseMode}`)
    }

    if (!options.clientMetadata) {
      throw new TypeError(`No client metadata provided`)
    }

    super({
      ...options,
      clientMetadata:
        options.clientMetadata ?? atprotoLoopbackClientMetadata('localhost'), // HACK: this fixes a type error for now, look into it later
      responseMode,
      keyset: undefined,
      runtimeImplementation: new ReactNativeRuntimeImplementation(),
      sessionStore: database.getSessionStore(),
      stateStore: database.getStateStore(),
      didCache: database.getDidCache(),
      handleCache: database.getHandleCache(),
      dpopNonceCache: database.getDpopNonceCache(),
      authorizationServerMetadataCache:
        database.getAuthorizationServerMetadataCache(),
      protectedResourceMetadataCache:
        database.getProtectedResourceMetadataCache(),
    })
  }
}
