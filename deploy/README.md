# AliceJump Profile README — 自部署方案

## 📋 文件清单

| 文件 | 说明 |
|------|------|
| [`01-service-audit.md`](./01-service-audit.md) | 服务审计报告 |
| [`02-docker-compose.yml`](./02-docker-compose.yml) | Docker Compose — 一键启动所有服务 |
| [`03-nginx.conf`](./03-nginx.conf) | Nginx 反向代理配置 |
| [`04-caddyfile`](./04-caddyfile) | Caddy 反向代理配置（自动 HTTPS） |
| [`05-env-config.md`](./05-env-config.md) | 环境变量配置说明 |
| [`06-deployment-steps.md`](./06-deployment-steps.md) | 完整部署步骤 |
| [`07-maintenance.md`](./07-maintenance.md) | 维护建议与风险说明 |
| [`setup.sh`](./setup.sh) | **一键安装脚本** |
| [`.env.example`](./.env.example) | 环境变量模板 |
| [`wrangler.toml`](./wrangler.toml) | Cloudflare Workers 配置（Skill Icons） |
| [`dockerfiles/`](./dockerfiles/) | Docker 镜像构建文件 |
| `dockerfiles/typing-svg.Dockerfile` | Readme Typing SVG Dockerfile |
| `dockerfiles/streak-stats.Dockerfile` | Streak Stats Dockerfile |
| `dockerfiles/views-counter.Dockerfile` | Views Counter Dockerfile |
| [`../Makefile`](../Makefile) | 根目录管理命令 |
| [`../.github/workflows/generate-static-cards.yml`](../.github/workflows/generate-static-cards.yml) | GitHub Actions — 自动生成静态 SVG |

## 🔄 服务替换总览

| # | 服务 | 原域名 | 新地址 | 部署方式 | 费用 |
|---|------|--------|--------|---------|------|
| 1 | Typing SVG | `demolab.com` | `https://${DOMAIN}/typing-svg` | **Docker** | 自备服务器 |
| 2 | Views Counter | `komarev.com` | `https://${DOMAIN}/ghpvc/` | **Docker** | 自备服务器 |
| 3 | Shields.io | `img.shields.io` | `https://${DOMAIN}/badge` | **Docker** | 自备服务器 |
| 4 | Streak Stats | `herokuapp.com` | `./profile/streak.svg` | **GitHub Actions** | 免费 ✅ |
| 5 | Summary Cards | `vercel.app` | `./profile/summary-cards/*.svg` | **GitHub Actions** | 免费 ✅ |
| 6 | Activity Graph | `vercel.app` | `https://graph.${DOMAIN}` | **Vercel** (Fork) | 免费 ✅ |
| 7 | GitHub Stats | `vercel.app` ❌已弃用 | `alpha-nine-65.vercel.app` | **Vercel** (已有) | 免费 ✅ |
| 8 | Skill Icons | `skillicons.dev` | `https://icons.${DOMAIN}` | **CF Workers** (Fork) | 免费 ✅ |

## 🚀 快速开始

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | bash

# 2. 一键安装所有服务
make setup
# 或: bash deploy/setup.sh

# 3. 配置域名 → 反向代理
#    详见 03-nginx.conf 或 04-caddyfile

# 4. 配置 GitHub Secrets
#    在 Settings → Secrets → Actions 添加 SUMMARY_GITHUB_TOKEN

# 5. 部署 Serverless 服务（免费）:
#    - Fork Activity Graph → Vercel → 绑定 graph.${DOMAIN}
#    - Fork Skill Icons → Cloudflare Workers → 绑定 icons.${DOMAIN}
```

## 💰 费用预算

| 项目 | 费用 | 说明 |
|------|------|------|
| Docker 服务器 | 按需 | Oracle Cloud 免费 ARM 实例 / 或最低配 VPS |
| GitHub Actions | 免费 | 每月 2000 分钟免费额度 |
| Vercel | 免费 | 100h 函数运行/月，足够个人使用 |
| Cloudflare Workers | 免费 | 10 万请求/天，足够 Profile README |
| 域名 | 按需 | 约 ¥30-100/年 |

## ⚠️ 关键步骤

1. **必须先创建 `SUMMARY_GITHUB_TOKEN`**，否则 GitHub Actions 无法生成卡片
2. Docker 服务依赖 `setup.sh` 克隆上游源码后构建
3. Activity Graph 和 Skill Icons 需要 Fork 后部署到各自平台
4. 统计卡片（Streak Stats / Summary Cards）使用 GitHub Actions 生成静态文件，零服务器开销
