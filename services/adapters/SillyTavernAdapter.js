const BaseAdapter = require('../BaseAdapter');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * SillyTavern 适配器
 */
class SillyTavernAdapter extends BaseAdapter {
  constructor() {
    super('SillyTavern', 8000);
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
      // 检查是否已经在运行
      const status = await this.checkStatus();
      if (status.status === 'running') {
        throw new Error('服务已经在运行中');
      }

      // 启动 SillyTavern
      this.process = exec('cd ~/SillyTavern && node server.js', {
        cwd: process.env.HOME + '/SillyTavern'
      });

      // 等待服务启动
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return { success: true, message: 'SillyTavern 启动成功' };
    } catch (error) {
      throw new Error(`启动 SillyTavern 失败: ${error.message}`);
    }
  }

  /**
   * 停止服务
   */
  async stop() {
    try {
      // 查找并杀死进程
      await execAsync(`pkill -f "node.*SillyTavern"`);
      this.process = null;
      return { success: true, message: 'SillyTavern 已停止' };
    } catch (error) {
      throw new Error(`停止 SillyTavern 失败: ${error.message}`);
    }
  }

  /**
   * 获取角色卡列表
   */
  async getCharacters() {
    try {
      const response = await this.request('GET', '/api/characters');
      return response.characters || [];
    } catch (error) {
      throw new Error(`获取角色卡失败: ${error.message}`);
    }
  }

  /**
   * 获取世界书列表
   */
  async getWorldBooks() {
    try {
      const response = await this.request('GET', '/api/world');
      return response.worlds || [];
    } catch (error) {
      throw new Error(`获取世界书失败: ${error.message}`);
    }
  }

  /**
   * 获取 API 预设
   */
  async getPresets() {
    try {
      const response = await this.request('GET', '/api/presets');
      return response.presets || [];
    } catch (error) {
      throw new Error(`获取预设失败: ${error.message}`);
    }
  }

  /**
   * 发送测试消息
   */
  async sendTestMessage(message) {
    try {
      const response = await this.request('POST', '/api/message', {
        message: message || 'Hello, this is a test message!'
      });
      return response;
    } catch (error) {
      throw new Error(`发送测试消息失败: ${error.message}`);
    }
  }
}

module.exports = SillyTavernAdapter;
