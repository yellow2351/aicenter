#!/bin/bash

# Termux Bootstrap 下载和准备脚本
# 下载官方 Termux bootstrap 并打包到 Android assets

set -e

echo "🚀 开始下载和准备 Termux Bootstrap..."

# 配置
TERMUX_VERSION="0.118.1"
ARCH="aarch64"  # 可选: aarch64, arm, x86_64, i686
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_ROOT/android/app/src/main/assets"
TEMP_DIR="$PROJECT_ROOT/temp"

# 创建临时目录
mkdir -p "$TEMP_DIR"
mkdir -p "$ASSETS_DIR/termux-bootstrap"

cd "$TEMP_DIR"

# 下载 Termux bootstrap
echo "📦 下载 Termux bootstrap v${TERMUX_VERSION} (${ARCH})..."
BOOTSTRAP_URL="https://github.com/termux/termux-app/releases/download/v${TERMUX_VERSION}/termux-bootstrap-v${TERMUX_VERSION}+apt.android-${ARCH}.zip"
BOOTSTRAP_FILE="termux-bootstrap-v${TERMUX_VERSION}+apt.android-${ARCH}.zip"

if [ ! -f "$BOOTSTRAP_FILE" ]; then
    echo "   URL: $BOOTSTRAP_URL"
    wget --show-progress -O "$BOOTSTRAP_FILE" "$BOOTSTRAP_URL"
    
    if [ $? -ne 0 ]; then
        echo "❌ 下载失败，尝试备用方案..."
        # 备用方案：使用预编译的 Node.js for Android
        download_prebuilt_node
    fi
else
    echo "✅ Bootstrap 文件已存在，跳过下载"
fi

# 验证文件
if [ -f "$BOOTSTRAP_FILE" ]; then
    echo "✅ Bootstrap 下载完成"
    echo "   文件大小: $(du -h "$BOOTSTRAP_FILE" | cut -f1)"
    
    # 复制到 assets
    cp "$BOOTSTRAP_FILE" "$ASSETS_DIR/termux-bootstrap/bootstrap.zip"
    
    echo "✅ 已复制到 Android assets"
else
    echo "❌ Bootstrap 文件不存在"
    exit 1
fi

# 清理临时文件
cd "$PROJECT_ROOT"
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Termux Bootstrap 准备完成！"
echo ""
echo "📊 文件位置: android/app/src/main/assets/termux-bootstrap/bootstrap.zip"
echo ""
echo "🔨 下一步: 运行 prepare-android-assets.sh"
echo ""

# 备用方案：下载预编译的 Node.js for Android
download_prebuilt_node() {
    echo "🔄 使用预编译 Node.js for Android..."
    
    NODE_VERSION="20.10.0"
    NODE_URL="https://github.com/niclas/nodejs-mobile/releases/download/v${NODE_VERSION}/nodejs-mobile-v${NODE_VERSION}-android-arm64.tar.gz"
    NODE_FILE="nodejs-mobile-v${NODE_VERSION}-android-arm64.tar.gz"
    
    wget --show-progress -O "$NODE_FILE" "$NODE_URL"
    
    if [ $? -eq 0 ]; then
        echo "✅ Node.js for Android 下载完成"
        
        # 解压并重新打包为 bootstrap 格式
        mkdir -p termux-mini/usr
        tar -xzf "$NODE_FILE" -C termux-mini/usr
        
        # 创建最小 bootstrap.zip
        cd termux-mini
        zip -r -q "../$BOOTSTRAP_FILE" .
        cd ..
        
        echo "✅ 已创建最小化 bootstrap"
    else
        echo "❌ 下载失败"
        exit 1
    fi
}
