#!/bin/bash
# =============================================================================
# AliceJump 自部署服务 — 一键安装脚本
# =============================================================================
# 用法:
#   chmod +x deploy/setup.sh
#   ./deploy/setup.sh
#
# 功能:
#   1. 克隆所有上游仓库到 deploy/src/
#   2. 构建并启动 Docker 服务
#   3. 检查服务健康状态
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo " AliceJump 自部署服务安装脚本"
echo "=========================================="

# ---------------------------------------------------------------------------
# 步骤 1: 克隆上游仓库
# ---------------------------------------------------------------------------
echo ""
echo "[1/4] 克隆上游仓库..."

mkdir -p src

clone_repo() {
    local url=$1
    local dir=$2
    local branch=${3:-main}
    if [ ! -d "src/$dir" ]; then
        echo "  → 克隆 $dir ..."
        git clone --depth 1 --branch "$branch" "$url" "src/$dir"
    else
        echo "  → $dir 已存在，更新中..."
        cd "src/$dir" && git pull origin "$branch" && cd "$SCRIPT_DIR"
    fi
}

clone_repo "https://github.com/DenverCoder1/readme-typing-svg.git" "readme-typing-svg" "main"
clone_repo "https://github.com/antonkomarev/github-profile-views-counter.git" "github-profile-views-counter" "master"
clone_repo "https://github.com/badges/shields.git" "shields" "master"
clone_repo "https://github.com/DenverCoder1/github-readme-streak-stats.git" "github-readme-streak-stats" "main"

echo "  ✓ 仓库克隆完成"

# ---------------------------------------------------------------------------
# 步骤 2: 检查 Docker
# ---------------------------------------------------------------------------
echo ""
echo "[2/4] 检查 Docker 环境..."

if ! command -v docker &>/dev/null; then
    echo "  ✗ Docker 未安装！请先安装 Docker："
    echo "    curl -fsSL https://get.docker.com | bash"
    exit 1
fi

if ! docker compose version &>/dev/null; then
    echo "  ✗ Docker Compose V2 不可用！"
    exit 1
fi

echo "  ✓ Docker 可用: $(docker --version)"
echo "  ✓ Docker Compose: $(docker compose version)"

# ---------------------------------------------------------------------------
# 步骤 3: 构建并启动服务
# ---------------------------------------------------------------------------
echo ""
echo "[3/4] 构建并启动 Docker 服务..."

docker compose -f docker-compose.yml build --parallel
docker compose -f docker-compose.yml up -d

echo "  ✓ 所有服务已启动"

# ---------------------------------------------------------------------------
# 步骤 4: 健康检查
# ---------------------------------------------------------------------------
echo ""
echo "[4/4] 健康检查..."

sleep 3

services=(
    "typing-svg:http://localhost:8081/?lines=OK"
    "views-counter:http://localhost:8082/ghpvc/?username=test"
    "shields:http://localhost:8083/"
    "streak-stats:http://localhost:8084/?user=AliceJump"
)

for service in "${services[@]}"; do
    name="${service%%:*}"
    url="${service#*:}"
    if docker compose exec -T "$name" curl -sf -o /dev/null "$url" 2>/dev/null; then
        echo "  ✓ $name 健康检查通过"
    else
        echo "  ⚠ $name 健康检查待确认（服务可能仍在启动）"
    fi
done

echo ""
echo "=========================================="
echo " ✅ AliceJump 自部署服务安装完成！"
echo "=========================================="
echo ""
echo "服务端口映射:"
echo "  Typing SVG  :8081  → 反向代理 /typing-svg/"
echo "  Views Counter:8082 → 反向代理 /ghpvc/"
echo "  Shields.io  :8083  → 反向代理 /badge/"
echo "  Streak Stats:8084  → 反向代理 /streak/"
echo ""
echo "查看日志: docker compose -f $SCRIPT_DIR/docker-compose.yml logs -f"
echo "停止服务: docker compose -f $SCRIPT_DIR/docker-compose.yml down"
echo ""
