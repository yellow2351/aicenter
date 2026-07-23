const axios = require('axios');

/**
 * 基础适配器类 - 所有服务适配器的基类
 */
class BaseAdapter {
  constructor(name, defaultPort) {
    this.name = name;
    this.defaultPort = defaultPort;
    this.baseUrl = `http://localhost:${defaultPort}`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * 检查服务状态 - 子类需要实现
   */
  async checkStatus() {
    throw new Error('checkStatus 方法需要子类实现');
  }

  /**
   * 启动服务 - 子类需要实现
   */
  async start() {
    throw new Error('start 方法需要子类实现');
  }

  /**
   * 停止服务 - 子类需要实现
   */
  async stop() {
    throw new Error('stop 方法需要子类实现');
  }

  /**
   * 重启服务
   */
  async restart() {
    await this.stop();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await this.start();
  }

  /**
   * 发送 HTTP 请求
   */
  async request(method, path, data = null) {
    try {
      const response = await this.client.request({
        method,
        url: path,
        data
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.data?.error || error.message}`);
      }
      throw error;
    }
  }
}

module.exports = BaseAdapter;
