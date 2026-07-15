# 部署步骤

## 前置条件

- 一台 Linux 服务器（Ubuntu 22.04+ / Debian 12+）
- Docker 和 Docker Compose V2
- Nginx 或 Caddy
- 一个域名（例如 `stats.example.com`）
- Cloudflare 账号（用于 Skill Icons 部署）
- Vercel 账号（用于 Activity Graph 部署）

---

## 第一步：初始化服务器

```bash
# 安装 Docker
curl -fsSL https://get.docker.com | bash
sudo usermod -aG docker $USER

# 安装 Docker Compose V2（如未包含）
sudo apt-get update
sudo apt-get install -y docker-compose-plugin

# 安装 Nginx
sudo apt-get install -y nginx

# 安装 Certbot（SSL 证书）
sudo apt-get install -y certbot python3-certbot-nginx
```

---

## 第二步：克隆服务仓库

```bash
# 创建服务源码目录
mkdir -p /opt/alicejump/src
cd /opt/alicejump

# 克隆各服务仓库
git clone https://github.com/DenverCoder1/readme-typing-svg.git src/readme-typing-svg
git clone https://github.com/antonkomarev/github-profile-views-counter.git src/github-profile-views-counter
git clone https://github.com/badges/shields.git src/shields
git clone https://github.com/DenverCoder1/github-readme-streak-stats.git src/github-readme-streak-stats

# 复制本项目的 docker-compose.yml
cp /path/to/alicejump/deploy/docker-compose.yml /opt/alicejump/
```

---

## 第三步：启动 Docker 服务

```bash
cd /opt/alicejump

# 启动所有服务
docker compose up -d

# 检查服务状态
docker compose ps

# 查看日志
docker compose logs -f
```

---

## 第四步：配置 Nginx 反向代理

```bash
# 复制 Nginx 配置
sudo cp /path/to/alicejump/deploy/03-nginx.conf /etc/nginx/sites-available/alicejump.conf

# 编辑配置，替换 YOUR_DOMAIN
sudo sed -i 's/your-domain.com/你的实际域名/g' /etc/nginx/sites-available/alicejump.conf

# 启用站点
sudo ln -sf /etc/nginx/sites-available/alicejump.conf /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

### SSL 证书（HTTPS）

```bash
# 使用 Certbot 获取 SSL 证书
sudo certbot --nginx -d 你的实际域名

# 证书自动续期（Certbot 默认添加了 systemd timer）
sudo certbot renew --dry-run
```

---

## 第五步：部署 Activity Graph（Vercel）

```bash
# 1. Fork 仓库
#    访问 https://github.com/Ashutosh00710/github-readme-activity-graph
#    点击 Fork

# 2. 导入到 Vercel
#    访问 https://vercel.com/new
#    选择刚 Fork 的仓库
#    配置环境变量（可选）
#    部署

# 3. 绑定自定义域名
#    Vercel 项目 Settings → Domains
#    添加 graph.your-domain.com
#    在 DNS 中添加 CNAME 记录指向 cname.vercel-dns.com
```

---

## 第六步：部署 Skill Icons（Cloudflare Workers）

```bash
# 1. Fork 仓库
#    访问 https://github.com/tandpfun/skill-icons
#    点击 Fork

# 2. 安装 Wrangler CLI
npm install -g wrangler

# 3. 登录 Cloudflare
wrangler login

# 4. 修改 wrangler.toml（替换 your-domain）
#    name = "skill-icons"
#    route = { pattern = "icons.your-domain.com/*", zone_name = "your-domain.com" }

# 5. 部署
cd /path/to/forked/skill-icons
wrangler deploy

# 6. 在 Cloudflare Dashboard 中添加自定义域名
```

---

## 第七步：配置 GitHub Actions

1. 将本项目 `.github/workflows/generate-static-cards.yml` 推送到仓库
2. 在仓库 Settings → Secrets and variables → Actions 中添加：
   - `SUMMARY_GITHUB_TOKEN`：GitHub Personal Access Token
3. 手动触发一次 workflow 验证：

```bash
# 在 GitHub 仓库 Actions 页面
# 选择 "Generate Static Profile Cards" → "Run workflow"
```

---

## 第八步：更新 README

将 README 中所有外部 URL 替换为自部署地址：

| 原 URL | 替换为 |
|--------|--------|
| `readme-typing-svg.demolab.com` | `你的域名/typing-svg` |
| `komarev.com/ghpvc/` | `你的域名/ghpvc/` |
| `img.shields.io` | `你的域名/badge` |
| `github-readme-streak-stats.herokuapp.com` | `./profile/streak.svg`（静态文件） |
| `github-profile-summary-cards.vercel.app` | `./profile/summary-cards/`（静态文件） |
| `github-readme-activity-graph.vercel.app` | `graph.你的域名` |
| `github-readme-stats-alpha-nine-65.vercel.app` | `./profile/stats/`（静态文件） |
| `skillicons.dev` | `icons.你的域名` |

---

## 部署架构图

```
用户浏览器
    │
    ▼
Cloudflare CDN
    │
    ▼
Nginx/Caddy (HTTPS 终止 + 反向代理)
    │
    ├── /typing-svg/*  ──→  Docker: typing-svg (PHP 8.3)
    ├── /ghpvc/*       ──→  Docker: views-counter (PHP)
    ├── /badge/*       ──→  Docker: shields (Node.js)
    ├── /streak/*      ──→  Docker: streak-stats (PHP)
    ├── /static/*      ──→  本地静态文件 (GitHub Actions 生成)
    │
    ├── graph.*        ──→  Vercel (Activity Graph)
    │
    └── icons.*        ──→  Cloudflare Workers (Skill Icons)
```

---

## 自动更新方案

### Docker 服务自动更新

```bash
# 创建自动更新脚本 /usr/local/bin/update-alicejump.sh
cat > /usr/local/bin/update-alicejump.sh << 'EOF'
#!/bin/bash
cd /opt/alicejump

# 更新源码
for repo in src/*/; do
    cd "$repo"
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null
    cd /opt/alicejump
done

# 重建并重启
docker compose pull
docker compose up -d --build
docker image prune -f
EOF

chmod +x /usr/local/bin/update-alicejump.sh

# 添加 crontab（每周日凌晨 4:00 更新）
(crontab -l 2>/dev/null; echo "0 4 * * 0 /usr/local/bin/update-alicejump.sh") | crontab -
```

### GitHub Actions 自动更新

静态 SVG 卡片已通过 `.github/workflows/generate-static-cards.yml` 每天自动更新。
