/**
 * 消息通知WebSocket客户端
 * 用于实时接收消息推送
 */
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class MessageWebSocketClient {
  private socket: WebSocket | null = null;
  private stompClient: Client | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 6;
  private reconnectInterval = 5000;
  private subscriptions: Map<string, any> = new Map();

  constructor() {
    // 不自动连接，等待手动调用connect
  }

  /**
   * 连接WebSocket
   */
  connect() {
    if (this.connected) {
      console.log('消息WebSocket已连接，无需重复连接');
      return;
    }

    try {
      console.log('开始连接消息WebSocket...');

      // 创建SockJS连接
      this.socket = new SockJS('/ws/smart-bed');

      // 创建STOMP客户端
      this.stompClient = new Client({
        webSocketFactory: () => this.socket as any,
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        reconnectDelay: 0, // 禁用自动重连，使用自定义重连逻辑
        heartbeatIncoming: 10000, // 接收心跳间隔
        heartbeatOutgoing: 10000, // 发送心跳间隔
      });

      // 连接成功
      this.stompClient.onConnect = () => {
        console.log('消息WebSocket连接成功');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.resubscribeAll();
      };

      // 连接失败
      this.stompClient.onStompError = (frame) => {
        console.error('消息WebSocket STOMP错误:', frame);
        this.connected = false;
        this.handleReconnect();
      };

      // WebSocket错误
      this.stompClient.onWebSocketError = (event) => {
        console.error('消息WebSocket连接失败:', event);
        this.connected = false;
        this.handleReconnect();
      };

      // WebSocket关闭
      this.stompClient.onWebSocketClose = () => {
        console.log('消息WebSocket连接关闭');
        this.connected = false;
      };

      // 激活连接
      this.stompClient.activate();

    } catch (error) {
      console.error('WebSocket连接异常:', error);
      this.handleReconnect();
    }
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`消息WebSocket重连尝试 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      setTimeout(() => {
        this.connect();
      }, this.reconnectInterval);
    } else {
      console.error('消息WebSocket重连次数已达上限，停止重连');
    }
  }

  /**
   * 订阅消息通知
   */
  subscribeMessages(callback: (data: any) => void) {
    const destination = '/topic/messages';
    this.subscribe(destination, callback);
  }

  /**
   * 通用订阅方法
   */
  private subscribe(destination: string, callback: (data: any) => void) {
    if (!this.connected) {
      console.warn('WebSocket未连接，无法订阅:', destination);
      // 保存订阅信息，等待连接后重新订阅
      this.subscriptions.set(destination, callback);
      return;
    }

    if (this.subscriptions.has(destination)) {
      // 已存在订阅，先取消
      try {
        const sub = this.subscriptions.get(destination);
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      } catch (error) {
        console.warn('取消订阅失败:', error);
      }
    }

    // 订阅消息
    const subscription = this.stompClient.subscribe(destination, (message: any) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch (error) {
        console.error('解析WebSocket消息失败:', error, message.body);
      }
    });

    this.subscriptions.set(destination, subscription);
    console.log('订阅消息通知成功:', destination);
  }

  /**
   * 取消订阅
   */
  unsubscribe(destination: string) {
    if (this.subscriptions.has(destination)) {
      try {
        const sub = this.subscriptions.get(destination);
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      } catch (error) {
        console.warn('取消订阅失败:', error);
      }
      this.subscriptions.delete(destination);
      console.log('取消订阅:', destination);
    }
  }

  /**
   * 重新订阅所有主题
   */
  private resubscribeAll() {
    console.log('重新订阅所有消息主题');
    // subscriptions中保存的是callback，需要重新订阅
    this.subscriptions.forEach((callback, destination) => {
      this.subscribe(destination, callback);
    });
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.stompClient) {
      try {
        this.stompClient.deactivate();
      } catch (error) {
        console.warn('断开WebSocket连接失败:', error);
      }
    }
    this.connected = false;
    this.subscriptions.clear();
    console.log('消息WebSocket连接已断开');
  }

  /**
   * 获取连接状态
   */
  isConnected(): boolean {
    return this.connected;
  }
}

// 创建全局实例
const messageWebSocket = new MessageWebSocketClient();

export default messageWebSocket;
