# 服务审计报告 — 第三方外部依赖逐项分析

> 审计日期: 2026-07-16
> 
> 审计范围: README 中所有非 GitHub 官方的外部 API/SVG/动态图片/统计服务

---

## 一、总览

| # | 当前使用 URL | 服务名称 | 当前托管方 | 是否可自部署 | 自部署方案 |
|---|------------|---------|----------|-----------|----------|
| 1 | `readme-typing-svg.demolab.com` | Readme Typing SVG | Heroku (demolab) | ✅ | Docker / PHP |
| 2 | `komarev.com/ghpvc/` | GitHub Profile Views Counter | 作者自托管 | ✅ | Docker Compose |
| 3 | `img.shields.io` | Shields.io Badges | 项目自托管 | ✅ | Docker |
| 4 | `github-readme-streak-stats.herokuapp.com` | GitHub Readme Streak Stats | **Heroku** ❌ | ✅ | Docker / GitHub Actions |
| 5 | `github-profile-summary-cards.vercel.app` | GitHub Profile Summary Cards | **Vercel** ❌ | ✅ | GitHub Actions（推荐）|
| 6 | `github-readme-activity-graph.vercel.app` | GitHub Readme Activity Graph | **Vercel** ❌ | ⚠️ 仅 Vercel | Vercel 自部署 / 替代方案 |
| 7 | `github-readme-stats-alpha-nine-65.vercel.app` | GitHub Readme Stats | **Vercel** ❌ (**已弃用**) | ✅ | GitHub Stats Extended |
| 8 | `skillicons.dev` | Skill Icons | Cloudflare Workers | ⚠️ 仅 CF Workers | 自部署 Workers / 替代方案 |

**例外（GitHub 官方资源，保留）**：
- `github.com/AliceJump.png` — GitHub 头像 CDN
- `github.githubassets.com` — GitHub 官方资源 CDN（成就徽章）

---

## 二、逐项详细分析

---

### 1. Readme Typing SVG

| 属性 | 值 |
|------|-------|
| **当前 URL** | `readme-typing-svg.demolab.com` |
| **GitHub 仓库** | [DenverCoder1/readme-typing-svg](https://github.com/DenverCoder1/readme-typing-svg) |
| **License** | MIT |
| **Stars** | 9.1k |
| **语言** | PHP |
| **最近更新** | 1 个月前 |
| **是否维护** | ✅ 是 |
| **Docker 支持** | ❌ 无 Dockerfile，但有 `Procfile`（Heroku） |
| **Docker Compose** | ❌ |
| **反向代理** | ✅ 支持 |
| **自定义域名** | ✅ |
| **需 GitHub Token** | ❌ 不需要 |
| **需数据库** | ❌ 不需要 |
| **速率限制** | ❌ 无 |
| **SVG 输出** | ✅ |
| **是否推荐自部署** | ✅ **推荐** — 纯 PHP，部署简单 |

**自部署方式**：
1. 任意支持 PHP 的 Web 服务器（Apache/Nginx + PHP-FPM）
2. 使用 Docker 手动构建（项目本身无 Dockerfile，需自行编写）
3. Heroku（已弃用，因 Heroku 免费计划终止）

---

### 2. GitHub Profile Views Counter

| 属性 | 值 |
|------|-------|
| **当前 URL** | `komarev.com/ghpvc/` |
| **GitHub 仓库** | [antonkomarev/github-profile-views-counter](https://github.com/antonkomarev/github-profile-views-counter) |
| **License** | MIT |
| **Stars** | 5k |
| **语言** | PHP |
| **最近更新** | 10 个月前 |
| **是否维护** | ⚠️ 低活动，但功能稳定 |
| **Docker 支持** | ✅ 有 Dockerfile（`.docker/` 目录） |
| **Docker Compose** | ✅ 有 `docker-compose.yaml` |
| **反向代理** | ✅ 支持 |
| **自定义域名** | ✅ |
| **需 GitHub Token** | ❌ 不需要 |
| **需数据库** | ⚠️ 可选 — 默认文件存储，可选 PostgreSQL/MySQL |
| **速率限制** | ❌ 无 |
| **SVG 输出** | ✅ |
| **是否推荐自部署** | ✅ **推荐** — Docker Compose 一键部署 |

**注意**：作者推荐更强大的替代品 [Ÿ HŸPE](https://yhype.me/)，但那是付费服务。自部署本方案完全可行。

---

### 3. Shields.io Badges

| 属性 | 值 |
|------|-------|
| **当前 URL** | `img.shields.io` |
| **GitHub 仓库** | [badges/shields](https://github.com/badges/shields) |
| **License** | MIT + Apache 2.0 |
| **Stars** | 26.9k |
| **语言** | JavaScript (Node.js) |
| **最近更新** | 2 天前 |
| **是否维护** | ✅ **非常活跃** |
| **Docker 支持** | ✅ 官方 Docker 镜像 |
| **Docker Compose** | ❌ 无官方 compose，但可自行编写 |
| **反向代理** | ✅ 官方文档支持 |
| **自定义域名** | ✅ |
| **需 GitHub Token** | ⚠️ 可选（某些 badge 需要 `GH_TOKEN`） |
| **需数据库** | ❌ 不需要 |
| **速率限制** | ⚠️ 自部署无限制（公共 API 有限制） |
| **SVG 输出** | ✅ |
| **是否推荐自部署** | ✅ **推荐** — 官方 Docker 镜像，文档完善 |

**Docker 镜像**：
- DockerHub: `shieldsio/shields:next`
- GHCR: `ghcr.io/badges/shields:next`

---

### 4. GitHub Readme Streak Stats

| 属性 | 值 |
|------|-------|
| **当前 URL** | `github-readme-streak-stats.herokuapp.com` (Heroku) |
| **GitHub 仓库** | [DenverCoder1/github-readme-streak-stats](https://github.com/DenverCoder1/github-readme-streak-stats) |
| **License** | MIT |
| **Stars** | 7k |
| **语言** | PHP |
| **最近更新** | 1 个月前 |
| **是否维护** | ✅ 是 |
| **Docker 支持** | ✅ 有 Dockerfile（Apache + PHP 8.3 + Inkscape） |
| **Docker Compose** | ❌ 无官方 compose |
| **反向代理** | ✅ 支持 |
| **自定义域名** | ✅ |
| **需 GitHub Token** | ⚠️ 可选（如需私有仓库贡献数据）|
| **需数据库** | ❌ 不需要（可选文件缓存） |
| **SVG 输出** | ✅ |
| **GitHub Actions 支持** | ✅ **有官方 Action** |
| **是否推荐自部署** | ✅ **强烈推荐** — 有 Docker 和 GitHub Actions 两种方案 |

**推荐方案**：优先使用 **GitHub Actions**（生成静态 SVG 提交到仓库），其次 Docker 自部署 API。

---

### 5. GitHub Profile Summary Cards

| 属性 | 值 |
|------|-------|
| **当前 URL** | `github-profile-summary-cards.vercel.app` (Vercel) |
| **GitHub 仓库** | [vn7n24fzkq/github-profile-summary-cards](https://github.com/vn7n24fzkq/github-profile-summary-cards) |
| **License** | MIT |
| **Stars** | 3.6k |
| **语言** | TypeScript |
| **最近更新** | 6 小时前 (**极活跃**) |
| **是否维护** | ✅ **非常活跃** |
| **Docker 支持** | ❌ 无 |
| **Docker Compose** | ❌ |
| **反向代理** | ❌ 不适用 |
| **自定义域名** | ✅（Vercel 自部署） |
| **需 GitHub Token** | ✅ **必需** (PAT) |
| **需数据库** | ❌ 不需要 |
| **SVG 输出** | ✅ |
| **GitHub Actions 支持** | ✅ **有官方 Action** |
| **是否推荐自部署** | ✅ **推荐 GitHub Actions 方案** — 生成静态 SVGs 提交到仓库，完全不依赖外部 API |

**最佳方案**：使用官方 GitHub Action `vn7n24fzkq/github-profile-summary-cards@release`，定时生成静态 SVG 文件到仓库中。

---

### 6. GitHub Readme Activity Graph

| 属性 | 值 |
|------|-------|
| **当前 URL** | `github-readme-activity-graph.vercel.app` (Vercel) |
| **GitHub 仓库** | [Ashutosh00710/github-readme-activity-graph](https://github.com/Ashutosh00710/github-readme-activity-graph) |
| **License** | MIT |
| **Stars** | 2.3k |
| **语言** | TypeScript |
| **最近更新** | 2 个月前 |
| **是否维护** | ⚠️ 低活动 |
| **Docker 支持** | ❌ 无 |
| **Docker Compose** | ❌ |
| **自定义域名** | ✅（Vercel 自部署） |
| **需 GitHub Token** | ⚠️ 可选 |
| **需数据库** | ❌ 不需要 |
| **SVG 输出** | ✅ |
| **替代方案** | 需要寻找可自部署替代品 |

---

### 7. GitHub Readme Stats — **已弃用**

| 属性 | 值 |
|------|-------|
| **当前 URL** | `github-readme-stats-alpha-nine-65.vercel.app` (Vercel) |
| **原始仓库** | [anuraghazra/github-readme-stats](https://github.com/anuraghazra/github-readme-stats) |
| **状态** | ⛔ **已弃用** — 官方不再维护 |
| **License** | MIT |
| **Stars** | 79.8k |
| **最近更新** | 2 周前（弃用通知） |
| **替代方案** | **[GitHub Stats Extended](https://github.com/stats-organization/github-stats-extended)** — 活跃维护的继任者 |
| **GitHub Stats Extended Stars** | 358 |
| **GitHub Stats Extended 最近更新** | 2 天前 |
| **GitHub Stats Extended Docker** | ❌ 无 Docker，仅 Vercel |
| **GitHub Stats Extended GitHub Actions** | ✅ 有 [Action](https://github.com/stats-organization/github-readme-stats-action) |

---

### 8. Skill Icons

| 属性 | 值 |
|------|-------|
| **当前 URL** | `skillicons.dev` |
| **GitHub 仓库** | [tandpfun/skill-icons](https://github.com/tandpfun/skill-icons) |
| **License** | MIT |
| **Stars** | 12.8k |
| **语言** | JavaScript + SVG |
| **最近更新** | 5 个月前 |
| **是否维护** | ⚠️ 中等 |
| **Docker 支持** | ❌ 无 |
| **部署方式** | **Cloudflare Workers**（`wrangler.toml`） |
| **自定义域名** | ✅ |
| **需 GitHub Token** | ❌ 不需要 |
| **需数据库** | ❌ 不需要 |

---

## 三、替代方案搜索

### 3.1 Activity Graph 替代方案

由于 `github-readme-activity-graph` 仅支持 Vercel 部署，以下是替代方案：

| 项目 | Stars | 最近维护 | License | Docker | 自部署复杂度 | SVG 质量 |
|------|-------|---------|---------|--------|------------|---------|
| [Ashutosh00710/github-readme-activity-graph](https://github.com/Ashutosh00710/github-readme-activity-graph) | 2.3k | 2 个月前 | MIT | ❌ | 低（Vercel） | 好 |
| 可自行 Fork 后部署到自有 Vercel | — | — | MIT | ❌ | 低 | 同原版 |

**结论**：Activity Graph 的最佳方案是 **Fork 原仓库，部署到自己的 Vercel 账号**，绑定自定义域名。这是唯一现实的自部署路径。

### 3.2 Skill Icons 替代方案

由于 `skill-icons` 仅部署在 Cloudflare Workers 上：

| 项目 | Stars | 最近维护 | License | Docker | 自部署复杂度 | SVG 质量 |
|------|-------|---------|---------|--------|------------|---------|
| [tandpfun/skill-icons](https://github.com/tandpfun/skill-icons) | 12.8k | 5 个月前 | MIT | ❌ | 低（CF Workers） | 极好 |
| 自行 Fork 部署到自有 CF Workers | — | — | MIT | ❌ | 低 | 同原版 |

**结论**：Fork 后部署到自己的 Cloudflare Workers，绑定自定义域名。

### 3.3 GitHub Stats（已弃用）的完整替代方案

| 项目 | Stars | 最近维护 | License | Docker | 自部署 | Action |
|------|-------|---------|---------|--------|--------|--------|
| [github-stats-extended](https://github.com/stats-organization/github-stats-extended) | 358 | 2 天前 | MIT | ❌ | Vercel | ✅ |
| [github-readme-stats-action](https://github.com/stats-organization/github-readme-stats-action) | — | 活跃 | MIT | — | GitHub Actions | ✅ |

**推荐方案**：使用 `github-stats-extended` 的 GitHub Action 生成静态 SVG。

---

## 四、关键发现

1. **Heroku 实例**（streak-stats）必须替换 — Heroku 免费计划已终止
2. **Vercel 实例**（summary-cards, activity-graph, github-readme-stats）必须替换为自部署版本
3. **demolab.com**（typing-svg）是 Heroku 公共实例，必须替换
4. **komarev.com**（views counter）是作者自托管实例，必须替换
5. **img.shields.io** 是 shields.io 官方实例，必须替换
6. **skillicons.dev** 是 Cloudflare Workers 公共实例，必须替换
7. `github-readme-stats`（anuraghazra）**已弃用**，必须迁移到 `github-stats-extended`
