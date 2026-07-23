#!/bin/bash

# AI Agent 中控台 - 启动脚本

# 检查是否已经运行
if [ -f .pid ]; then
    PID=$(cat .pid)
    if ps -p $PID > /dev/null; then
        echo "⚠️  服务已经在运行中 (PID: $PID)"
        echo "   使用 ./stop.sh 停止服务"
        exit 1
    else
        rm -f .pid
    fi
fi

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js"
    echo "   请先运行 ./setup.sh 安装依赖"
    exit 1
fi

# 检查依赖
if [ ! -d node_modules ]; then
    echo "📦 正在安装依赖..."
    npm install --production
fi

# 创建日志目录
mkdir -p logs

# 启动服务
echo "🚀 正在启动 AI Agent 中控台..."
echo ""

# 前台运行（用于调试）
if [ "$1" = "--debug" ]; then
    echo "🔍 调试模式"
    node server.js
else
    # 后台运行
    nohup node server.js > logs/app.log 2>&1 &
    PID=$!
    echo $PID > .pid
    
    echo "✅ 服务已启动 (PID: $PID)"
    echo ""
    echo "📱 访问地址:"
    echo "   本地: http://localhost:3000"
    
    # 显示局域网地址
    if command -v ifconfig &> /dev/null; then
        IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
        if [ -n "$IP" ]; then
            echo "   局域网: http://$IP:3000"
        fi
    elif command -v ip &> /dev/null; then
        IP=$(ip addr show | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -Eo '([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1)
        if [ -n "$IP" ]; then
            echo "   局域网: http://$IP:3000"
        fi
    fi
    
    echo ""
    echo "📋 查看日志: tail -f logs/app.log"
    echo "🛑 停止服务: ./stop.sh"
fi
