# AI Agent 中控台 - 构建和部署指南

## 📱 项目概述

AI Agent 中控台是一款用于统一管理和控制 Termux 上 AI 平台工具的应用。采用前后端分离架构：
- **后端**: Node.js + Express（运行在 Termux 或内嵌 Android 应用中）
- **前端**: 纯 HTML/CSS/JS，采用 Neumorphism 软立体设计风格
- **Android 封装**: 内嵌 Node.js 运行时，无需预先安装 Termux

## 🚀 快速开始

### 方式一：在 Termux 中直接运行

```bash
# 1. 克隆项目到 Termux
cd ~
git clone <your-repo-url> ai-agent-control-center
cd ai-agent-control-center

# 2. 运行安装脚本
chmod +x setup.sh
./setup.sh

# 3. 启动服务
./start.sh

# 4. 访问界面
# 本地: http://localhost:3000
# 局域网: http://<你的IP>:3000
```

### 方式二：构建独立 Android APK

#### 前置要求

1. **Android Studio** (Arctic Fox 或更高版本)
2. **Node.js** (v14+)
3. **npm** 或 **yarn**

#### 构建步骤

##### 步骤 1: 准备 Node.js 应用

```bash
# 在项目根目录执行
cd /workspace/ai-agent-control-center

# 安装依赖
npm install --production

# 打包应用文件
npm run build:android
```

##### 步骤 2: 准备 Android 资源

```bash
# 运行资源准备脚本
chmod +x scripts/prepare-android-assets.sh
./scripts/prepare-android-assets.sh
```

这个脚本会：
- 下载适用于 Android 的 Node.js 二进制文件
- 将 Node.js 运行时复制到 `android/app/src/main/assets/node/`
- 将应用代码复制到 `android/app/src/main/assets/ai-agent-control-center/`

##### 步骤 3: 构建 APK

```bash
cd android

# 使用 Gradle 构建
./gradlew assembleDebug

# APK 位置: android/app/build/outputs/apk/debug/app-debug.apk
```

或者使用 Android Studio：
1. 打开 `android/` 目录
2. 等待 Gradle 同步完成
3. 点击 Build > Build Bundle(s) / APK(s) > Build APK(s)

## 📦 Android 打包详解

### 目录结构

```
android/app/src/main/assets/
├── node/                      # Node.js 运行时
│   ├── bin/
│   │   └── node              # Node.js 可执行文件
│   ├── lib/
│   │   └── node_modules/     # Node.js 核心模块
│   └── include/
└── ai-agent-control-center/  # 应用代码
    ├── server.js
    ├── package.json
    ├── node_modules/         # 应用依赖
    ├── public/
    ├── services/
    └── ...
```

### Node.js 运行时选择

需要下载适用于 Android 的 Node.js 版本：

```bash
# 下载 Node.js for Android (ARM64)
wget https://nodejs.org/dist/v20.10.0/node-v20.10.0-linux-arm64.tar.gz
tar -xzf node-v20.10.0-linux-arm64.tar.gz
cp -r node-v20.10.0-linux-arm64 android/app/src/main/assets/node/

# 对于 ARM32 设备
wget https://nodejs.org/dist/v20.10.0/node-v20.10.0-linux-armv7l.tar.gz
```

**注意**: 由于 Android 使用 Bionic libc 而非 glibc，可能需要使用专门编译的 Node.js 版本。推荐使用 Termux 提供的 Node.js 包或 Node.js for Android 项目。

### 应用依赖处理

```bash
# 在应用目录安装依赖
cd android/app/src/main/assets/ai-agent-control-center
npm install --production

# 清理不必要的文件
rm -rf node_modules/.cache
find node_modules -name "*.md" -delete
find node_modules -name "LICENSE" -delete
```

## 🔧 配置说明

### 应用配置

编辑 `config/config.json`:

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

### Android 配置

编辑 `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        applicationId "com.aiagent.controlcenter"
        versionCode 1
        versionName "1.0.0"
    }
}
```

## 📱 内网穿透配置

### 使用 frp

```ini
# frpc.ini
[common]
server_addr = your_server.com
server_port = 7000

[control-center]
type = tcp
local_ip = 127.0.0.1
local_port = 3000
remote_port = 6000
```

### 使用 cloudflared

```bash
cloudflared tunnel --url http://localhost:3000
```

### 使用 ngrok

```bash
ngrok http 3000
```

## 🛠️ 开发指南

### 本地开发

```bash
# 启动开发服务器（带热重载）
npm run dev

# 监听文件变化
npm run watch
```

### 调试

```bash
# 查看 Node.js 日志
tail -f logs/app.log

# 调试模式启动
./start.sh --debug
```

### Android 调试

```bash
# 查看 Android 日志
adb logcat | grep -E "NodeService|MainActivity"

# 进入应用数据目录
adb shell run-as com.aiagent.controlcenter
```

## 📝 常见问题

### Q: Node.js 在 Android 上无法运行？

A: 需要确保使用为 Android 编译的 Node.js 版本。推荐使用：
- Termux 的 Node.js 包
- Node.js for Android 项目
- 自行编译（需要 Android NDK）

### Q: 应用启动后 WebView 显示空白？

A: 检查以下几点：
1. Node.js 服务是否正常启动（查看日志）
2. 端口 3000 是否被占用
3. WebView 是否有权限访问本地服务

### Q: 如何更新应用？

A: 
1. 更新代码
2. 重新运行 `./scripts/prepare-android-assets.sh`
3. 重新构建 APK

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请提交 Issue 或联系开发者。
