# =============================================================================
# GitHub Readme Streak Stats — 自部署 Dockerfile
# 仓库: https://github.com/DenverCoder1/github-readme-streak-stats
# 基础镜像: php:8.3-apache
# 参考上游 Dockerfile 适配
# =============================================================================

FROM php:8.3-apache

LABEL maintainer="AliceJump" \
      description="Self-hosted GitHub Readme Streak Stats" \
      source="https://github.com/DenverCoder1/github-readme-streak-stats"

# 安装系统依赖和 PHP 扩展
RUN apt-get update && apt-get install -y --no-install-recommends \
        git \
        unzip \
        libicu-dev \
        inkscape \
        fonts-dejavu-core \
        curl \
    && docker-php-ext-configure intl \
    && docker-php-ext-install intl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 安装 Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# 克隆上游仓库并复制源码
RUN git clone --depth 1 --branch main \
    https://github.com/DenverCoder1/github-readme-streak-stats.git /tmp/repo \
    && cp -r /tmp/repo/src/. /var/www/html/ \
    && cp /tmp/repo/composer.json /var/www/html/ \
    && cp /tmp/repo/composer.lock /var/www/html/ \
    && rm -rf /tmp/repo

# 安装 PHP 依赖
RUN composer install --no-dev --optimize-autoloader --no-interaction

# 配置 Apache
RUN a2enmod rewrite headers && \
    echo 'ServerTokens Prod\n\
    ServerSignature Off\n\
    PassEnv TOKEN\n\
    <VirtualHost *:80>\n\
        ServerAdmin webmaster@localhost\n\
        DocumentRoot /var/www/html\n\
        <Directory /var/www/html>\n\
            Options -Indexes\n\
            AllowOverride None\n\
            Require all granted\n\
            Header always set Access-Control-Allow-Origin "*"\n\
            Header always set Content-Security-Policy "default-src '"'"'none'"'"'; style-src '"'"'unsafe-inline'"'"'; img-src data:;"\n\
            Header always set Referrer-Policy "no-referrer-when-downgrade"\n\
            Header always set X-Content-Type-Options "nosniff"\n\
        </Directory>\n\
        ErrorLog ${APACHE_LOG_DIR}/error.log\n\
        CustomLog ${APACHE_LOG_DIR}/access.log combined\n\
    </VirtualHost>' > /etc/apache2/sites-available/000-default.conf

# 缓存目录
RUN mkdir -p /var/www/html/cache && \
    chown -R www-data:www-data /var/www/html && \
    find /var/www/html -type d -exec chmod 755 {} \; && \
    find /var/www/html -type f -exec chmod 644 {} \; && \
    chmod 775 /var/www/html/cache

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/?user=AliceJump || exit 1
