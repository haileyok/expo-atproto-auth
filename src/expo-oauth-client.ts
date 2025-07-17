import {
  type Fetch,
  type OAuthClientMetadataInput,
  type OAuthClientOptions,
  type OAuthResponseMode,
  atprotoLoopbackClientMetadata,
  OAuthClient,
  OAuthSession,
} from '@atproto/oauth-client'
import { ExpoRuntimeImplementation } from './expo-runtime-implementation'
import { ExpoOAuthDatabase } from './expo-oauth-database'
import { openAuthSessionAsync, WebBrowserResultType } from 'expo-web-browser'

export type Simplify<T> = { [K in keyof T]: T[K] } & NonNullable<unknown>

export type ExpoOAuthClientOptions = Simplify<
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

export class ExpoOAuthClient extends OAuthClient {
  constructor({
    responseMode = 'fragment',
    ...options
  }: ExpoOAuthClientOptions) {
    const database = new ExpoOAuthDatabase()

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
      runtimeImplementation: new ExpoRuntimeImplementation(),
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

  async signIn(
    input: string
  ): Promise<
    | { status: WebBrowserResultType }
    | { status: 'error'; error: unknown }
    | { status: 'success'; session: OAuthSession }
  > {
    let url: URL
    try {
      url = await this.authorize(input)
    } catch (e: unknown) {
      return { status: 'error', error: e }
    }

    const res = await openAuthSessionAsync(
      url.toString(),
      this.clientMetadata.redirect_uris[0],
      {
        createTask: false,
      }
    )

    if (res.type === 'success') {
      const resUrl = new URL(res.url)
      const params = new URLSearchParams(resUrl.hash.substring(1))
      const callbackRes = await this.callback(params)
      return { status: 'success', session: callbackRes.session }
    } else {
      return { status: res.type }
    }
  }
}
