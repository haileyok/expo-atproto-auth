# Expo Atproto OAuth

This is an Expo client library for Atproto OAuth. It implements the required native crypto functions for supporting JWTs in React Native and uses
the base `OAuthClient` interface found in [the Atproto repository](https://github.com/bluesky-social/atproto/tree/main/packages/oauth/oauth-client).

## Prerequisites

Before using this library, there are a few additional libraries that you must install within your Expo application.

- [react-native-mmkv](https://www.npmjs.com/package/react-native-mmkv)
- [expo-web-browser](https://www.npmjs.com/package/expo-web-browser)
- [@atproto/oauth-client](https://www.npmjs.com/package/@atproto/oauth-client)
- [event-target-polyfill](https://www.npmjs.com/package/event-target-polyfill) (or similar)
- [abortcontroller-polyfill](https://www.npmjs.com/package/abortcontroller-polyfill) (or similar)

Apply the two polyfills inside your application's entrypoint (usually `index.ts`). They should be placed _before_ anything else in the file, and particularly before `registerRootComponent(App)`.

> [!CAUTION]
> As of current (Expo 53), you _must_ apply an Expo patch for this library to work. You may use the patch found [here](https://github.com/haileyok/expo-atproto-auth/blob/main/patches/expo%2B53.0.19.patch).
A fix for this has been submitted up stream and merged, so will hopefully be fixed in Expo 54 (see the PR [here](https://github.com/expo/expo/pull/38122)).

### In bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `expo` package](https://docs.expo.dev/bare/installing-expo-modules/)
before continuing.

## Installation

Once you have satisfied the prerequisites, you can simply install the library with `yarn add expo-atproto-auth`.

## Usage

### Serve your `oauth-client-metadata.json`

You will need to server an `oauth-client-metadata.json` from your application's website. An example of this metadata
would look like this:

```
{
	"client_id": "https://hailey.at/oauth-client-metadata.json",
	"client_name": "React Native OAuth Client Demo",
	"client_uri": "https://hailey.at",
	"redirect_uris": [
		"at.hailey:/auth/callback"
	],
	"scope": "atproto transition:generic",
	"token_endpoint_auth_method": "none",
	"response_types": [
		"code"
	],
	"grant_types": [
		"authorization_code",
		"refresh_token"
	],
	"application_type": "native",
	"dpop_bound_access_tokens": true
}
```

- The `client_id` should be the same URL as where you are serving your `oauth-client-metadata.json` from
- The `client_uri` can be the home page of where you are serving your metadata from
- Your `redirect_uris` should contain the native redirect URI in the first position. Additionally, the scheme must be
formatted as the _reverse_ of the domain you are serving the metadata from. Since I am serving mine from `hailey.at`,
I use `at.hailey` as the scheme. If my domain were `atproto.expo.dev`, I would use `dev.expo.atproto`. Additionally, the scheme _must_ contain _only one trailing slash_ after the `:`. `at.hailey://` would be invalid.
- The `application_type` must be `native`

For a real-world example, see [Skylight's client metadata](https://skylight.expo.app/oauth/client-metadata.json).

For more information about client metadata, see [the Atproto documentation](https://atproto.com/specs/oauth#client-id-metadata-document).

### Create a client

Next, you want to create an `ExpoOAuthClient`. You will need to pass in the same client metadata to the client as you are serving in your `oauth-client-metadata.json`.

```ts
const client = new ExpoOAuthClient({
  clientMetadata: {
    client_id: 'https://hailey.at/oauth-client-metadata.json',
    client_name: 'React Native OAuth Client Demo',
    client_uri: 'https://hailey.at',
    redirect_uris: ['at.hailey:/auth/callback'],
    scope: 'atproto transition:generic',
    token_endpoint_auth_method: 'none',
    response_types: ['code'],
    grant_types: ['authorization_code', 'refresh_token'],
    application_type: 'native',
    dpop_bound_access_tokens: true,
  },
  handleResolver: 'https://bsky.social',
})
```

### Sign a user in

Whenever you are ready, you can initiate a sign in attempt for the user using the client using `client.signIn(input)`

`input` must be one of the following:
- A valid Atproto user handle, e.g. `hailey.bsky.team` or `hailey.at`
- A valid DID, e.g. `did:web:hailey.at` or `did:plc:oisofpd7lj26yvgiivf3lxsi`
- A valid PDS host, e.g. `https://cocoon.hailey.at` or `https://bsky.social`

> [!NOTE]
> If you wish to allow a user to _create_ an account instead of signing in, simply use a valid PDS hostname rather than
> a handle. They will be presented the option to either Sign In with an existing account, or create a new one.

The response of `signIn` will be a promise resolving to the following:

```ts
    | { status: WebBrowserResultType } // See Expo Web Browser documentation
    | { status: 'error'; error: unknown }
    | { status: 'success'; session: OAuthSession }
```

For example:

```ts
  const res = await client.signIn(input ?? '')
  if (res.status === 'success') {
    setSession(res.session)
    const newAgent = new Agent(res.session)
    setAgent(newAgent)
  } else if (res.status === 'error') {
    Alert.alert('Error', (res.error as any).toString())
  } else {
    Alert.alert(
      'Error',
      `Received unknown WebResultType: ${res.status}`
    )
  }
```

### Create an `Agent`

To interface with the various Atproto APIs, you will need to create an `Agent`. You will pass your `OAuthSession` to the `Agent`.

```ts
const newAgent = new Agent(res.session)
```

Session refreshes will be handled for you for the lifetime of the agent.

### Restoring a session

After, for example, closing the application, you will probably need to restore the user's session. You can do this by using the user's DID on the `ExpoOAuthClient`.

```ts
const restoreRes = await client.restore('did:plc:oisofpd7lj26yvgiivf3lxsi')
const newAgent = new Agent(restoreRes)
```

If the session needs to be refreshed, `.restore()` will do this for you before returning a session.

## Additional Reading

- [Atproto OAuth Spec](https://atproto.com/specs/oauth)
- [Atproto Web OAuth Example](https://github.com/bluesky-social/atproto/tree/main/packages/oauth/oauth-client-browser-example)
