# Troubleshooting Guide

## Current Issue: Worker Connection Timeout

### Status
- ✅ Worker deployed successfully (Version: `6bae46d2-9992-4a22-a8d3-62f59f3f025e`)
- ✅ Worker URL: `https://amiunique-api.7and1.workers.dev`
- ✅ Frontend deployed: `https://4c65d433.amiunique.pages.dev`
- ❌ Worker not accessible (connection timeout)

### Root Cause
**Cloudflare Edge API Degraded** - As mentioned, Cloudflare's Edge API is experiencing degraded performance, preventing Workers from responding to requests.

### Evidence
```bash
# Worker deployment logs show successful deployment
Current Version ID: 6bae46d2-9992-4a22-a8d3-62f59f3f025e
  https://amiunique-api.7and1.workers.dev
  
# But connections timeout
$ curl https://amiunique-api.7and1.workers.dev/api/health
curl: (28) Failed to connect after 75s: Couldn't connect to server
```

### What We've Done
1. ✅ Fixed validation schema (added 17 missing fields)
2. ✅ Configured GitHub Actions for automated deployment
3. ✅ Updated all API URLs to Worker endpoint
4. ✅ Enabled `workers_dev = true` for production
5. ✅ Deployed both API Worker and Web App
6. ✅ Upgraded Next.js to 16.0.9 (security fix)

### When Cloudflare Recovers

Once Edge API is restored, verify with:

```bash
# 1. Test Worker health endpoint
curl https://amiunique-api.7and1.workers.dev/api/health

# Expected response:
# {"status":"healthy","timestamp":1234567890,"latency_ms":0}

# 2. Test full fingerprint analysis
curl -X POST https://amiunique-api.7and1.workers.dev/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"hw_canvas_hash":"test","sys_platform":"MacIntel",...}'

# 3. Visit the web app
open https://4c65d433.amiunique.pages.dev/scan/
```

### Alternative: Check Cloudflare Status
- Dashboard: https://dash.cloudflare.com/
- Status Page: https://www.cloudflarestatus.com/
- Look for "Edge API" service status

### If Still Not Working After Recovery

```bash
# 1. Check Worker logs
cd apps/api
wrangler tail amiunique-api --format pretty

# 2. Redeploy Worker
wrangler deploy --env production

# 3. Check D1 database
wrangler d1 execute amiunique-db --remote --command="SELECT COUNT(*) FROM visits"

# 4. Check KV namespace
wrangler kv key list --namespace-id=YOUR_KV_NAMESPACE_ID
```

### Future: Custom Domain Setup

To use `api.amiunique.io` instead of workers.dev:

1. **Add DNS Record in Cloudflare**:
   ```
   Type: AAAA
   Name: api
   Content: 100::
   Proxy: Enabled (Orange cloud)
   ```

2. **Bind Worker to Custom Domain**:
   - Go to Workers & Pages → amiunique-api → Settings → Domains
   - Add Custom Domain: `api.amiunique.io`

3. **Update Frontend** (optional):
   ```typescript
   // apps/web/src/lib/api.ts
   const API_URL = 'https://api.amiunique.io';
   ```

## Related Issues

### Security Check Failures (RESOLVED ✅)
~~The Security Check workflow fails due to:~~
- ~~**Next.js vulnerability**: Upgrade to 16.0.9+ (non-critical DoS issue)~~

**Status**: Fixed - Next.js upgraded to 16.0.9 (2025-12-18)

### Permission Denied on Git Push
If you encounter `Permission denied` errors:
```bash
# Use SSH URL instead
git remote set-url origin git@github.com:7and1/amiunique.git
git push
```

---

**Last Updated**: 2025-12-18  
**Cloudflare Status**: Edge API Degraded  
**Deployment Status**: ✅ Complete, ⏳ Waiting for Cloudflare recovery
