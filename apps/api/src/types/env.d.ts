/**
 * Cloudflare Worker environment bindings
 */

export interface Env {
  /** D1 Database binding */
  DB: D1Database;

  /** KV Namespace for distributed rate limiting */
  RATE_LIMIT_KV: KVNamespace;

  /** Environment name */
  ENVIRONMENT: string;
}

/**
 * Cloudflare request.cf object with network fingerprint data
 */
export interface CFProperties {
  asn?: number;
  asOrganization?: string;
  colo?: string;
  country?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  latitude?: string;
  longitude?: string;
  timezone?: string;
  tlsVersion?: string;
  tlsCipher?: string;
  httpProtocol?: string;
  clientTcpRtt?: number;
  botManagement?: {
    score?: number;
    verifiedBot?: boolean;
    corporateProxy?: boolean;
    staticResource?: boolean;
  };
}

/**
 * Extended Request with Cloudflare properties
 */
export interface CFRequest extends Request {
  cf?: CFProperties;
}
