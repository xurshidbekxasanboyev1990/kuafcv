// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../components/AuthProvider';
import { toast } from 'react-hot-toast';

interface WebSocketMessage {
  type: string;
  user_id?: string;
  data: unknown;
  timestamp: string;
}

interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: string;
  created_at: string;
}

interface UseWebSocketOptions {
  onNotification?: (notification: NotificationData) => void;
  onAnnouncement?: (data: { title: string; message: string }) => void;
  onMessage?: (message: WebSocketMessage) => void;
  showToasts?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { token, user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  const { onNotification, onAnnouncement, onMessage, showToasts = true } = options;

  const connect = useCallback(() => {
    if (!token || !user) return;

    // Clear any existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_API_URL?.replace('http', 'ws')}/ws`;
    
    try {
      const ws = new WebSocket(wsUrl, ['Authorization', token]);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        
        // Send auth message
        ws.send(JSON.stringify({ type: 'auth', token }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);

          // Handle different message types
          switch (message.type) {
            case 'notification':
              const notifData = message.data as NotificationData;
              onNotification?.(notifData);
              
              if (showToasts) {
                toast(notifData.message, {
                  icon: notifData.type === 'rating' ? '⭐' : '💬',
                  duration: 5000,
                });
              }
              break;

            case 'announcement':
              const annData = message.data as { title: string; message: string };
              onAnnouncement?.(annData);
              
              if (showToasts) {
                toast(annData.message, {
                  icon: '📢',
                  duration: 8000,
                });
              }
              break;

            case 'pong':
              // Keep-alive response
              break;

            default:
              onMessage?.(message);
          }
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++;
            connect();
          }, delay);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, [token, user, onNotification, onAnnouncement, onMessage, showToasts]);

  // Send ping every 25 seconds to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((type: string, data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    reconnect: connect,
  };
}

// Notification context for global state
import { createContext, useContext, ReactNode } from 'react';

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  notifications: NotificationData[];
  addNotification: (notif: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((notif: NotificationData) => {
    setNotifications(prev => [notif, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, setUnreadCount, notifications, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
}
