import ExpoModulesCore

enum ExpoAtprotoAuthError: Error {
  case unsupportedAlgorithm(String)
  case invalidJwk
  case invalidHeader(String)
  case invalidPayload(String)
  case nullSigner
}

public class ExpoAtprotoAuthModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoAtprotoAuth")

    Function("digest") { (data: Data, algo: String) throws -> Data in
      if algo != "sha256" {
        throw ExpoAtprotoAuthError.unsupportedAlgorithm(algo)
      }
      return CryptoUtil.digest(data: data)
    }

    Function("getRandomValues") { (byteLength: Int) -> Data in
      return CryptoUtil.getRandomValues(byteLength: byteLength)
    }

    Function("generatePrivateJwk") { (algo: String) throws -> JWK in
      if algo != "ES256" {
        throw ExpoAtprotoAuthError.unsupportedAlgorithm(algo)
      }
      return CryptoUtil.generateJwk()
    }

    Function("createJwt") { (header: String, payload: String, jwk: JWK) throws -> String in
      let key = try CryptoUtil.importJwk(x: jwk.x, y: jwk.y, d: jwk.d)
      let jwt = try JoseUtil.createJwt(header: header, payload: payload, jwk: key)
      return jwt
    }

    Function("verifyJwt") { (token: String, jwk: JWK, options: VerifyOptions) throws -> VerifyResponse in
      let key = try CryptoUtil.importJwk(x: jwk.x, y: jwk.y, d: jwk.d)
      let res = try JoseUtil.verifyJwt(token: token, jwk: key, options: options)
      return res
    }

    AsyncFunction("setValueAsync") { (value: String) in
      self.sendEvent("onChange", [
        "value": value
      ])
    }
  }
}
