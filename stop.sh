#!/bin/bash

# AI Agent 中控台 - 停止脚本

if [ ! -f .pid ]; then
    echo "⚠️  服务未运行"
    exit 0
fi

PID=$(cat .pid)

if ps -p $PID > /dev/null; then
    echo "🛑 正在停止服务 (PID: $PID)..."
    kill $PID
    sleep 2
    
    if ps -p $PID > /dev/null; then
        echo "⚠️  服务未响应，强制停止..."
        kill -9 $PID
    fi
    
    rm -f .pid
    echo "✅ 服务已停止"
else
    echo "⚠️  进程不存在，清理 PID 文件..."
    rm -f .pid
fi
