// AI Agent 中控台 - 前端应用逻辑

// 全局状态
let ws = null;
let currentServices = {};

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initWebSocket();
  loadDashboard();
});

// ==================== 导航 ====================

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // 更新激活状态
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      // 切换页面
      const page = item.dataset.page;
      document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
      document.getElementById(`${page}-page`).style.display = 'block';
      
      // 加载对应页面数据
      loadPageData(page);
    });
  });
}

function loadPageData(page) {
  switch (page) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'sillytavern':
      loadSillyTavernData();
      break;
    case 'astrbot':
      loadAstrBotData();
      break;
    case 'models':
      loadModels();
      break;
    case 'system':
      loadSystemInfo();
      break;
  }
}

// ==================== WebSocket ====================

function initWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}`;
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('WebSocket 已连接');
    showToast('实时连接已建立', 'success');
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleWebSocketMessage(message);
  };
  
  ws.onclose = () => {
    console.log('WebSocket 已断开');
    showToast('实时连接已断开，正在重连...', 'warning');
    setTimeout(initWebSocket, 3000);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket 错误:', error);
    showToast('连接错误', 'error');
  };
}

function handleWebSocketMessage(message) {
  switch (message.type) {
    case 'init':
    case 'status_update':
      currentServices = message.data.services;
      renderServicesGrid();
      break;
  }
}

// ==================== 仪表盘 ====================

async function loadDashboard() {
  try {
    const response = await fetch('/api/services');
    const data = await response.json();
    
    if (data.success) {
      currentServices = data.data;
      renderServicesGrid();
    }
  } catch (error) {
    showToast('加载服务状态失败', 'error');
    console.error(error);
  }
}

function renderServicesGrid() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;
  
  grid.innerHTML = '';
  
  for (const [serviceId, service] of Object.entries(currentServices)) {
    const card = createServiceCard(serviceId, service);
    grid.appendChild(card);
  }
}

function createServiceCard(serviceId, service) {
  const card = document.createElement('div');
  card.className = 'service-card';
  
  const statusClass = service.status || 'unknown';
  const statusText = {
    running: '运行中',
    stopped: '已停止',
    error: '错误',
    unknown: '未知'
  }[statusClass] || '未知';
  
  let detailsHtml = '';
  if (service.details) {
    detailsHtml = Object.entries(service.details)
      .map(([key, value]) => `<div>${key}: ${value}</div>`)
      .join('');
  }
  
  card.innerHTML = `
    <div class="service-header">
      <div class="service-name">${service.name || serviceId}</div>
      <div class="service-status ${statusClass}">${statusText}</div>
    </div>
    <div class="service-details">
      ${detailsHtml || '暂无详细信息'}
    </div>
    <div class="service-actions">
      <button class="neu-btn success small" onclick="startService('${serviceId}')">启动</button>
      <button class="neu-btn danger small" onclick="stopService('${serviceId}')">停止</button>
      <button class="neu-btn warning small" onclick="restartService('${serviceId}')">重启</button>
    </div>
  `;
  
  return card;
}

// ==================== 服务控制 ====================

async function startService(serviceId) {
  try {
    showToast(`正在启动 ${serviceId}...`, 'info');
    const response = await fetch(`/api/services/${serviceId}/start`, { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      showToast(`${serviceId} 启动成功`, 'success');
      loadDashboard();
    } else {
      showToast(`启动失败: ${data.error}`, 'error');
    }
  } catch (error) {
    showToast('启动服务失败', 'error');
    console.error(error);
  }
}

async function stopService(serviceId) {
  try {
    showToast(`正在停止 ${serviceId}...`, 'info');
    const response = await fetch(`/api/services/${serviceId}/stop`, { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      showToast(`${serviceId} 已停止`, 'success');
      loadDashboard();
    } else {
      showToast(`停止失败: ${data.error}`, 'error');
    }
  } catch (error) {
    showToast('停止服务失败', 'error');
    console.error(error);
  }
}

async function restartService(serviceId) {
  try {
    showToast(`正在重启 ${serviceId}...`, 'info');
    const response = await fetch(`/api/services/${serviceId}/restart`, { method: 'POST' });
    const data = await response.json();
    
    if (data.success) {
      showToast(`${serviceId} 重启成功`, 'success');
      loadDashboard();
    } else {
      showToast(`重启失败: ${data.error}`, 'error');
    }
  } catch (error) {
    showToast('重启服务失败', 'error');
    console.error(error);
  }
}

// ==================== SillyTavern ====================

async function loadSillyTavernData() {
  loadCharacters();
  loadWorldBooks();
  loadPresets();
}

async function loadCharacters() {
  try {
    const response = await fetch('/api/sillytavern/characters');
    const data = await response.json();
    
    const list = document.getElementById('characters-list');
    if (data.success && data.data.length > 0) {
      list.innerHTML = data.data.map(char => `
        <div class="list-item">
          <span>${char.name || '未命名'}</span>
          <span class="badge primary">${char.avatar ? '有头像' : '无头像'}</span>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<div class="list-item">暂无角色卡</div>';
    }
  } catch (error) {
    console.error('加载角色卡失败:', error);
    document.getElementById('characters-list').innerHTML = '<div class="list-item">加载失败</div>';
  }
}

async function loadWorldBooks() {
  try {
    const response = await fetch('/api/sillytavern/worldbooks');
    const data = await response.json();
    
    const list = document.getElementById('worldbooks-list');
    if (data.success && data.data.length > 0) {
      list.innerHTML = data.data.map(book => `
        <div class="list-item">
          <span>${book.name || '未命名'}</span>
          <span class="badge success">${book.entries?.length || 0} 条目</span>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<div class="list-item">暂无世界书</div>';
    }
  } catch (error) {
    console.error('加载世界书失败:', error);
    document.getElementById('worldbooks-list').innerHTML = '<div class="list-item">加载失败</div>';
  }
}

async function loadPresets() {
  try {
    const response = await fetch('/api/sillytavern/presets');
    const data = await response.json();
    
    const list = document.getElementById('presets-list');
    if (data.success && data.data.length > 0) {
      list.innerHTML = data.data.map(preset => `
        <div class="list-item">
          <span>${preset.name || '未命名'}</span>
          <span class="badge warning">${preset.preset || '默认'}</span>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<div class="list-item">暂无预设</div>';
    }
  } catch (error) {
    console.error('加载预设失败:', error);
    document.getElementById('presets-list').innerHTML = '<div class="list-item">加载失败</div>';
  }
}

// ==================== AstrBot ====================

async function loadAstrBotData() {
  loadPlugins();
  loadAdapters();
  loadConfig();
}

async function loadPlugins() {
  try {
    const response = await fetch('/api/astrbot/plugins');
    const data = await response.json();
    
    const list = document.getElementById('plugins-list');
    if (data.success && data.data.length > 0) {
      list.innerHTML = data.data.map(plugin => `
        <div class="list-item">
          <span>${plugin.name || '未命名'}</span>
          <div>
            <span class="badge ${plugin.enabled ? 'success' : 'danger'}">
              ${plugin.enabled ? '已启用' : '已禁用'}
            </span>
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<div class="list-item">暂无插件</div>';
    }
  } catch (error) {
    console.error('加载插件失败:', error);
    document.getElementById('plugins-list').innerHTML = '<div class="list-item">加载失败</div>';
  }
}

async function loadAdapters() {
  try {
    const response = await fetch('/api/astrbot/adapters');
    const data = await response.json();
    
    const list = document.getElementById('adapters-list');
    if (data.success && data.data.length > 0) {
      list.innerHTML = data.data.map(adapter => `
        <div class="list-item">
          <span>${adapter.name || '未命名'}</span>
          <div>
            <span class="badge ${adapter.connected ? 'success' : 'danger'}">
              ${adapter.connected ? '已连接' : '未连接'}
            </span>
          </div>
        </div>
      `).join('');
    } else {
      list.innerHTML = '<div class="list-item">暂无适配器</div>';
    }
  } catch (error) {
    console.error('加载适配器失败:', error);
    document.getElementById('adapters-list').innerHTML = '<div class="list-item">加载失败</div>';
  }
}

async function loadConfig() {
  try {
    const response = await fetch('/api/astrbot/config');
    const data = await response.json();
    
    const content = document.getElementById('config-content');
    if (data.success) {
      content.textContent = JSON.stringify(data.data, null, 2);
    } else {
      content.textContent = '加载配置失败';
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    document.getElementById('config-content').textContent = '加载失败';
  }
}

// ==================== 模型管理 ====================

async function loadModels() {
  const serviceId = document.getElementById('model-service-select').value;
  
  try {
    const response = await fetch(`/api/models/${serviceId}`);
    const data = await response.json();
    
    const list = document.getElementById('models-list');
    const testSelect = document.getElementById('test-model-select');
    
    if (data.success && data.data.length > 0) {
      list.innerHTML = data.data.map(model => `
        <div class="list-item">
          <span>${model.name || model}</span>
          <button class="neu-btn primary small" onclick="switchModel('${serviceId}', '${model.name || model}')">
            使用
          </button>
        </div>
      `).join('');
      
      // 更新测试选择框
      testSelect.innerHTML = data.data.map(model => 
        `<option value="${model.name || model}">${model.name || model}</option>`
      ).join('');
    } else {
      list.innerHTML = '<div class="list-item">暂无可用模型</div>';
      testSelect.innerHTML = '<option>无可用模型</option>';
    }
  } catch (error) {
    console.error('加载模型失败:', error);
    document.getElementById('models-list').innerHTML = '<div class="list-item">加载失败</div>';
  }
}

async function switchModel(serviceId, modelName) {
  try {
    showToast(`正在切换到模型 ${modelName}...`, 'info');
    const response = await fetch(`/api/models/${serviceId}/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelName })
    });
    const data = await response.json();
    
    if (data.success) {
      showToast(`已切换到 ${modelName}`, 'success');
    } else {
      showToast(`切换失败: ${data.error}`, 'error');
    }
  } catch (error) {
    showToast('切换模型失败', 'error');
    console.error(error);
  }
}

async function sendTestMessage() {
  const serviceId = document.getElementById('model-service-select').value;
  const model = document.getElementById('test-model-select').value;
  const message = document.getElementById('test-message').value;
  
  if (!message.trim()) {
    showToast('请输入测试消息', 'warning');
    return;
  }
  
  try {
    showToast('正在发送测试消息...', 'info');
    
    // 这里需要根据实际 API 调整
    const response = await fetch(`/api/models/${serviceId}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: message })
    });
    const data = await response.json();
    
    const resultDiv = document.getElementById('test-result');
    const resultContent = document.getElementById('test-result-content');
    
    resultDiv.style.display = 'block';
    if (data.success) {
      resultContent.textContent = data.data || '无响应';
    } else {
      resultContent.textContent = `错误: ${data.error}`;
    }
  } catch (error) {
    showToast('发送测试消息失败', 'error');
    console.error(error);
  }
}

// ==================== 系统信息 ====================

async function loadSystemInfo() {
  try {
    const response = await fetch('/api/system/info');
    const data = await response.json();
    
    const infoDiv = document.getElementById('system-info');
    if (data.success) {
      const info = data.data;
      const uptime = formatUptime(info.uptime);
      const memUsed = ((info.totalmem - info.freemem) / 1024 / 1024 / 1024).toFixed(2);
      const memTotal = (info.totalmem / 1024 / 1024 / 1024).toFixed(2);
      
      infoDiv.innerHTML = `
        <div class="mb-2"><strong>主机名:</strong> ${info.hostname}</div>
        <div class="mb-2"><strong>平台:</strong> ${info.platform} (${info.arch})</div>
        <div class="mb-2"><strong>CPU 核心:</strong> ${info.cpus}</div>
        <div class="mb-2"><strong>系统负载:</strong> ${info.loadavg.map(l => l.toFixed(2)).join(', ')}</div>
        <div class="mb-2"><strong>运行时间:</strong> ${uptime}</div>
        <div class="mb-2"><strong>内存使用:</strong> ${memUsed} GB / ${memTotal} GB</div>
        <div class="mb-2"><strong>网络地址:</strong></div>
        <ul style="margin-left: 20px;">
          ${info.networkAddresses.map(addr => `<li>${addr}</li>`).join('')}
        </ul>
      `;
    } else {
      infoDiv.innerHTML = '<div>加载失败</div>';
    }
  } catch (error) {
    console.error('加载系统信息失败:', error);
    document.getElementById('system-info').innerHTML = '<div>加载失败</div>';
  }
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days} 天`);
  if (hours > 0) parts.push(`${hours} 小时`);
  if (minutes > 0) parts.push(`${minutes} 分钟`);
  
  return parts.join(' ') || '刚刚启动';
}

// ==================== Toast 提示 ====================

function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
