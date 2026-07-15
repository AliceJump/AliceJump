# =============================================================================
# AliceJump Profile README — 自部署服务管理 Makefile
# =============================================================================
# 用法:
#   make setup    # 首次安装
#   make start    # 启动服务
#   make stop     # 停止服务
#   make restart  # 重启服务
#   make logs     # 查看日志
#   make update   # 更新服务源码并重建
#   make status   # 查看服务状态
#   make clean    # 清理未使用的 Docker 资源
# =============================================================================

COMPOSE_FILE = deploy/docker-compose.yml

.PHONY: setup start stop restart logs update status clean

setup:
	@bash deploy/setup.sh

start:
	@docker compose -f $(COMPOSE_FILE) up -d
	@echo "✓ 服务已启动"

stop:
	@docker compose -f $(COMPOSE_FILE) down
	@echo "✓ 服务已停止"

restart:
	@docker compose -f $(COMPOSE_FILE) down
	@docker compose -f $(COMPOSE_FILE) up -d
	@echo "✓ 服务已重启"

logs:
	@docker compose -f $(COMPOSE_FILE) logs -f

update:
	@echo "更新上游源码..."
	@for dir in deploy/src/*/; do \
		if [ -d "$$dir" ]; then \
			echo "  → 更新 $$dir"; \
			cd "$$dir" && git pull && cd ../..; \
		fi; \
	done
	@docker compose -f $(COMPOSE_FILE) up -d --build
	@echo "✓ 服务已更新并重建"

status:
	@docker compose -f $(COMPOSE_FILE) ps

clean:
	@docker image prune -f
	@echo "✓ 已清理未使用的 Docker 镜像"
