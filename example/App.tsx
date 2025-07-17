import React from "react";
import { Text, View, StyleSheet, Button, Alert, TextInput } from "react-native";
import {
  digest,
  getRandomValues,
  createJwt,
  generateJwk,
  ReactNativeOAuthClient,
} from "expo-atproto-auth";
import { OAuthSession } from "@atproto/oauth-client";
import { Agent } from "@atproto/api";
import type { ReactNativeKey } from "expo-atproto-auth";
import * as Browser from "expo-web-browser";

const client = new ReactNativeOAuthClient({
  clientMetadata: {
    client_id: "https://hailey.at/oauth-client-metadata.json",
    client_name: "React Native OAuth Client Demo",
    client_uri: "https://hailey.at",
    redirect_uris: ["at.hailey:/auth/callback"],
    scope: "atproto transition:generic",
    token_endpoint_auth_method: "none",
    response_types: ["code"],
    grant_types: ["authorization_code", "refresh_token"],
    application_type: "native",
    dpop_bound_access_tokens: true,
  },
  handleResolver: "https://bsky.social",
});

export default function App() {
  const [values, setValues] = React.useState<Uint8Array>();
  const [sha, setSha] = React.useState<Uint8Array>();
  const [jwt, setJwt] = React.useState<string>();
  const [privateJwk, setPrivateJwk] = React.useState<
    ReactNativeKey | undefined
  >();
  const [session, setSession] = React.useState<OAuthSession>();
  const [input, setInput] = React.useState<string>();
  const [agent, setAgent] = React.useState<Agent>();

  return (
    <View style={styles.container}>
      <Text>Current Account: {session ? session.did : "No Account"}</Text>
      <Text>Values: {values}</Text>
      <Button
        title="Generate Random Values"
        onPress={() => {
          const newValues = getRandomValues(400);
          setValues(newValues);
        }}
      />
      <Text>SHA: {sha}</Text>
      <Button
        title="SHA from values"
        onPress={() => {
          if (!values) {
            return;
          }
          let newSha: Uint8Array | undefined;
          try {
            newSha = digest(values, "sha256");
          } catch (e: any) {
            Alert.alert("Error", e.toString());
            return;
          }
          setSha(newSha);
        }}
      />
      <Text>JWT: {jwt}</Text>
      <Button
        title="Create JWT"
        onPress={() => {
          if (!privateJwk) {
            return;
          }

          let newJwt: string | undefined;
          try {
            newJwt = createJwt("", "", privateJwk);
          } catch (e: any) {
            Alert.alert("Error", e.toString());
            return;
          }
          setJwt(newJwt);
        }}
      />
      <Text>Priv Key: {privateJwk?.kid}</Text>
      <Button
        title="Create JWK"
        onPress={() => {
          let newJwk: ReactNativeKey | undefined;
          try {
            newJwk = generateJwk("ES256");
          } catch (e: any) {
            Alert.alert("Error", e.toString());
            return;
          }
          setPrivateJwk(newJwk);
        }}
      />

      <TextInput
        onChangeText={(t) => setInput(t)}
        style={{ height: 40, width: 300, borderWidth: 1, padding: 5 }}
        placeholder="Input"
        autoCorrect={false}
      />
      <Button
        title="Open Sign In"
        onPress={async () => {
          let url: URL;
          try {
            url = await client.authorize(input ?? "");
          } catch (e: any) {
            Alert.alert("Error", e.toString());
            return;
          }
          const res = await Browser.openAuthSessionAsync(
            url.toString(),
            "at.hailey://auth/callback",
          );

          if (res.type === "success") {
            const resUrl = new URL(res.url);
            try {
              const params = new URLSearchParams(resUrl.hash.substring(1));
              const callbackRes = await client.callback(params);
              setSession(callbackRes.session);

              const agent = new Agent(callbackRes.session);
              setAgent(agent);
            } catch (e: any) {
              Alert.alert("Error", e.toString());
            }
          } else {
            Alert.alert("Error", `Received non-success status: ${res.type}`);
          }
        }}
      />

      <Button
        title="Restore from DID"
        onPress={async () => {
          try {
            const restoreRes = await client.restore(input ?? "");
            setSession(restoreRes);

            const agent = new Agent(restoreRes);
            setAgent(agent);
          } catch (e: any) {
            Alert.alert("Error", e.toString());
          }
        }}
      />

      <Button
        title="Get Profile"
        onPress={async () => {
          try {
            const res = await agent?.getProfile({
              actor: session?.did ?? "",
            });
            Alert.alert(
              "Profile",
              `Display Name: ${res?.data.displayName}, Bio: ${res?.data.description}`,
            );
          } catch (e: any) {
            Alert.alert("Error", e.toString());
          }
        }}
        disabled={!agent}
      />

      <Button
        title="Create Post"
        onPress={async () => {
          try {
            await agent?.post({
              text: "Test post from Expo Atproto Auth example",
            });
          } catch (e: any) {
            Alert.alert("Error", e.toString());
          }
        }}
        disabled={!agent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
