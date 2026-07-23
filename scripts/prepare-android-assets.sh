#!/bin/bash

# AI Agent 中控台 - Android 资源准备脚本
# 准备完全内置的运行环境（用户无感知）

set -e

echo "🚀 开始准备 Android 资源..."

# 配置
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_ROOT/android/app/src/main/assets"

cd "$PROJECT_ROOT"

# 检查运行环境是否存在
RUNTIME_FILE="$ASSETS_DIR/runtime/runtime.zip"
if [ ! -f "$RUNTIME_FILE" ]; then
    echo "⚠️  运行环境不存在，开始下载..."
    chmod +x scripts/download-runtime.sh
    ./scripts/download-runtime.sh
fi

# 创建 assets 目录
echo "📁 创建 assets 目录..."
mkdir -p "$ASSETS_DIR/app"

# 复制应用文件
echo "📋 复制应用文件..."

# 复制核心文件
cp -r server.js "$ASSETS_DIR/app/"
cp -r package.json "$ASSETS_DIR/app/"
cp -r public "$ASSETS_DIR/app/"
cp -r services "$ASSETS_DIR/app/"
[ -d utils ] && [ "$(ls -A utils)" ] && cp -r utils "$ASSETS_DIR/app/" || true
cp -r config "$ASSETS_DIR/app/"

# 安装应用依赖
echo "📦 安装应用依赖..."
cd "$ASSETS_DIR/app"

# 检查是否有 npm
if command -v npm &> /dev/null; then
    npm install --production
    
    # 清理不必要的文件
    echo "🧹 清理不必要的文件..."
    rm -rf node_modules/.cache
    find node_modules -name "*.md" -delete 2>/dev/null || true
    find node_modules -name "LICENSE" -delete 2>/dev/null || true
    find node_modules -name "CHANGELOG" -delete 2>/dev/null || true
    find node_modules -name ".npmignore" -delete 2>/dev/null || true
    find node_modules -name "*.ts" -delete 2>/dev/null || true
else
    echo "⚠️  警告: npm 未找到，跳过依赖安装"
    echo "   请手动在 $ASSETS_DIR/app 目录运行: npm install --production"
fi

# 返回项目根目录
cd "$PROJECT_ROOT"

# 显示结果
echo ""
echo "✅ Android 资源准备完成！"
echo ""
echo "📊 资源统计:"
if [ -f "$RUNTIME_FILE" ]; then
    echo "   运行环境: $(du -h "$RUNTIME_FILE" | cut -f1)"
fi
echo "   应用代码: $(du -sh "$ASSETS_DIR/app" | cut -f1)"
echo "   总大小: $(du -sh "$ASSETS_DIR" | cut -f1)"
echo ""
echo "🔨 下一步: 构建 APK"
echo "   cd android && ./gradlew assembleDebug"
echo ""
echo "📱 APK 位置: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "💡 特性:"
echo "   - 完全内置运行环境，无需预装任何工具"
echo "   - 后台静默运行，用户无感知"
echo "   - 首次启动自动初始化（约 10-20 秒）"
echo ""
