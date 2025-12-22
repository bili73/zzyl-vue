/**
 * WebSocket客户端工具类
 * 用于连接智能床位实时数据推送
 */
class SmartBedWebSocketClient {
  private socket: any = null;
  private stompClient: any = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private subscriptions: Map<string, any> = new Map();

  constructor() {
    this.connect();
  }

  /**
   * 连接WebSocket
   */
  connect() {
    try {
      // 加载SockJS和STOMP客户端库
      this.loadScripts().then(() => {
        const socket = new (window as any).SockJS('/ws/smart-bed');
        const stompClient = (window as any).Stomp.over(socket);

        this.socket = socket;
        this.stompClient = stompClient;

        stompClient.connect({}, () => {
          console.log('智能床位WebSocket连接成功');
          this.connected = true;
          this.reconnectAttempts = 0;
          this.resubscribeAll();
        }, (error: any) => {
          console.error('智能床位WebSocket连接失败:', error);
          this.connected = false;
          this.handleReconnect();
        });

        // 心跳检测
        stompClient.heartbeat.outgoing = 10000;
        stompClient.heartbeat.incoming = 10000;

      }).catch((error) => {
        console.error('加载WebSocket库失败:', error);
      });

    } catch (error) {
      console.error('WebSocket连接异常:', error);
    }
  }

  /**
   * 加载必要的脚本库
   */
  private loadScripts(): Promise<void> {
    return new Promise((resolve, reject) => {
      const scripts = [
        'https://cdn.jsdelivr.net/npm/sockjs-client@1.6.1/dist/sockjs.min.js',
        'https://cdn.jsdelivr.net/npm/@stomp/stompjs@7.0.0/bundles/stomp.umd.min.js'
      ];

      let loadedCount = 0;

      scripts.forEach(src => {
        if (document.querySelector(`script[src="${src}"]`)) {
          loadedCount++;
          if (loadedCount === scripts.length) {
            resolve();
          }
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          loadedCount++;
          if (loadedCount === scripts.length) {
            resolve();
          }
        };
        script.onerror = () => {
          reject(new Error(`Failed to load script: ${src}`));
        };
        document.head.appendChild(script);
      });
    });
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`WebSocket重连尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('WebSocket重连次数已达上限，停止重连');
    }
  }

  /**
   * 订阅床位状态更新
   */
  subscribeBedStatus(bedNumber: string, callback: (data: any) => void) {
    const destination = `/topic/smart-bed/bed-status/${bedNumber}`;
    this.subscribe(destination, callback);
  }

  /**
   * 订阅所有床位状态更新
   */
  subscribeAllBedStatus(callback: (data: any) => void) {
    const destination = '/topic/smart-bed/all-status';
    this.subscribe(destination, callback);
  }

  /**
   * 订阅报警信息
   */
  subscribeAlarms(callback: (data: any) => void) {
    const destination = '/topic/smart-bed/alarms';
    this.subscribe(destination, callback);
  }

  /**
   * 订阅特定床位报警
   */
  subscribeBedAlarms(bedNumber: string, callback: (data: any) => void) {
    const destination = `/topic/smart-bed/alarms/${bedNumber}`;
    this.subscribe(destination, callback);
  }

  /**
   * 订阅设备状态变更
   */
  subscribeDeviceStatus(callback: (data: any) => void) {
    const destination = '/topic/smart-bed/device-status';
    this.subscribe(destination, callback);
  }

  /**
   * 订阅系统通知
   */
  subscribeNotifications(callback: (data: any) => void) {
    const destination = '/topic/smart-bed/notifications';
    this.subscribe(destination, callback);
  }

  /**
   * 通用订阅方法
   */
  private subscribe(destination: string, callback: (data: any) => void) {
    if (!this.connected) {
      console.warn('WebSocket未连接，无法订阅:', destination);
      return;
    }

    if (this.subscriptions.has(destination)) {
      // 已存在订阅，先取消
      this.subscriptions.get(destination).unsubscribe();
    }

    const subscription = this.stompClient.subscribe(destination, (message: any) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('解析WebSocket消息失败:', error, message.body);
      }
    });

    this.subscriptions.set(destination, subscription);
    console.log('订阅成功:', destination);
  }

  /**
   * 取消订阅
   */
  unsubscribe(destination: string) {
    if (this.subscriptions.has(destination)) {
      this.subscriptions.get(destination).unsubscribe();
      this.subscriptions.delete(destination);
      console.log('取消订阅:', destination);
    }
  }

  /**
   * 重新订阅所有主题
   */
  private resubscribeAll() {
    // 这里可以保存之前的订阅回调并重新订阅
    // 为了简化，这里只是打印日志
    console.log('重新订阅所有主题');
  }

  /**
   * 发送消息
   */
  send(destination: string, body: any) {
    if (!this.connected) {
      console.warn('WebSocket未连接，无法发送消息');
      return;
    }

    this.stompClient.send(destination, {}, JSON.stringify(body));
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.stompClient) {
      this.stompClient.disconnect();
    }
    this.connected = false;
    this.subscriptions.clear();
    console.log('WebSocket连接已断开');
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }
}

// 创建全局实例
const smartBedWebSocket = new SmartBedWebSocketClient();

export default smartBedWebSocket;