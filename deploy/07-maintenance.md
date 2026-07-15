# 维护建议与风险说明

## 一、日常维护清单

| 频率 | 任务 | 说明 |
|------|------|------|
| **每日** | GitHub Actions 自动执行 | 静态 SVG 卡片自动更新 |
| **每周** | 检查服务健康状态 | `docker compose ps`，检查所有容器运行中 |
| **每周** | 检查日志 | `docker compose logs --tail=50` |
| **每月** | 更新各服务源码 | 执行自动更新脚本或手动 `git pull` |
| **每月** | 更新 Docker 镜像 | `docker compose pull && docker compose up -d` |
| **每季度** | 检查 SSL 证书 | Certbot 自动续期，但需确认 cron 正常运行 |
| **每季度** | 检查磁盘使用 | `docker system df`，清理不必要的镜像和卷 |
| **按需** | 更新 GitHub Token | PAT 过期前更新 `SUMMARY_GITHUB_TOKEN` |

---

## 二、各服务维护要点

### 2.1 Readme Typing SVG (PHP)
- **维护成本**: 低
- **注意事项**: 
  - 需要 PHP 8.3+ 支持
  - 无需数据库，无状态服务
  - 代码更新频率低，很少需要手动干预

### 2.2 GitHub Profile Views Counter (PHP)
- **维护成本**: 低
- **注意事项**:
  - 如果使用 SQLite 存储，数据文件在 Docker volume 中，备份该 volume
  - 如果使用 PostgreSQL，需定期备份数据库
  - 项目更新不频繁，但功能稳定
  - **计数器不能迁移**：更换实例会丢失计数

### 2.3 Shields.io Badges (Node.js)
- **维护成本**: 中
- **注意事项**:
  - 官方 Docker 镜像频繁更新（每周多次）
  - 建议每月拉取最新镜像
  - 如果配置了 `GH_TOKEN`，留意 Token 有效性
  - 内存使用约 200-500MB

### 2.4 GitHub Readme Streak Stats (PHP + Docker)
- **维护成本**: 低（推荐 GitHub Actions 方式）
- **注意事项**:
  - Docker 方式需要 PHP 8.3 + Apache
  - GitHub Actions 方式零维护，推荐优先使用

### 2.5 Profile Summary Cards (GitHub Actions)
- **维护成本**: 接近零
- **注意事项**:
  - 依赖 GitHub Actions 正常运行
  - 注意 `SUMMARY_GITHUB_TOKEN` 的过期时间
  - Cards 每天更新一次，缓存最多 24 小时
  - 静态文件无 API 调用开销，加载极快

### 2.6 Activity Graph (Vercel)
- **维护成本**: 低
- **注意事项**:
  - Vercel 免费计划有每月 100 小时函数运行时间限制
  - 建议绑定自定义域名
  - 如需更高可用性，可考虑 Vercel Pro ($20/月)

### 2.7 GitHub Stats Extended (GitHub Actions)
- **维护成本**: 接近零
- **注意事项**:
  - 同 Profile Summary Cards，由 Actions 生成静态文件
  - 是 `github-readme-stats` 的官方继任者

### 2.8 Skill Icons (Cloudflare Workers)
- **维护成本**: 低
- **注意事项**:
  - Cloudflare Workers 免费计划每天 10 万请求
  - 对于个人 Profile README，请求量远低于此限制
  - 如需更高配额，升级到 Workers Paid ($5+/月)

---

## 三、风险与限制说明

### 3.1 已知风险

| 风险 | 等级 | 说明 | 缓解措施 |
|------|------|------|---------|
| 自部署服务器宕机 | 🔴 高 | 所有服务同时不可用 | 使用 Cloudflare CDN 缓存，考虑多节点部署 |
| GitHub Token 过期 | 🟡 中 | Actions 生成的静态卡片无法更新 | 设置日历提醒，提前更新 PAT |
| Docker 镜像漏洞 | 🟡 中 | 基础镜像可能存在 CVE | 定期 `docker compose pull` 更新 |
| 磁盘空间耗尽 | 🟡 中 | Docker 日志和镜像占用磁盘 | 配置日志轮转，定期清理 |
| SSL 证书续期失败 | 🟡 中 | 导致 HTTPS 不可用 | 监控 Certbot 续期状态 |
| 上游项目停止维护 | 🟢 低 | 某个服务不再更新 | 提前寻找替代方案 |
| Vercel 免费计划变更 | 🟢 低 | 可能影响 Activity Graph | 准备替代方案 |
| GitHub Actions 配额超限 | 🟢 低 | 免费账号每月 2000 分钟 | 当前 workflow 运行 < 1 分钟/次 |

### 3.2 限制说明

1. **Views Counter 计数器值会丢失**：如果重新部署 Docker 容器且未保留 volume，计数归零
2. **Vercel 函数冷启动**：Activity Graph 在长时间未访问后首次加载可能较慢（1-3 秒）
3. **静态卡片延迟**：GitHub Actions 每天更新一次，统计数据最多有 24 小时延迟
4. **Shields.io 功能子集**：自部署的 Shields 默认不包含所有第三方服务 badge（需额外配置 Token）
5. **域名 DNS 传播**：修改 DNS 记录后可能需要 10 分钟到 48 小时全球生效

### 3.3 什么是你可以保留的

| 资源 | 原因 |
|------|------|
| `github.com/AliceJump.png` | GitHub 官方 Avatar CDN |
| `github.githubassets.com` | GitHub 官方资源 CDN（成就徽章） |
| `github.com/...` 链接 | 指向 GitHub 自身的链接，非 API |

---

## 四、故障恢复

### 4.1 服务不可用

```bash
# 1. 检查 Docker 容器状态
docker compose ps

# 2. 查看特定服务日志
docker compose logs --tail=100 <service-name>

# 3. 重启服务
docker compose restart <service-name>

# 4. 重新构建并启动
docker compose up -d --build <service-name>

# 5. 如果以上均无效，重启 Docker
sudo systemctl restart docker
docker compose up -d
```

### 4.2 GitHub Actions 失败

```bash
# 1. 检查 Actions 运行日志（GitHub Web UI）
# 2. 确认 SUMMARY_GITHUB_TOKEN 未过期
# 3. 重新触发 workflow
```

### 4.3 SSL 证书问题

```bash
# 手动续期
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### 4.4 磁盘空间不足

```bash
# 清理 Docker 无用资源
docker system prune -a --volumes

# 清理 Nginx 日志
sudo truncate -s 0 /var/log/nginx/*.log

# 查看磁盘使用
df -h
du -sh /var/lib/docker/
```
