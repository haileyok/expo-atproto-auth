import { NativeModule, requireNativeModule } from "expo";

import { ExpoAtprotoAuthModuleEvents, JWK } from "./ExpoAtprotoAuth.types";
import { VerifyOptions, VerifyResult } from "@atproto/oauth-client";

declare class ExpoAtprotoAuthModule extends NativeModule<ExpoAtprotoAuthModuleEvents> {
  digest(data: Uint8Array, algo: string): Uint8Array;
  getRandomValues(byteLength: number): Uint8Array;
  generatePrivateJwk(algorithim: string): JWK;
  createJwt(header: string, payload: string, jwk: JWK): string;
  verifyJwt(token: string, jwk: JWK, options: VerifyOptions): VerifyResult;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<ExpoAtprotoAuthModule>("ExpoAtprotoAuth");
