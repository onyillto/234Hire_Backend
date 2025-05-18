// src/types/jsonwebtoken.d.ts
import * as jwt from "jsonwebtoken";

declare module "jsonwebtoken" {
  export type Secret = string | Buffer | { key: string; passphrase: string };

  export interface SignOptions {
    /**
     * Signature algorithm. Could be one of these values :
     * - HS256:    HMAC using SHA-256 hash algorithm (default)
     * - HS384:    HMAC using SHA-384 hash algorithm
     * - HS512:    HMAC using SHA-512 hash algorithm
     * - RS256:    RSASSA using SHA-256 hash algorithm
     * - RS384:    RSASSA using SHA-384 hash algorithm
     * - RS512:    RSASSA using SHA-512 hash algorithm
     * - ES256:    ECDSA using P-256 curve and SHA-256 hash algorithm
     * - ES384:    ECDSA using P-384 curve and SHA-384 hash algorithm
     * - ES512:    ECDSA using P-521 curve and SHA-512 hash algorithm
     * - none:     No digital signature or MAC value included
     */
    algorithm?: Algorithm;

    /**
     * Expressed in seconds or a string describing a time span [zeit/ms](https://github.com/zeit/ms.js).
     * Eg: 60, "2 days", "10h", "7d". A numeric value is interpreted as a seconds count.
     * If you use a string be sure you provide the time units (days, hours, etc),
     * otherwise milliseconds unit is used by default ("120" is equal to "120ms").
     */
    expiresIn?: string | number;

    /** Not before expressed in seconds or a string describing a time span [zeit/ms](https://github.com/zeit/ms.js). */
    notBefore?: string | number;

    /** Audience */
    audience?: string | string[];

    /** Issuer */
    issuer?: string;

    /** Subject */
    subject?: string;

    /** JWT ID */
    jwtid?: string;

    /**
     * The amount of seconds the token is valid for.
     * @deprecated Use 'expiresIn' instead
     */
    expiresInSeconds?: number;

    /** Key id */
    keyid?: string;

    /**
     * Allow the specified issuer.
     * @deprecated Use 'issuer' instead
     */
    iss?: string;

    /**
     * Allow the specified audience.
     * @deprecated Use 'audience' instead
     */
    aud?: string | string[];

    /**
     * Allow the specified subject.
     * @deprecated Use 'subject' instead
     */
    sub?: string;

    /**
     * Allow the specified JWT id.
     * @deprecated Use 'jwtid' instead
     */
    jti?: string;

    /**
     * Allow the token to be valid even before the specified date.
     * @deprecated Use 'notBefore' instead
     */
    nbf?: number;

    /**
     * Allow the token to be used after the specified date.
     * @deprecated Use 'expiresIn' instead
     */
    exp?: number;

    /** Force specific encoding for the token signature part (HMAC signature is always base64 encoded). */
    encoding?: string;

    /** Header */
    header?: object;

    /**
     * Allow token to be used before the specified date.
     * @deprecated Use 'notBefore' instead
     */
    noTimestamp?: boolean;

    /**
     * If defined, the signing key will be this secret key/certificate.
     * Otherwise, the secret provided as the first parameter for sign() will be
     * used to sign the token.
     */
    key?: string;

    /** If the payload is not a buffer or a string, it will be JSON stringified. */
    json?: boolean;
  }
}
