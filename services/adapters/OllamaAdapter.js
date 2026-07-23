const BaseAdapter = require('../BaseAdapter');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

/**
 * Ollama 适配器
 */
class OllamaAdapter extends BaseAdapter {
  constructor() {
    super('Ollama', 11434);
    this.process = null;
  }

  /**
   * 检查服务状态
   */
  async checkStatus() {
    try {
      const response = await this.request('GET', '/api/tags');
      return {
        status: 'running',
        details: {
          models: response.models?.length || 0,
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

      this.process = exec('ollama serve', {
        cwd: process.env.HOME
      });

      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return { success: true, message: 'Ollama 启动成功' };
    } catch (error) {
      throw new Error(`启动 Ollama 失败: ${error.message}`);
    }
  }

  /**
   * 停止服务
   */
  async stop() {
    try {
      await execAsync(`pkill -f "ollama serve"`);
      this.process = null;
      return { success: true, message: 'Ollama 已停止' };
    } catch (error) {
      throw new Error(`停止 Ollama 失败: ${error.message}`);
    }
  }

  /**
   * 获取模型列表
   */
  async getModels() {
    try {
      const response = await this.request('GET', '/api/tags');
      return response.models || [];
    } catch (error) {
      throw new Error(`获取模型列表失败: ${error.message}`);
    }
  }

  /**
   * 切换模型（Ollama 通过指定模型名称来使用）
   */
  async switchModel(modelName) {
    try {
      // Ollama 不需要显式切换，只需在请求时指定模型
      // 这里验证模型是否存在
      const models = await this.getModels();
      const modelExists = models.some(m => m.name === modelName);
      
      if (!modelExists) {
        throw new Error(`模型 ${modelName} 不存在`);
      }
      
      return { success: true, message: `模型 ${modelName} 可用` };
    } catch (error) {
      throw new Error(`切换模型失败: ${error.message}`);
    }
  }

  /**
   * 生成文本
   */
  async generate(prompt, model = 'llama2', options = {}) {
    try {
      const response = await this.request('POST', '/api/generate', {
        model,
        prompt,
        stream: false,
        ...options
      });
      return response.response || '';
    } catch (error) {
      throw new Error(`生成文本失败: ${error.message}`);
    }
  }

  /**
   * 聊天接口
   */
  async chat(messages, model = 'llama2', options = {}) {
    try {
      const response = await this.request('POST', '/api/chat', {
        model,
        messages,
        stream: false,
        ...options
      });
      return response.message?.content || '';
    } catch (error) {
      throw new Error(`聊天失败: ${error.message}`);
    }
  }

  /**
   * 下载模型
   */
  async pullModel(modelName) {
    try {
      const response = await this.request('POST', '/api/pull', {
        name: modelName,
        stream: false
      });
      return response;
    } catch (error) {
      throw new Error(`下载模型失败: ${error.message}`);
    }
  }

  /**
   * 删除模型
   */
  async deleteModel(modelName) {
    try {
      const response = await this.request('DELETE', '/api/delete', {
        name: modelName
      });
      return response;
    } catch (error) {
      throw new Error(`删除模型失败: ${error.message}`);
    }
  }
}

module.exports = OllamaAdapter;
