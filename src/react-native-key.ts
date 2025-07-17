import {
  type Key,
  type JwtHeader,
  type JwtPayload,
  type SignedJwt,
  type VerifyOptions,
  type VerifyResult,
} from "@atproto/oauth-client";
import type { JWK } from "./ExpoAtprotoAuth.types";
import { default as NativeModule } from "./ExpoAtprotoAuthModule";

export function getRandomValues(byteLength: number): Uint8Array {
  return NativeModule.getRandomValues(byteLength);
}

export function digest(data: Uint8Array, algorithim: string): Uint8Array {
  return NativeModule.digest(data, algorithim);
}

export function isECKey(jwk: any): jwk is JWK {
  return jwk?.kty === "EC" && jwk.crv && jwk.y;
}

export function createJwt(
  header: string,
  payload: string,
  key: ReactNativeKey,
): string {
  if (!key.privateJwk || !isECKey(key.privateJwk)) {
    throw new Error("Invalid key");
  }
  return NativeModule.createJwt(header, payload, key.privateJwk);
}

export function verifyJwt(
  token: string,
  jwk: JWK,
  options: VerifyOptions,
): VerifyResult {
  return NativeModule.verifyJwt(token, jwk, options);
}

// @ts-expect-error
export class ReactNativeKey implements Key {
  #jwk: Readonly<JWK>;

  constructor(jwk: Readonly<JWK>) {
    this.#jwk = jwk;
    if (!isECKey(jwk)) {
      throw new Error("Invalid key type");
    }
    if (!jwk.use) {
      throw new Error(`Missing "use" parameter value`);
    }
  }

  get jwk(): Readonly<JWK> {
    return this.#jwk;
  }

  get isPrivate() {
    return this.jwk.d !== undefined;
  }

  get privateJwk(): JWK {
    return this.jwk;
  }

  get publicJwk() {
    if (this.isSymetric) return undefined;
    const { d, ...publicKey } = this.jwk;
    return publicKey as Readonly<JWK & { d?: never }>;
  }

  get use() {
    return this.jwk.use as NonNullable<"sig" | "enc" | undefined>;
  }

  get alg() {
    return this.jwk.alg;
  }

  get kid() {
    return this.jwk.kid;
  }

  get crv() {
    return this.jwk.crv;
  }

  get algorithms() {
    return [this.jwk.alg];
  }

  get bareJwk() {
    return {
      kty: this.jwk.kty,
      crv: this.jwk.crv,
      x: this.jwk.x,
      y: this.jwk.y,
    };
  }

  get isSymetric() {
    return (
      this.jwk.kty === "oct" && "k" in this.jwk && this.jwk.k !== undefined
    );
  }

  async createJwt(header: JwtHeader, payload: JwtPayload): Promise<SignedJwt> {
    return createJwt(
      JSON.stringify(header),
      JSON.stringify(payload),
      this,
    ) as "${string}.${string}.${string}";
  }

  async verifyJwt<C extends string = never>(
    token: SignedJwt,
    options?: VerifyOptions<C>,
  ): Promise<VerifyResult<C>> {
    return verifyJwt(
      token,
      this.jwk,
      (options ?? {}) as VerifyOptions,
    ) as VerifyResult<C>;
  }
}

export function generateJwk(algoritihim: string): ReactNativeKey {
  const privJwk = NativeModule.generatePrivateJwk(algoritihim);
  return new ReactNativeKey(privJwk);
}
