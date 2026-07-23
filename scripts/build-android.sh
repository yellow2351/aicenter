#!/bin/bash

# AI Agent 中控台 - Android 构建脚本

set -e

echo "🔨 开始构建 Android APK..."

# 检查 Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo "⚠️  警告: ANDROID_HOME 未设置"
    echo "   请确保已安装 Android SDK 并设置环境变量"
fi

# 进入 android 目录
cd android

# 检查 Gradle wrapper
if [ ! -f "gradlew" ]; then
    echo "❌ 错误: gradlew 不存在"
    echo "   请确保 android 目录完整"
    exit 1
fi

# 赋予执行权限
chmod +x gradlew

# 清理旧构建
echo "🧹 清理旧构建..."
./gradlew clean

# 构建 Debug APK
echo "📦 构建 Debug APK..."
./gradlew assembleDebug

# 检查 APK 是否生成
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo ""
    echo "✅ 构建成功！"
    echo ""
    echo "📱 APK 位置: android/$APK_PATH"
    echo "📊 APK 大小: $(du -h "$APK_PATH" | cut -f1)"
    echo ""
    echo "📲 安装到设备:"
    echo "   adb install $APK_PATH"
    echo ""
else
    echo "❌ 构建失败: APK 未生成"
    exit 1
fi
