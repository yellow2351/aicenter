#!/bin/bash

# 运行环境下载脚本
# 下载 Node.js 运行环境并打包到 Android assets

set -e

echo "🚀 开始下载运行环境..."

# 配置
NODE_VERSION="20.10.0"
ARCH="arm64"  # 可选: arm64, armv7l, x64
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_ROOT/android/app/src/main/assets"
TEMP_DIR="$PROJECT_ROOT/temp"

# 创建临时目录
mkdir -p "$TEMP_DIR"
mkdir -p "$ASSETS_DIR/runtime"

cd "$TEMP_DIR"

# 下载 Node.js for Android
echo "📦 下载 Node.js v${NODE_VERSION} (${ARCH})..."
NODE_TAR="node-v${NODE_VERSION}-linux-${ARCH}.tar.gz"
NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_TAR}"

if [ ! -f "$NODE_TAR" ]; then
    wget --show-progress -O "$NODE_TAR" "$NODE_URL"
fi

# 解压 Node.js
echo "📂 解压 Node.js..."
tar -xzf "$NODE_TAR"

# 创建运行时包
echo "📦 打包运行环境..."
RUNTIME_DIR="runtime"
mkdir -p "$RUNTIME_DIR/bin"
mkdir -p "$RUNTIME_DIR/lib"

# 复制必要文件
cp "node-v${NODE_VERSION}-linux-${ARCH}/bin/node" "$RUNTIME_DIR/bin/"
cp -r "node-v${NODE_VERSION}-linux-${ARCH}/lib" "$RUNTIME_DIR/"

# 创建 zip 包
cd "$RUNTIME_DIR"
zip -r -q "../runtime.zip" .
cd ..

# 移动到 assets
mv "runtime.zip" "$ASSETS_DIR/runtime/"

# 清理临时文件
cd "$PROJECT_ROOT"
rm -rf "$TEMP_DIR"

echo ""
echo "✅ 运行环境准备完成！"
echo ""
echo "📊 文件大小: $(du -h "$ASSETS_DIR/runtime/runtime.zip" | cut -f1)"
echo ""
echo "🔨 下一步: 运行 prepare-android-assets.sh"
echo ""
