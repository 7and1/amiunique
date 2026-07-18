/**
 * Cloudflare Worker environment bindings
 */

export interface Env {
  /** D1 Database binding */
  DB: D1Database;

  /** KV Namespace for distributed rate limiting */
  RATE_LIMIT_KV: KVNamespace;

  /** Native per-location limiter for the public self-IP report */
  IP_INTEL_RATE_LIMITER?: RateLimit;

  /** Native per-location limiters for public API routes */
  ANALYZE_RATE_LIMITER?: RateLimit;
  DELETION_RATE_LIMITER?: RateLimit;
  STATS_RATE_LIMITER?: RateLimit;
  HEALTH_RATE_LIMITER?: RateLimit;

  /** Environment name */
  ENVIRONMENT: string;

  /** IPBot IP intelligence API origin (optional - lookups are skipped when unset) */
  IPBOT_API_ORIGIN?: string;

  /** IPBot API key, sent as X-API-Key (wrangler secret - never commit) */
  IPBOT_API_KEY?: string;
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
