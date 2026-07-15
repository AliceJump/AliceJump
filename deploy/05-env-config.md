# 环境变量配置说明

## 一、GitHub Secrets（Actions 使用）

以下 secrets 需要在 GitHub 仓库的 Settings → Secrets and variables → Actions 中配置：

| Secret | 用途 | 是否必需 | 说明 |
|--------|------|---------|------|
| `SUMMARY_GITHUB_TOKEN` | 用于 Profile Summary Cards 和 Stats Extended 的 API 调用 | ✅ 必需 | Fine-grained PAT，Public Repositories (read-only)，无过期 |
| `GITHUB_TOKEN` | 内置 Token，由 GitHub 自动提供 | ✅ 自动 | 需要在 workflow 中添加 `permissions: contents: write` |

### 创建 PAT 步骤

1. 访问 https://github.com/settings/personal-access-tokens/new
2. **Token name**: `alicejump-profile-cards`
3. **Expiration**: 90 天（或更长）
4. **Repository access**: `Public Repositories (read-only)`
5. **Permissions**: 默认即可（Metadata: read 自动包含）
6. 生成后复制 token 值
7. 在仓库 Settings → Secrets and variables → Actions → New repository secret
8. Name: `SUMMARY_GITHUB_TOKEN`，Value: 粘贴 token

---

## 二、Docker Compose 环境变量

### 2.1 Shields.io

| 变量 | 示例值 | 说明 |
|------|--------|------|
| `PORT` | `8080` | 服务端口 |
| `GH_TOKEN` | `ghp_xxx` | GitHub Token（可选，提高 API 速率限制） |
| `SENTRY_DSN` | (可选) | Sentry 错误追踪 |

### 2.2 GitHub Readme Streak Stats

| 变量 | 示例值 | 说明 |
|------|--------|------|
| `TOKEN` | `ghp_xxx` | GitHub Token（可选，显示私有仓库贡献） |
| `WHITELIST` | (可选) | IP 白名单 |

### 2.3 GitHub Profile Views Counter

| 变量 | 示例值 | 说明 |
|------|--------|------|
| `DB_CONNECTION` | `sqlite` | 数据库类型：`sqlite`（文件）或 `pgsql`、`mysql` |
| `DB_HOST` | `views-counter-db` | PostgreSQL 主机名 |
| `DB_PORT` | `5432` | PostgreSQL 端口 |
| `DB_DATABASE` | `views_counter` | 数据库名 |
| `DB_USERNAME` | `views_counter` | 数据库用户名 |
| `DB_PASSWORD` | `change_me` | 数据库密码 |

---

## 三、占位符配置

以下占位符需要在部署时替换：

| 占位符 | 说明 | 替换为 |
|--------|------|--------|
| `your-domain.com` | 主域名 | 你的实际域名 |
| `YOUR_DOMAIN` | 主域名（大写上下文） | 你的实际域名 |

---

## 四、推荐配置总结

| 服务 | 部署方式 | Token 需求 | 备注 |
|------|---------|-----------|------|
| Readme Typing SVG | Docker Compose | 不需要 | PHP + Apache |
| Views Counter | Docker Compose | 不需要 | SQLite 存储，无需数据库 |
| Shields.io | Docker Compose | 可选 GH_TOKEN | 官方镜像 |
| Streak Stats | GitHub Actions | GITHUB_TOKEN | 生成静态 SVG |
| Summary Cards | GitHub Actions | SUMMARY_GITHUB_TOKEN | 生成静态 SVG |
| Stats Extended | GitHub Actions | SUMMARY_GITHUB_TOKEN | 生成静态 SVG |
| Activity Graph | Vercel 自部署 | 可选 | Fork + 自定义域名 |
| Skill Icons | Cloudflare Workers | 不需要 | Fork + 自定义域名 |
