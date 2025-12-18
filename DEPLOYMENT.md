# Deployment Guide

This document explains how to deploy AmiUnique.io to Cloudflare using GitHub Actions.

## Prerequisites

1. **Cloudflare Account** - Sign up at https://dash.cloudflare.com
2. **GitHub Repository** - Fork or clone this repo
3. **Cloudflare Resources** - Create required D1 database and KV namespaces

## Step 1: Create Cloudflare Resources

### Create D1 Database

```bash
cd apps/api
wrangler d1 create amiunique-db
```

Copy the `database_id` from the output.

### Create KV Namespaces

```bash
# Development namespace
wrangler kv namespace create "RATE_LIMIT_KV"

# Preview namespace
wrangler kv namespace create "RATE_LIMIT_KV" --preview

# Production namespace (if different from dev)
wrangler kv namespace create "RATE_LIMIT_KV_PROD"
```

Copy the `id` values from the outputs.

### Initialize Database Schema

```bash
wrangler d1 execute amiunique-db --file=./schema.sql --remote
```

## Step 2: Configure GitHub Secrets

Go to your GitHub repository settings: **Settings → Secrets and variables → Actions → New repository secret**

Add the following secrets:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | [Create token](https://dash.cloudflare.com/profile/api-tokens) with `Workers Scripts:Edit` permission |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Found in dashboard URL: `dash.cloudflare.com/<account_id>` |
| `D1_DATABASE_ID` | D1 database ID | From `wrangler d1 create` output |
| `KV_NAMESPACE_ID` | Development KV namespace ID | From `wrangler kv namespace create` output |
| `KV_PREVIEW_ID` | Preview KV namespace ID | From preview creation output |
| `KV_NAMESPACE_ID_PROD` | Production KV namespace ID | Same as `KV_NAMESPACE_ID` or separate production namespace |

### Using GitHub CLI (Automated)

```bash
# Set variables
CLOUDFLARE_API_TOKEN="your_token_here"
CLOUDFLARE_ACCOUNT_ID="your_account_id_here"
D1_DATABASE_ID="your_d1_id_here"
KV_NAMESPACE_ID="your_kv_id_here"
KV_PREVIEW_ID="your_preview_kv_id_here"
KV_NAMESPACE_ID_PROD="your_prod_kv_id_here"

# Create secrets
gh secret set CLOUDFLARE_API_TOKEN --body "$CLOUDFLARE_API_TOKEN"
gh secret set CLOUDFLARE_ACCOUNT_ID --body "$CLOUDFLARE_ACCOUNT_ID"
gh secret set D1_DATABASE_ID --body "$D1_DATABASE_ID"
gh secret set KV_NAMESPACE_ID --body "$KV_NAMESPACE_ID"
gh secret set KV_PREVIEW_ID --body "$KV_PREVIEW_ID"
gh secret set KV_NAMESPACE_ID_PROD --body "$KV_NAMESPACE_ID_PROD"

# Verify secrets
gh secret list
```

## Step 3: Local Development Setup

1. **Copy wrangler.toml template:**

```bash
cd apps/api
cp wrangler.toml.example wrangler.toml
```

2. **Edit wrangler.toml with your IDs:**

```toml
[[d1_databases]]
database_id = "YOUR_ACTUAL_D1_ID"

[[kv_namespaces]]
id = "YOUR_ACTUAL_KV_ID"
preview_id = "YOUR_ACTUAL_PREVIEW_KV_ID"
```

⚠️ **IMPORTANT**: `wrangler.toml` is in `.gitignore` to prevent accidental commits!

3. **Start development server:**

```bash
# From project root
pnpm dev          # Start all services
pnpm dev:api      # API only
pnpm dev:web      # Frontend only
```

## Step 4: Deploy

### Automatic Deployment (Recommended)

Push to `main` branch to trigger automatic deployment via GitHub Actions:

```bash
git add .
git commit -m "Deploy updates"
git push origin main
```

GitHub Actions will:
1. ✅ Build API Worker
2. ✅ Deploy to Cloudflare Workers
3. ✅ Build Next.js web app
4. ✅ Deploy to Cloudflare Pages
5. ✅ Report deployment status

### Manual Deployment

```bash
# Deploy API Worker
pnpm deploy:api

# Deploy Web App
pnpm deploy:web

# Deploy both
pnpm deploy
```

## Step 5: Verify Deployment

1. **Check GitHub Actions:**
   - Go to **Actions** tab in your repo
   - Verify "Deploy to Cloudflare" workflow succeeded

2. **Test API endpoint:**
   ```bash
   curl https://amiunique-api.<your-subdomain>.workers.dev/api/health
   ```

3. **Test Web App:**
   - Visit: `https://amiunique.pages.dev`
   - Run a fingerprint scan

## Security Best Practices

✅ **DO:**
- Use GitHub Secrets for sensitive data
- Rotate API tokens regularly
- Enable branch protection rules
- Review deployment logs for errors

❌ **DON'T:**
- Commit `wrangler.toml` with real IDs
- Share API tokens in public channels
- Disable security checks
- Use production credentials in development

## Troubleshooting

### Deployment fails with "binding DB must have a valid id"

**Solution:** Verify `D1_DATABASE_ID` secret is set correctly in GitHub.

### "Permission denied" during deployment

**Solution:** Check that your `CLOUDFLARE_API_TOKEN` has `Workers Scripts:Edit` permission.

### Web app shows 404 errors

**Solution:** Ensure Pages project name matches: `--project-name=amiunique` in deploy command.

### How to rollback deployment?

```bash
# List recent deployments
wrangler deployments list

# Rollback to specific version
wrangler rollback <deployment-id>
```

## Custom Domain Setup

1. Add domain to Cloudflare
2. Configure DNS records:
   ```
   api.amiunique.io → CNAME to amiunique-api.workers.dev
   www.amiunique.io → CNAME to amiunique.pages.dev
   ```
3. Uncomment routes in `wrangler.toml.example`

## CI/CD Pipeline

The deployment workflow (`.github/workflows/deploy.yml`) runs on:
- ✅ Push to `main` branch
- ✅ Pull requests (build only, no deploy)
- ✅ Manual trigger via workflow_dispatch

### Workflow Jobs

1. **deploy-api** - Build and deploy Worker
2. **deploy-web** - Build and deploy Pages
3. **notify** - Report deployment status

## Support

- Issues: https://github.com/7and1/amiunique/issues
- Docs: https://developers.cloudflare.com/workers/
