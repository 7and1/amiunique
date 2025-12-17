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
   - **Value format**: 32+ character string

2. **CLOUDFLARE_ACCOUNT_ID**
   - **Description**: Your Cloudflare account ID
   - **How to get**: Cloudflare Dashboard → Workers & Pages → Overview (right sidebar)
   - **Value format**: 32 character hex string
   - **Note**: Store in secrets to keep it private in public repos

### Optional: AI Features

3. **OPENROUTER_API_KEY** (optional)
   - **Description**: OpenRouter API key for AI chat assistant
   - **How to get**: https://openrouter.ai/keys
   - **Value format**: `sk-or-v1-xxx...`
   - **Note**: If not provided, AI chat uses intelligent fallback responses
   - **Reference account**: Check `.env.local` from whatismytimezone project

## Verification

After adding secrets, verify they're accessible:

```bash
# Go to GitHub repository
# Settings → Secrets and variables → Actions
# You should see:
#   - CLOUDFLARE_API_TOKEN (set)
#   - CLOUDFLARE_ACCOUNT_ID (set)
#   - OPENROUTER_API_KEY (set) [optional]
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

## Troubleshooting

### Deployment fails with "Unauthorized"
- Check CLOUDFLARE_API_TOKEN has correct permissions
- Verify token hasn't expired
- Regenerate token if needed

### AI chat not working
- Add OPENROUTER_API_KEY secret
- Or: AI chat will use fallback mode (still functional)

### Account ID incorrect
- Verify CLOUDFLARE_ACCOUNT_ID matches your dashboard
- Must be 32 characters hex string
