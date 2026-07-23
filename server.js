const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const os = require('os');

// 导入服务管理模块
const ServiceManager = require('./services/ServiceManager');
const SillyTavernAdapter = require('./services/adapters/SillyTavernAdapter');
const AstrBotAdapter = require('./services/adapters/AstrBotAdapter');
const KoboldAdapter = require('./services/adapters/KoboldAdapter');
const OllamaAdapter = require('./services/adapters/OllamaAdapter');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 中间件
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 初始化服务管理器
const serviceManager = new ServiceManager();

// 注册适配器
serviceManager.registerAdapter('sillytavern', new SillyTavernAdapter());
serviceManager.registerAdapter('astrbot', new AstrBotAdapter());
serviceManager.registerAdapter('kobold', new KoboldAdapter());
serviceManager.registerAdapter('ollama', new OllamaAdapter());

// WebSocket 连接管理
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('WebSocket 客户端已连接');
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('WebSocket 客户端已断开');
  });
  
  // 发送初始状态
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      services: serviceManager.getAllServicesStatus()
    }
  }));
});

// 广播消息到所有客户端
function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// 定时更新服务状态
setInterval(() => {
  const status = serviceManager.getAllServicesStatus();
  broadcast({
    type: 'status_update',
    data: status
  });
}, 5000); // 每 5 秒更新一次

// ==================== API 路由 ====================

// 获取所有服务状态
app.get('/api/services', async (req, res) => {
  try {
    const status = await serviceManager.getAllServicesStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取单个服务状态
app.get('/api/services/:serviceId', async (req, res) => {
  try {
    const status = await serviceManager.getServiceStatus(req.params.serviceId);
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 启动服务
app.post('/api/services/:serviceId/start', async (req, res) => {
  try {
    await serviceManager.startService(req.params.serviceId);
    res.json({ success: true, message: '服务启动成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 停止服务
app.post('/api/services/:serviceId/stop', async (req, res) => {
  try {
    await serviceManager.stopService(req.params.serviceId);
    res.json({ success: true, message: '服务停止成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 重启服务
app.post('/api/services/:serviceId/restart', async (req, res) => {
  try {
    await serviceManager.restartService(req.params.serviceId);
    res.json({ success: true, message: '服务重启成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SillyTavern API ====================

// 获取角色卡列表
app.get('/api/sillytavern/characters', async (req, res) => {
  try {
    const characters = await serviceManager.callAdapter('sillytavern', 'getCharacters');
    res.json({ success: true, data: characters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取世界书列表
app.get('/api/sillytavern/worldbooks', async (req, res) => {
  try {
    const worldbooks = await serviceManager.callAdapter('sillytavern', 'getWorldBooks');
    res.json({ success: true, data: worldbooks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取 API 预设
app.get('/api/sillytavern/presets', async (req, res) => {
  try {
    const presets = await serviceManager.callAdapter('sillytavern', 'getPresets');
    res.json({ success: true, data: presets });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AstrBot API ====================

// 获取插件列表
app.get('/api/astrbot/plugins', async (req, res) => {
  try {
    const plugins = await serviceManager.callAdapter('astrbot', 'getPlugins');
    res.json({ success: true, data: plugins });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取平台适配器
app.get('/api/astrbot/adapters', async (req, res) => {
  try {
    const adapters = await serviceManager.callAdapter('astrbot', 'getAdapters');
    res.json({ success: true, data: adapters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取配置
app.get('/api/astrbot/config', async (req, res) => {
  try {
    const config = await serviceManager.callAdapter('astrbot', 'getConfig');
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== Kobold/Ollama API ====================

// 获取模型列表
app.get('/api/models/:serviceId', async (req, res) => {
  try {
    const models = await serviceManager.callAdapter(req.params.serviceId, 'getModels');
    res.json({ success: true, data: models });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 切换模型
app.post('/api/models/:serviceId/switch', async (req, res) => {
  try {
    const { modelName } = req.body;
    await serviceManager.callAdapter(req.params.serviceId, 'switchModel', modelName);
    res.json({ success: true, message: '模型切换成功' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 系统信息 API ====================

// 获取系统信息
app.get('/api/system/info', (req, res) => {
  try {
    const networkInterfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const iface of Object.values(networkInterfaces)) {
      for (const addr of iface) {
        if (addr.family === 'IPv4' && !addr.internal) {
          addresses.push(addr.address);
        }
      }
    }
    
    res.json({
      success: true,
      data: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: os.uptime(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length,
        loadavg: os.loadavg(),
        networkAddresses: addresses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 404 处理
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 AI Agent 中控台已启动`);
  console.log(`📱 本地访问：http://localhost:${PORT}`);
  
  // 显示局域网访问地址
  const networkInterfaces = os.networkInterfaces();
  for (const iface of Object.values(networkInterfaces)) {
    for (const addr of iface) {
      if (addr.family === 'IPv4' && !addr.internal) {
        console.log(`🌐 局域网访问：http://${addr.address}:${PORT}`);
      }
    }
  }
  
  console.log(`\n按 Ctrl+C 停止服务器\n`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('\n收到 SIGTERM 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
