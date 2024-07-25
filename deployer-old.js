#!/bin/bash

# Cấu hình các biến
REPO_URL="https://github.com/2508roblox/laravel_ci_cd.git"
APP_DIR="/var/www/laravel_ci_cd"
BRANCH="main"
PHP_VERSION="8.2"
NGINX_SITE="/etc/nginx/sites-available/laravel_ci_cd"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/laravel_ci_cd"

# Cập nhật hệ thống
echo "Updating system..."
sudo apt update
sudo apt upgrade -y

# Cài đặt Git (nếu chưa cài đặt)
if ! command -v git &> /dev/null
then
    echo "Git not found, installing..."
    sudo apt install git -y
fi

# Cài đặt PHP và các phần mở rộng cần thiết
echo "Installing PHP and extensions..."
sudo apt install php$PHP_VERSION-fpm php$PHP_VERSION-mysql php$PHP_VERSION-xml php$PHP_VERSION-mbstring php$PHP_VERSION-curl php$PHP_VERSION-zip php$PHP_VERSION-gd -y

# Cài đặt Nginx (nếu chưa cài đặt)
if ! command -v nginx &> /dev/null
then
    echo "Nginx not found, installing..."
    sudo apt install nginx -y
fi

# Tải mã nguồn về
echo "Cloning repository..."
if [ -d "$APP_DIR" ]; then
    echo "Directory $APP_DIR already exists. Pulling latest changes..."
    cd $APP_DIR
    git pull origin $BRANCH
else
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# Cài đặt Composer và các phụ thuộc PHP
echo "Installing Composer..."
if ! command -v composer &> /dev/null
then
    echo "Composer not found, installing..."
    curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer
fi

echo "Installing PHP dependencies..."
composer install --no-dev --optimize-autoloader

# Cài đặt quyền truy cập cho các thư mục cần thiết
echo "Setting permissions..."
sudo chown -R www-data:www-data $APP_DIR/storage
sudo chown -R www-data:www-data $APP_DIR/bootstrap/cache

# Cập nhật cấu hình Nginx
echo "Updating Nginx configuration..."
if [ -f "$NGINX_SITE_ENABLED" ]; then
    sudo rm $NGINX_SITE_ENABLED
fi
sudo ln -s $NGINX_SITE $NGINX_SITE_ENABLED

# Kiểm tra và khởi động lại Nginx
echo "Testing Nginx configuration..."
sudo nginx -t
echo "Restarting Nginx..."
sudo systemctl restart nginx

# Khởi động lại PHP-FPM
echo "Restarting PHP-FPM..."
sudo systemctl restart php$PHP_VERSION-fpm

# Kết thúc
echo "Deployment completed successfully!"
