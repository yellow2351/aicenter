#!/bin/bash

# 运行环境下载脚本
# 下载 Node.js 运行环境并打包到 Android assets

set -e

echo "开始下载运行环境..."

# 配置
NODE_VERSION="20.10.0"
ARCH="arm64"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_ROOT/android/app/src/main/assets"
TEMP_DIR="$PROJECT_ROOT/temp"

mkdir -p "$TEMP_DIR"
mkdir -p "$ASSETS_DIR/runtime"

cd "$TEMP_DIR"

NODE_TAR="node-v${NODE_VERSION}-linux-${ARCH}.tar.gz"
NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/${NODE_TAR}"

echo "下载 Node.js v${NODE_VERSION} (${ARCH})..."
wget -q --timeout=120 -O "$NODE_TAR" "$NODE_URL"

echo "解压 Node.js..."
tar -xzf "$NODE_TAR"

echo "打包运行环境..."
RUNTIME_DIR="runtime"
mkdir -p "$RUNTIME_DIR/bin"
mkdir -p "$RUNTIME_DIR/lib"

cp "node-v${NODE_VERSION}-linux-${ARCH}/bin/node" "$RUNTIME_DIR/bin/"
cp -r "node-v${NODE_VERSION}-linux-${ARCH}/lib" "$RUNTIME_DIR/"

cd "$RUNTIME_DIR"
zip -r -q "../runtime.zip" .
cd ..

mv "runtime.zip" "$ASSETS_DIR/runtime/"

cd "$PROJECT_ROOT"
rm -rf "$TEMP_DIR"

echo "运行环境准备完成: $(du -h "$ASSETS_DIR/runtime/runtime.zip" | cut -f1)"
