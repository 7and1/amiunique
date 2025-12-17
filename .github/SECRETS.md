# GitHub Secrets Configuration Guide

This file documents the required GitHub Secrets for automatic deployment.
**DO NOT commit actual secret values!**

## Required GitHub Secrets

Configure these in your repository:
`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### Cloudflare Credentials

1. **CLOUDFLARE_API_TOKEN**
   - **Description**: API token for Cloudflare Workers and Pages deployment
   - **How to get**: https://dash.cloudflare.com/profile/api-tokens
   - **Required permissions**:
     - Account.Cloudflare Pages: Edit
     - Account.Cloudflare Workers Scripts: Edit
     - Account.D1: Edit

2. **CLOUDFLARE_ACCOUNT_ID**
   - **Description**: Your Cloudflare account ID
   - **How to get**: Cloudflare Dashboard → Workers & Pages → Overview (right sidebar)
   - **Value format**: 32 character hex string

### Cloudflare Resources (D1 & KV)

3. **D1_DATABASE_ID**
   - **Description**: Cloudflare D1 database ID
   - **How to get**: `wrangler d1 list` or Cloudflare Dashboard → D1 → your database

4. **KV_NAMESPACE_ID**
   - **Description**: KV namespace ID for development/preview
   - **How to get**: `wrangler kv:namespace list` or Cloudflare Dashboard → KV

5. **KV_PREVIEW_ID**
   - **Description**: KV namespace preview ID (can be same as KV_NAMESPACE_ID)

6. **KV_PRODUCTION_ID**
   - **Description**: KV namespace ID for production environment
   - **How to get**: Create a separate KV namespace for production

### Optional: AI Features

7. **OPENROUTER_API_KEY** (optional)
   - **Description**: OpenRouter API key for AI chat assistant
   - **How to get**: https://openrouter.ai/keys
   - **Note**: If not provided, AI chat uses intelligent fallback responses

## CLI Setup Commands

```bash
# Create D1 database
wrangler d1 create amiunique-db

# Create KV namespaces
wrangler kv:namespace create "RATE_LIMIT_KV"
wrangler kv:namespace create "RATE_LIMIT_KV" --preview

# Add secrets via GitHub CLI
gh secret set CLOUDFLARE_API_TOKEN --body "your-token"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "your-account-id"
gh secret set D1_DATABASE_ID --body "your-d1-id"
gh secret set KV_NAMESPACE_ID --body "your-kv-id"
gh secret set KV_PREVIEW_ID --body "your-kv-preview-id"
gh secret set KV_PRODUCTION_ID --body "your-kv-production-id"

# Verify secrets
gh secret list
```

## Verification

After adding secrets, verify they're accessible:

```bash
# Go to GitHub repository
# Settings → Secrets and variables → Actions
# You should see all secrets listed with "Updated X minutes ago"
```

## Deployment Trigger

Once secrets are configured, deployment will trigger automatically on:
- Every push to `main` branch
- Manual workflow dispatch from Actions tab

## Security Notes

- ✅ Secrets are encrypted and never exposed in logs
- ✅ Only accessible to GitHub Actions workflows
- ✅ Can be updated/rotated without code changes
- ✅ Audit log available in repository settings
- ✅ wrangler.toml uses placeholders, replaced at deploy time

## Troubleshooting

### Deployment fails with "Unauthorized"
- Check CLOUDFLARE_API_TOKEN has correct permissions
- Verify token hasn't expired
- Regenerate token if needed

### D1/KV binding errors
- Verify D1_DATABASE_ID matches your database
- Check KV_PRODUCTION_ID is set for production deploys

### AI chat not working
- Add OPENROUTER_API_KEY secret
- Or: AI chat will use fallback mode (still functional)
