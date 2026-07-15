# =============================================================================
# GitHub Profile Views Counter — 自部署 Dockerfile
# 仓库: https://github.com/antonkomarev/github-profile-views-counter
# 基础镜像: php:8.3-apache
# =============================================================================

FROM php:8.3-apache

LABEL maintainer="AliceJump" \
      description="Self-hosted GitHub Profile Views Counter" \
      source="https://github.com/antonkomarev/github-profile-views-counter"

# 安装系统依赖和 PHP 扩展
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libicu-dev \
        libpq-dev \
        libsqlite3-dev \
        curl \
    && docker-php-ext-configure intl \
    && docker-php-ext-install intl pdo pdo_mysql pdo_pgsql pdo_sqlite \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安装 Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# 克隆上游仓库
RUN git clone --depth 1 --branch master \
    https://github.com/antonkomarev/github-profile-views-counter.git /tmp/repo \
    && cp -r /tmp/repo/. /app/ \
    && rm -rf /tmp/repo

# 安装 PHP 依赖
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 配置 Apache 以 public/ 为 DocumentRoot
RUN a2enmod rewrite && \
    echo '<VirtualHost *:80>\n\
        ServerAdmin webmaster@localhost\n\
        DocumentRoot /app/public\n\
        <Directory /app/public>\n\
            Options -Indexes\n\
            AllowOverride All\n\
            Require all granted\n\
        </Directory>\n\
        ErrorLog ${APACHE_LOG_DIR}/error.log\n\
        CustomLog ${APACHE_LOG_DIR}/access.log combined\n\
    </VirtualHost>' > /etc/apache2/sites-available/000-default.conf

# 存储目录（SQLite 文件存储）
RUN mkdir -p /app/storage && \
    chown -R www-data:www-data /app && \
    chmod -R 755 /app && \
    chmod 775 /app/storage

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/ghpvc/?username=test || exit 1
