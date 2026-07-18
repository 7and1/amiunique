# AmiUnique.io 下一步操作指南

## 当前状态 ✅

- ✅ D1 数据库已配置并迁移
- ✅ KV Namespace 已配置（开发 + 生产）
- ✅ API Worker 已部署（开发 + 生产版本）
- ✅ 前端已部署到 Pages: https://amiunique.pages.dev
- ⚠️ API Worker 无法通过 workers.dev 访问（需要配置域名）

---

## 🚀 立即行动（3 步完成部署）

### 步骤 1: 配置 API Worker 访问

**方法 A: 使用自定义域名（推荐生产）**

1. 登录 Cloudflare Dashboard: https://dash.cloudflare.com
2. 添加域名到 Cloudflare（如果还没有）
3. 编辑 `apps/api/wrangler.toml`，取消注释：

```toml
[env.production.routes]
pattern = "api.amiunique.io/*"
zone_name = "amiunique.io"
```

4. 重新部署:

```bash
cd apps/api
wrangler deploy --env production
```

**方法 B: 启用 workers.dev 子域名（快速测试）**

1. Dashboard → Workers & Pages → Settings
2. 找到 "workers.dev subdomain" 设置
3. 启用并记录实际子域名（可能不是 "difft"）
4. 使用该 URL 进行测试

---

### 步骤 2: 配置前端 API URL

1. Dashboard → Pages → amiunique → Settings → Environment variables
2. 添加环境变量（Production 和 Preview）:
   - 名称: `NEXT_PUBLIC_API_URL`
   - 值: `https://api.amiunique.io`（或您的 API URL）
3. 重新部署前端:

```bash
cd apps/web
pnpm build
wrangler pages deploy out --project-name=amiunique --commit-dirty=true
```

---

### 步骤 3: 端到端验证

```bash
# 1. 测试 API
curl https://api.amiunique.io/api/health
curl https://api.amiunique.io/api/stats
curl -X POST https://api.amiunique.io/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"hw_canvas_hash":"test_123","sys_platform":"MacIntel"}'

# 2. 测试前端
# 访问 https://amiunique.pages.dev
# 点击 "Scan Now" → 应该成功提交指纹并显示结果

# 3. 查看数据库
wrangler d1 execute amiunique-db --remote \
  --command="SELECT COUNT(*) as total FROM visits"
```

---

## 📋 验证清单

- [ ] API Worker 可通过域名访问
- [ ] API /health 端点返回 200
- [ ] API /stats 端点返回统计数据
- [ ] API /analyze 端点接受指纹数据
- [ ] 前端页面正常加载
- [ ] 前端可以收集指纹
- [ ] 前端可以提交到 API
- [ ] 结果页面显示 Three-Lock 哈希
- [ ] 数据库中有访问记录
- [ ] Cron 任务正常执行（查看 Worker 日志）

---

## 🔧 故障排查

### API Worker 无法访问

```bash
# 检查部署状态
cd apps/api
wrangler deployments list

# 查看实时日志
wrangler tail amiunique-api --env production

# 测试本地（连接远程资源）
wrangler dev --remote
```

### 前端无法连接 API

```bash
# 检查环境变量
# Dashboard → Pages → amiunique → Settings → Environment variables
# 确保 NEXT_PUBLIC_API_URL 已设置

# 查看浏览器控制台
# 打开 https://amiunique.pages.dev
# F12 → Console → 查看是否有 CORS 或网络错误
```

### 数据库查询失败

```bash
# 验证数据库连接
wrangler d1 execute amiunique-db --remote --command="SELECT 1"

# 检查表结构
wrangler d1 execute amiunique-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

---

## 📊 监控和维护

### 查看实时日志

```bash
# Worker 日志
wrangler tail amiunique-api

# Pages 部署日志
wrangler pages deployment tail
```

### 查看统计数据

```bash
# 总访问量
wrangler d1 execute amiunique-db --remote \
  --command="SELECT COUNT(*) FROM visits"

# 最近访问
wrangler d1 execute amiunique-db --remote \
  --command="SELECT created_at, meta_browser FROM visits ORDER BY created_at DESC LIMIT 10"
```

### Cloudflare Dashboard 监控

- **Analytics**: Workers & Pages → amiunique-api → Metrics
- **错误率**: Real-time logs → Filter by "error"
- **请求量**: Pages → amiunique → Analytics

---

## 🆘 需要帮助？

1. **文档**:
   - `DEPLOYMENT.md` - 完整部署报告
   - `BLUEPRINT.md` - 技术规范
   - `CLAUDE.md` - Claude Code 指南

2. **Cloudflare 资源**:
   - Workers 文档: https://developers.cloudflare.com/workers/
   - D1 文档: https://developers.cloudflare.com/d1/
   - Pages 文档: https://developers.cloudflare.com/pages/

3. **本地测试**:

```bash
# API 本地开发
cd apps/api && wrangler dev

# 前端本地开发
cd apps/web && pnpm dev
```

---

**最后更新**: 2025-12-09
**项目路径**: repository root
