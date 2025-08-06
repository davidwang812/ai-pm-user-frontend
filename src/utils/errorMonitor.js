/**
 * 错误监控系统
 * 用于捕获和报告运行时错误，帮助快速定位问题
 */

class ErrorMonitor {
  constructor() {
    this.errors = [];
    this.maxErrors = 50; // 最多保存50个错误
    this.initialized = false;
  }

  /**
   * 初始化错误监控
   */
  init() {
    if (this.initialized) return;
    
    // 监听全局错误
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack,
        timestamp: new Date().toISOString()
      });
      
      // 特殊处理初始化错误
      if (event.message.includes('initialization')) {
        console.error('🚨 Critical initialization error detected!');
        this.reportCriticalError(event);
      }
    });

    // 监听Promise错误
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'promise',
        message: event.reason?.message || event.reason,
        stack: event.reason?.stack,
        timestamp: new Date().toISOString()
      });
    });

    // 监听Vue错误
    if (window.Vue || window.app) {
      const app = window.app || window.Vue;
      if (app.config) {
        app.config.errorHandler = (err, vm, info) => {
          this.captureError({
            type: 'vue',
            message: err.message,
            stack: err.stack,
            component: vm?.$options.name || 'Unknown',
            info: info,
            timestamp: new Date().toISOString()
          });
        };
      }
    }

    // 监听资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.captureError({
          type: 'resource',
          tagName: event.target.tagName,
          source: event.target.src || event.target.href,
          message: `Failed to load ${event.target.tagName}`,
          timestamp: new Date().toISOString()
        });
      }
    }, true);

    this.initialized = true;
    console.log('✅ Error monitor initialized');
  }

  /**
   * 捕获错误
   */
  captureError(error) {
    // 添加到错误列表
    this.errors.unshift(error);
    
    // 限制错误数量
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // 在开发环境打印详细信息
    if (import.meta.env.DEV) {
      console.group(`🚨 Error Captured: ${error.type}`);
      console.error(error);
      console.groupEnd();
    }

    // 存储到localStorage供调试
    try {
      localStorage.setItem('error_monitor_logs', JSON.stringify(this.errors));
    } catch (e) {
      // localStorage可能已满
    }
  }

  /**
   * 报告关键错误
   */
  reportCriticalError(event) {
    const errorInfo = {
      message: event.message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      stack: event.error?.stack
    };

    // 在生产环境，可以发送到错误收集服务
    if (import.meta.env.PROD) {
      // TODO: 发送到Sentry或其他错误监控服务
      console.error('Critical error would be reported:', errorInfo);
    }

    // 显示用户友好的错误提示
    this.showErrorNotification();
  }

  /**
   * 显示错误通知
   */
  showErrorNotification() {
    // 检查是否有Element Plus
    if (window.ElementPlus?.ElMessage) {
      window.ElementPlus.ElMessage.error({
        message: '应用加载出现问题，请刷新页面重试',
        duration: 5000,
        showClose: true
      });
    } else {
      // 降级方案
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 16px 24px;
        border-radius: 4px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.2);
        z-index: 9999;
        font-family: Arial, sans-serif;
      `;
      notification.textContent = '应用加载出现问题，请刷新页面重试';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 5000);
    }
  }

  /**
   * 获取错误报告
   */
  getErrorReport() {
    const report = {
      totalErrors: this.errors.length,
      errorsByType: {},
      recentErrors: this.errors.slice(0, 10),
      criticalErrors: this.errors.filter(e => 
        e.message?.includes('initialization') || 
        e.message?.includes('Cannot access')
      )
    };

    // 按类型统计
    this.errors.forEach(error => {
      report.errorsByType[error.type] = (report.errorsByType[error.type] || 0) + 1;
    });

    return report;
  }

  /**
   * 清除错误日志
   */
  clearErrors() {
    this.errors = [];
    localStorage.removeItem('error_monitor_logs');
  }

  /**
   * 导出错误日志
   */
  exportErrors() {
    const data = JSON.stringify(this.errors, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// 创建单例
const errorMonitor = new ErrorMonitor();

// 自动初始化
if (typeof window !== 'undefined') {
  // 确保DOM加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => errorMonitor.init());
  } else {
    errorMonitor.init();
  }
}

// 导出供其他模块使用
export default errorMonitor;

// 在开发环境暴露到全局方便调试
if (import.meta.env.DEV) {
  window.errorMonitor = errorMonitor;
}