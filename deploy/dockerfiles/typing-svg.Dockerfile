# =============================================================================
# Readme Typing SVG — 自部署 Dockerfile
# 仓库: https://github.com/DenverCoder1/readme-typing-svg
# 基础镜像: php:8.3-apache
# =============================================================================

FROM php:8.3-apache

LABEL maintainer="AliceJump" \
      description="Self-hosted Readme Typing SVG" \
      source="https://github.com/DenverCoder1/readme-typing-svg"

# 安装系统依赖和 PHP 扩展
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libicu-dev \
        curl \
    && docker-php-ext-configure intl \
    && docker-php-ext-install intl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 启用 Apache mod_rewrite
RUN a2enmod rewrite headers

# 配置 Apache
WORKDIR /var/www/html

# 从源码构建：克隆上游仓库
RUN git clone --depth 1 --branch main \
    https://github.com/DenverCoder1/readme-typing-svg.git /tmp/repo \
    && cp -r /tmp/repo/src/. /var/www/html/ \
    && cp /tmp/repo/composer.json /var/www/html/ \
    && cp /tmp/repo/composer.lock /var/www/html/ \
    && rm -rf /tmp/repo

# 安装 Composer 依赖
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 设置权限
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/?lines=OK || exit 1
