/**
 * 消息WebSocket类型定义
 */

declare module 'sockjs-client' {
  class SockJS {
    constructor(url: string);
    static transports: string[];
  close(): void;
    onopen?: () => void;
    onmessage?: (data: any) => void;
    onerror?: (error: any) => void;
    onclose?: () => void;
  send(data: string | ArrayBuffer): void;
  readyState: number;
  url: string;
    protocol: string;
    binaryType: string;
    extensions: {
    [key: string]: any;
  };
  transport: any;
    transportUrl: string;
    baseUrl: string;
    server: any;
    _transports: any;
    _transport: any;
    _timeout: number;
    _serverTimeout: number;
    _interval: number;
    _xhr: any;
    _ir: any;
    _messageBuffer: any[];
    _messageQueue: any[];
    _stateListeners: any[];
    _doneListeners: any[];
    _transportListeners: any[];
    _heartbeatTimeout: any;
    _heartbeatInterval: any;
  }
}

declare module '@stomp/stompjs' {
  interface IFrame {
    command: string;
    headers: { [key: string]: string };
    body: string;
    isBinaryBody: boolean;
  }

  interface IMessage {
    command: string;
    headers: { [key: string]: string };
    body: string;
    isBinaryBody: boolean;
    ack: { headers: { [key: string]: string } } | null;
  }

  class Client {
    connected: boolean;
    webSocket: any;
    heartbeat: {
      outgoing: number;
      incoming: number;
    };

    onConnect: (() => void) | null;
    onDisconnect: (() => void) | null;
    onStompError: ((frame: IFrame) => void) | null;
    onWebSocketError: ((event: any) => void) | null;
    onWebSocketClose: (() => void) | null;

    activate(): void;
    deactivate(): void;
    subscribe(destination: string, callback: (message: IMessage) => void): any;
    publish(destination: string, body: any): void;
    configure(promise: any): void;
  }
}
