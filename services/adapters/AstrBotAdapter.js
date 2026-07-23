const BaseAdapter = require('../BaseAdapter');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * AstrBot 适配器
 */
class AstrBotAdapter extends BaseAdapter {
  constructor() {
    super('AstrBot', 6185);
    this.process = null;
  }

  /**
   * 检查服务状态
   */
  async checkStatus() {
    try {
      const response = await this.request('GET', '/api/status');
      return {
        status: 'running',
        details: {
          version: response.version || 'unknown',
          uptime: response.uptime || 0,
          port: this.defaultPort
        }
      };
    } catch (error) {
      return {
        status: 'stopped',
        details: {
          port: this.defaultPort
        }
      };
    }
  }

  /**
   * 启动服务
   */
  async start() {
    try {
      const status = await this.checkStatus();
      if (status.status === 'running') {
        throw new Error('服务已经在运行中');
      }

      this.process = exec('cd ~/AstrBot && python main.py', {
        cwd: process.env.HOME + '/AstrBot'
      });

      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return { success: true, message: 'AstrBot 启动成功' };
    } catch (error) {
      throw new Error(`启动 AstrBot 失败: ${error.message}`);
    }
  }

  /**
   * 停止服务
   */
  async stop() {
    try {
      await execAsync(`pkill -f "python.*AstrBot"`);
      this.process = null;
      return { success: true, message: 'AstrBot 已停止' };
    } catch (error) {
      throw new Error(`停止 AstrBot 失败: ${error.message}`);
    }
  }

  /**
   * 获取插件列表
   */
  async getPlugins() {
    try {
      const response = await this.request('GET', '/api/plugins');
      return response.plugins || [];
    } catch (error) {
      throw new Error(`获取插件失败: ${error.message}`);
    }
  }

  /**
   * 获取平台适配器
   */
  async getAdapters() {
    try {
      const response = await this.request('GET', '/api/adapters');
      return response.adapters || [];
    } catch (error) {
      throw new Error(`获取适配器失败: ${error.message}`);
    }
  }

  /**
   * 获取配置
   */
  async getConfig() {
    try {
      const response = await this.request('GET', '/api/config');
      return response.config || {};
    } catch (error) {
      throw new Error(`获取配置失败: ${error.message}`);
    }
  }

  /**
   * 更新配置
   */
  async updateConfig(config) {
    try {
      const response = await this.request('POST', '/api/config', config);
      return response;
    } catch (error) {
      throw new Error(`更新配置失败: ${error.message}`);
    }
  }
}

module.exports = AstrBotAdapter;
