import { JwtHeader } from "@atproto/oauth-client";
import type { StyleProp, ViewStyle } from "react-native";

export type JWK = {
  kty: string;
  use: "sig" | "enc" | undefined;
  crv: "P-256";
  kid: string;
  x: string;
  y: string;
  d: string | undefined;
  alg: string;
};

export type VerifyOptions = {
  audience?: string;
  clockTolerance?: number;
  issuer?: string;
  maxTokenAge?: number;
  subject?: string;
  typ?: string;
  currentDate?: Date;
  requiredClaims?: string[];
};

export type VerifyResponse = {
  payload: string;
  protectedHeader: JwtHeader;
};

export type OnLoadEventPayload = {
  url: string;
};

export type ExpoAtprotoAuthModuleEvents = {
  onChange: (params: ChangeEventPayload) => void;
};

export type ChangeEventPayload = {
  value: string;
};

export type ExpoAtprotoAuthViewProps = {
  url: string;
  onLoad: (event: { nativeEvent: OnLoadEventPayload }) => void;
  style?: StyleProp<ViewStyle>;
};
