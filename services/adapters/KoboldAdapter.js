const BaseAdapter = require('../BaseAdapter');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Kobold AI 适配器
 */
class KoboldAdapter extends BaseAdapter {
  constructor() {
    super('Kobold AI', 5001);
    this.process = null;
  }

  /**
   * 检查服务状态
   */
  async checkStatus() {
    try {
      const response = await this.request('GET', '/api/v1/model');
      return {
        status: 'running',
        details: {
          model: response.result || 'unknown',
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

      this.process = exec('cd ~/KoboldAI-Client && python aiserver.py', {
        cwd: process.env.HOME + '/KoboldAI-Client'
      });

      await new Promise(resolve => setTimeout(resolve, 5000));
      
      return { success: true, message: 'Kobold AI 启动成功' };
    } catch (error) {
      throw new Error(`启动 Kobold AI 失败: ${error.message}`);
    }
  }

  /**
   * 停止服务
   */
  async stop() {
    try {
      await execAsync(`pkill -f "python.*KoboldAI"`);
      this.process = null;
      return { success: true, message: 'Kobold AI 已停止' };
    } catch (error) {
      throw new Error(`停止 Kobold AI 失败: ${error.message}`);
    }
  }

  /**
   * 获取模型列表
   */
  async getModels() {
    try {
      const response = await this.request('GET', '/api/v1/model/list');
      return response.data || [];
    } catch (error) {
      throw new Error(`获取模型列表失败: ${error.message}`);
    }
  }

  /**
   * 切换模型
   */
  async switchModel(modelName) {
    try {
      const response = await this.request('POST', '/api/v1/model', {
        model: modelName
      });
      return response;
    } catch (error) {
      throw new Error(`切换模型失败: ${error.message}`);
    }
  }

  /**
   * 生成文本
   */
  async generate(prompt, options = {}) {
    try {
      const response = await this.request('POST', '/api/v1/generate', {
        prompt,
        ...options
      });
      return response.results?.[0]?.text || '';
    } catch (error) {
      throw new Error(`生成文本失败: ${error.message}`);
    }
  }
}

module.exports = KoboldAdapter;
