# AmiUnique.io 生产部署报告

**部署时间**: 2025-12-09
**部署状态**: ✅ 核心基础设施已完成，待配置域名

---

## 📦 已部署组件

### 1. Cloudflare D1 数据库
- **Database ID**: `fdfac737-7ed4-430b-bd22-90321043368a`
- **名称**: `amiunique-db`
- **区域**: WNAM (Western North America)
- **表结构**: visits, deletion_requests, stats_cache, scheduled_jobs
- **索引**: 三锁哈希索引 + Meta 字段索引

### 2. Cloudflare KV (分布式限流)
- **Preview/Dev**: `79ad630aad4d49dfa8935f484aabb13e`
- **Production**: `d62a475316da4064b47cf2c80b92b924`

### 3. Cloudflare Worker API
- **Worker 名称**: `amiunique-api`
- **开发版本**: `80e5233a-0c72-455c-9823-c5a16d6a87a6`
- **生产版本**: `21b226de-705a-4ba7-b62e-84901ecb1f05`
- **Cron 触发器**: 每小时 GDPR 删除 + 每 5 分钟统计刷新

### 4. Cloudflare Pages 前端
- **生产 URL**: ✅ https://amiunique.pages.dev
- **部署 ID**: `4262f832`
- **状态**: ✅ 可访问 (HTTP 200)

---

## ⚠️ 待解决: API Worker 访问

**问题**: workers.dev 子域名无法访问 (https://amiunique-api.difft.workers.dev 超时)

**解决方案（三选一）**:

1. **配置自定义域名（推荐）**
   - 在 `apps/api/wrangler.toml` 取消注释路由配置
   - 设置 `pattern = "api.amiunique.io/*"`
   - 重新部署: `wrangler deploy --env production`

2. **启用 workers.dev**
   - Cloudflare Dashboard → Workers & Pages → Settings
   - 检查并启用 workers.dev subdomain

3. **本地测试**
   ```bash
   cd apps/api && wrangler dev --remote
   ```

---

## 🔧 配置前端 API URL

1. Cloudflare Dashboard → Pages → amiunique → Settings → Environment variables
2. 添加: `NEXT_PUBLIC_API_URL = https://api.amiunique.io`
3. 重新部署:
   ```bash
   cd apps/web
   pnpm build
   wrangler pages deploy out --project-name=amiunique
   ```

---

## ✅ 验证清单

### API Worker
- [ ] Health check: `curl https://api-url/api/health`
- [ ] Stats: `curl https://api-url/api/stats`
- [ ] Analyze: `curl -X POST https://api-url/api/analyze -H "Content-Type: application/json" -d '{"hw_canvas_hash":"test"}'`

### 前端
- [x] 页面加载: https://amiunique.pages.dev
- [ ] 指纹扫描功能
- [ ] 结果显示和图表

### 数据库
```bash
wrangler d1 execute amiunique-db --remote --command="SELECT COUNT(*) FROM visits"
```

---

## 📝 下一步

1. **立即**: 确认 Cloudflare workers.dev 子域名状态
2. **短期**: 配置自定义域名 api.amiunique.io
3. **完成**: 设置前端 API URL 环境变量
4. **验证**: 端到端功能测试

**部署账户**: info@opportunitygreen.com (fe394f7c37b25babc4e351d704a6a97c)

---

## 🤖 自动部署 (GitHub Actions)

### 工作流配置

已创建 `.github/workflows/deploy.yml`，自动部署流程：

**触发条件**:
- 推送到 `main` 分支
- 手动触发 (GitHub Actions 页面)

**部署步骤**:
1. ✅ 安装依赖 (pnpm)
2. ✅ 构建所有包
3. ✅ 部署 API 到 Cloudflare Workers
4. ✅ 部署 Web 到 Cloudflare Pages
5. ✅ 通知部署结果

### GitHub Secrets 配置

**必需的 Secrets** (在 GitHub 仓库设置中添加):

```bash
CLOUDFLARE_API_TOKEN    # Cloudflare API 令牌
CLOUDFLARE_ACCOUNT_ID   # 873cd683fb162639ab3732a3a995b64b
OPENROUTER_API_KEY      # (可选) AI 聊天功能
```

**通过 GitHub CLI 配置**:

```bash
# 确保已登录 GitHub CLI
gh auth status

# 添加 Cloudflare secrets
gh secret set CLOUDFLARE_API_TOKEN -b"your-token-here"
gh secret set CLOUDFLARE_ACCOUNT_ID -b"873cd683fb162639ab3732a3a995b64b"

# 添加 OpenRouter API key (可选)
gh secret set OPENROUTER_API_KEY -b"sk-or-v1-your-key-here"

# 验证 secrets 已添加
gh secret list
```

**手动配置** (如果不使用 CLI):
1. 访问: https://github.com/7and1/amiunique/settings/secrets/actions
2. 点击 "New repository secret"
3. 添加上述三个 secrets

### 查看完整配置指南

参见: `.github/SECRETS.md`

---

## 🚀 快速部署流程

### 自动部署 (推荐)

```bash
# 1. 配置 GitHub Secrets (一次性)
gh secret set CLOUDFLARE_API_TOKEN -b"your-token"
gh secret set CLOUDFLARE_ACCOUNT_ID -b"873cd683fb162639ab3732a3a995b64b"

# 2. 提交并推送代码
git add .
git commit -m "feat: add AI chat assistant and deployment workflow"
git push origin main

# 3. GitHub Actions 自动部署！
# 查看进度: https://github.com/7and1/amiunique/actions
```

### 手动部署

```bash
# API
cd apps/api
wrangler deploy --env production

# Web
cd apps/web
pnpm build
wrangler pages deploy .next --project-name=amiunique
```

---
