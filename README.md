# AI Agent 中控台

一款完全独立的 Android 应用，用于统一管理和控制多个 AI 平台工具。内置完整运行环境，无需预装任何工具，安装即用。

## 核心特性

- **完全独立**：内置运行环境，无需预装任何工具
- **开箱即用**：安装 APK 即可使用，零配置
- **Neumorphism 设计**：软立体风格，美观舒适
- **实时监控**：WebSocket 实时推送服务状态
- **插件架构**：模块化适配器，易于扩展
- **灵活访问**：支持局域网直连和内网穿透

## 架构

```
┌─────────────────────────────────────┐
│   Android WebView (前端 UI)         │
│   Neumorphism 设计 + 响应式布局     │
└──────────────┬──────────────────────┘
               │ HTTP/WebSocket
┌──────────────▼──────────────────────┐
│   Node.js 服务 (Express + WS)       │
│   完全后台运行，用户无感知          │
└──────────────┬──────────────────────┘
               │ HTTP API
┌──────────────▼──────────────────────┐
│   AI 平台服务                       │
│   SillyTavern / AstrBot / Ollama    │
└─────────────────────────────────────┘
```

## 快速开始

### 构建 APK

```bash
# 1. 下载运行环境
chmod +x scripts/download-runtime.sh
./scripts/download-runtime.sh

# 2. 准备资源
chmod +x scripts/prepare-android-assets.sh
./scripts/prepare-android-assets.sh

# 3. 构建 APK
chmod +x scripts/build-android.sh
./scripts/build-android.sh
```

APK 输出位置：`android/app/build/outputs/apk/debug/app-debug.apk`

### 使用 Android Studio

1. 打开 `android/` 目录
2. 等待 Gradle 同步完成
3. 点击 Run 或 Build > Build APK

## 使用指南

### 首次启动

1. 打开应用
2. 等待初始化完成（首次约 10-20 秒）
3. 自动进入管理界面

### 仪表盘

查看所有服务的运行状态，快速启动/停止/重启服务。

### SillyTavern 管理

- 查看和管理角色卡
- 管理世界书（World Info）
- 配置 API 预设

### AstrBot 管理

- 查看和管理插件
- 配置平台适配器
- 编辑配置文件

### 模型管理

- 查看 Ollama/Kobold AI 可用模型
- 快速切换模型
- 发送测试消息

## 配置

编辑 `config/config.json`：

```json
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
    "ollama": {
      "enabled": true,
      "port": 11434
    }
  }
}
```

## 内网穿透

### frp

```ini
[control-center]
type = tcp
local_ip = 127.0.0.1
local_port = 3000
remote_port = 6000
```

### cloudflared

```bash
cloudflared tunnel --url http://localhost:3000
```

### ngrok

```bash
ngrok http 3000
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

### 扩展新服务

1. 在 `services/adapters/` 创建新适配器
2. 继承 `BaseAdapter` 类
3. 实现 `checkStatus()`, `start()`, `stop()` 方法
4. 在 `server.js` 中注册适配器

## 技术细节

### 权限说明

- `INTERNET`：访问网络（用于 API 调用）
- `FOREGROUND_SERVICE`：后台运行服务
- `POST_NOTIFICATIONS`：显示服务状态
- `WAKE_LOCK`：保持服务运行

### 环境初始化流程

1. 应用启动 → 启动后台服务
2. 自动解压运行环境到内部存储
3. 解压应用代码
4. 设置文件权限和环境变量
5. 启动 Node.js 服务进程
6. WebView 加载管理界面

## 常见问题

### Q: 首次启动很慢？

A: 首次启动需要解压运行环境（约 100-200MB），这是正常现象。后续启动速度更快。

### Q: 可以在后台运行吗？

A: 可以。应用使用 Android 前台服务保持运行，通知栏仅显示最小化状态提示。

### Q: 支持哪些 CPU 架构？

A: 默认构建 ARM64 版本。如需支持其他架构，修改 `scripts/download-runtime.sh` 中的 `ARCH` 变量。

## 许可证

MIT License
