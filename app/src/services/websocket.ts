/**
 * WebSocket Service para sincronização em tempo real
 * Sincroniza localizações, posts, reviews e notificações entre todos os usuários
 */

type MessageType = 'location_created' | 'location_updated' | 'location_deleted' | 
                   'post_created' | 'post_updated' | 'post_deleted' |
                   'review_created' | 'review_updated' | 'review_deleted' |
                   'notification_created' | 'user_online' | 'user_offline';

interface WebSocketMessage {
  type: MessageType;
  data: any;
  timestamp: string;
  userId?: string;
}

interface WebSocketCallbacks {
  onLocationCreated?: (location: any) => void;
  onLocationUpdated?: (location: any) => void;
  onLocationDeleted?: (locationId: string) => void;
  onPostCreated?: (post: any) => void;
  onPostUpdated?: (post: any) => void;
  onPostDeleted?: (postId: string) => void;
  onReviewCreated?: (review: any) => void;
  onReviewUpdated?: (review: any) => void;
  onReviewDeleted?: (reviewId: string) => void;
  onNotificationCreated?: (notification: any) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
  onError?: (error: string) => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private isManualClose = false;
  private messageQueue: WebSocketMessage[] = [];
  private isConnected = false;

  constructor(url?: string) {
    // Use WebSocket URL based on API URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
    const wsHost = apiUrl.replace(/^https?:\/\//, '').replace(/\/api$/, '');
    const token = localStorage.getItem('txopela_token');
    
    this.url = url || `${wsProtocol}://${wsHost}/ws/locations/?token=${token}`;
  }

  /**
   * Conectar ao WebSocket
   */
  connect(callbacks: WebSocketCallbacks = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.callbacks = callbacks;
        this.isManualClose = false;

        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket conectado');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Enviar token de autenticação
          const token = localStorage.getItem('txopela_token');
          if (token) {
            this.send({
              type: 'user_online' as MessageType,
              data: { token },
              timestamp: new Date().toISOString(),
            });
          }

          // Processar fila de mensagens
          this.processMessageQueue();

          // Chamar callback de conexão
          this.callbacks.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Erro ao processar mensagem WebSocket:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Erro WebSocket:', error);
          this.callbacks.onError?.('Erro de conexão WebSocket');
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket desconectado');
          this.isConnected = false;
          this.callbacks.onDisconnected?.();

          // Tentar reconectar se não foi fechado manualmente
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Tentando reconectar... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            setTimeout(() => this.connect(callbacks), this.reconnectDelay);
          }
        };
      } catch (error) {
        console.error('Erro ao conectar WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Desconectar do WebSocket
   */
  disconnect(): void {
    this.isManualClose = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Enviar mensagem
   */
  send(message: WebSocketMessage): void {
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Adicionar à fila se não estiver conectado
      this.messageQueue.push(message);
      console.warn('WebSocket não conectado. Mensagem adicionada à fila.');
    }
  }

  /**
   * Processar fila de mensagens
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  /**
   * Processar mensagem recebida
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('📨 Mensagem recebida:', message.type, message.data);

    switch (message.type) {
      case 'location_created':
        this.callbacks.onLocationCreated?.(message.data);
        break;
      case 'location_updated':
        this.callbacks.onLocationUpdated?.(message.data);
        break;
      case 'location_deleted':
        this.callbacks.onLocationDeleted?.(message.data.id);
        break;
      case 'post_created':
        this.callbacks.onPostCreated?.(message.data);
        break;
      case 'post_updated':
        this.callbacks.onPostUpdated?.(message.data);
        break;
      case 'post_deleted':
        this.callbacks.onPostDeleted?.(message.data.id);
        break;
      case 'review_created':
        this.callbacks.onReviewCreated?.(message.data);
        break;
      case 'review_updated':
        this.callbacks.onReviewUpdated?.(message.data);
        break;
      case 'review_deleted':
        this.callbacks.onReviewDeleted?.(message.data.id);
        break;
      case 'notification_created':
        this.callbacks.onNotificationCreated?.(message.data);
        break;
      case 'user_online':
        this.callbacks.onUserOnline?.(message.userId || '');
        break;
      case 'user_offline':
        this.callbacks.onUserOffline?.(message.userId || '');
        break;
      default:
        console.warn('Tipo de mensagem desconhecido:', message.type);
    }
  }

  /**
   * Notificar que uma localização foi criada
   */
  notifyLocationCreated(location: any): void {
    this.send({
      type: 'location_created',
      data: location,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notificar que um post foi criado
   */
  notifyPostCreated(post: any): void {
    this.send({
      type: 'post_created',
      data: post,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notificar que um review foi criado
   */
  notifyReviewCreated(review: any): void {
    this.send({
      type: 'review_created',
      data: review,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Verificar se está conectado
   */
  isConnectedToServer(): boolean {
    return this.isConnected;
  }
}

// Exportar instância singleton
export const wsService = new WebSocketService();
export default WebSocketService;
