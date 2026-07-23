/**
 * 服务管理器 - 统一管理所有 AI 平台服务
 */
class ServiceManager {
  constructor() {
    this.adapters = new Map();
    this.serviceStatus = new Map();
  }

  /**
   * 注册适配器
   */
  registerAdapter(serviceId, adapter) {
    this.adapters.set(serviceId, adapter);
    this.serviceStatus.set(serviceId, {
      id: serviceId,
      name: adapter.name,
      status: 'unknown',
      lastCheck: null,
      error: null
    });
  }

  /**
   * 获取所有服务状态
   */
  async getAllServicesStatus() {
    const status = {};
    for (const [serviceId, adapter] of this.adapters.entries()) {
      try {
        const serviceStatus = await adapter.checkStatus();
        this.serviceStatus.set(serviceId, {
          ...this.serviceStatus.get(serviceId),
          status: serviceStatus.status,
          lastCheck: new Date().toISOString(),
          error: null,
          details: serviceStatus.details
        });
        status[serviceId] = this.serviceStatus.get(serviceId);
      } catch (error) {
        this.serviceStatus.set(serviceId, {
          ...this.serviceStatus.get(serviceId),
          status: 'error',
          lastCheck: new Date().toISOString(),
          error: error.message
        });
        status[serviceId] = this.serviceStatus.get(serviceId);
      }
    }
    return status;
  }

  /**
   * 获取单个服务状态
   */
  async getServiceStatus(serviceId) {
    const adapter = this.adapters.get(serviceId);
    if (!adapter) {
      throw new Error(`服务 ${serviceId} 不存在`);
    }

    try {
      const serviceStatus = await adapter.checkStatus();
      this.serviceStatus.set(serviceId, {
        ...this.serviceStatus.get(serviceId),
        status: serviceStatus.status,
        lastCheck: new Date().toISOString(),
        error: null,
        details: serviceStatus.details
      });
      return this.serviceStatus.get(serviceId);
    } catch (error) {
      this.serviceStatus.set(serviceId, {
        ...this.serviceStatus.get(serviceId),
        status: 'error',
        lastCheck: new Date().toISOString(),
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 启动服务
   */
  async startService(serviceId) {
    const adapter = this.adapters.get(serviceId);
    if (!adapter) {
      throw new Error(`服务 ${serviceId} 不存在`);
    }
    await adapter.start();
    await this.getServiceStatus(serviceId);
  }

  /**
   * 停止服务
   */
  async stopService(serviceId) {
    const adapter = this.adapters.get(serviceId);
    if (!adapter) {
      throw new Error(`服务 ${serviceId} 不存在`);
    }
    await adapter.stop();
    await this.getServiceStatus(serviceId);
  }

  /**
   * 重启服务
   */
  async restartService(serviceId) {
    const adapter = this.adapters.get(serviceId);
    if (!adapter) {
      throw new Error(`服务 ${serviceId} 不存在`);
    }
    await adapter.restart();
    await this.getServiceStatus(serviceId);
  }

  /**
   * 调用适配器方法
   */
  async callAdapter(serviceId, method, ...args) {
    const adapter = this.adapters.get(serviceId);
    if (!adapter) {
      throw new Error(`服务 ${serviceId} 不存在`);
    }
    if (typeof adapter[method] !== 'function') {
      throw new Error(`服务 ${serviceId} 不支持方法 ${method}`);
    }
    return await adapter[method](...args);
  }
}

module.exports = ServiceManager;
