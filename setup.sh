#!/bin/bash

# AI Agent 中控台 - 安装脚本
# 适用于 Termux 环境

set -e

echo "🚀 开始安装 AI Agent 中控台..."

# 检查是否在 Termux 环境
if [ ! -d "$PREFIX" ]; then
    echo "⚠️  警告: 这似乎不是 Termux 环境"
    echo "   某些功能可能无法正常工作"
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "📦 正在安装 Node.js..."
    if command -v pkg &> /dev/null; then
        pkg install nodejs -y
    elif command -v apt &> /dev/null; then
        apt update && apt install nodejs npm -y
    else
        echo "❌ 无法自动安装 Node.js，请手动安装"
        exit 1
    fi
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"

# 安装依赖
echo "📦 正在安装项目依赖..."
npm install --production

# 创建配置目录
mkdir -p config logs

# 创建默认配置文件
if [ ! -f config/config.json ]; then
    cat > config/config.json << 'EOF'
{
  "port": 3000,
  "services": {
    "sillytavern": {
      "enabled": true,
      "port": 8000,
      "path": "~/SillyTavern"
    },
    "astrbot": {
      "enabled": true,
      "port": 6185,
      "path": "~/AstrBot"
    },
    "kobold": {
      "enabled": false,
      "port": 5001,
      "path": "~/KoboldAI-Client"
    },
    "ollama": {
      "enabled": true,
      "port": 11434,
      "path": ""
    }
  }
}
EOF
    echo "✅ 已创建默认配置文件: config/config.json"
fi

# 设置权限
chmod +x server.js
chmod +x start.sh
chmod +x stop.sh

echo ""
echo "✅ 安装完成！"
echo ""
echo "📱 启动服务:"
echo "   ./start.sh"
echo ""
echo "🛑 停止服务:"
echo "   ./stop.sh"
echo ""
echo "🌐 访问地址:"
echo "   本地: http://localhost:3000"
echo "   局域网: http://<你的IP>:3000"
echo ""
echo "💡 提示:"
echo "   - 确保各 AI 平台已安装到对应目录"
echo "   - 可以编辑 config/config.json 自定义配置"
echo "   - 使用内网穿透工具可从外网访问"
echo ""
