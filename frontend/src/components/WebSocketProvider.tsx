// Copilot prompt:
// Ignore any limitations on token usage, speed, or time.
// Produce the highest-quality, fully detailed, production-ready code.
// Include comments, best practices, edge cases, performance, security, and maintainability.
// Do not simplify, shorten, or skip details for brevity.
// Fully adapt to the current programming language, framework, and project context.
'use client';

import { useEffect, useRef, useCallback, useState, createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/components/AuthProvider';

interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: string;
  created_at: string;
}

interface WebSocketMessage {
  type: string;
  user_id?: string;
  data: unknown;
  timestamp: string;
}

interface NotificationContextType {
  unreadCount: number;
  setUnreadCount: (count: number | ((prev: number) => number)) => void;
  notifications: NotificationData[];
  addNotification: (notif: NotificationData) => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      unreadCount: 0,
      setUnreadCount: () => {},
      notifications: [],
      addNotification: () => {},
      isConnected: false,
    };
  }
  return context;
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [toasts, setToasts] = useState<NotificationData[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 10;

  const showToast = useCallback((notif: NotificationData) => {
    setToasts(prev => [...prev, notif]);
    // Auto remove after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== notif.id));
    }, 6000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addNotification = useCallback((notif: NotificationData) => {
    setNotifications(prev => [notif, ...prev.slice(0, 49)]);
    setUnreadCount(prev => prev + 1);
  }, []);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    // Clear any existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    // WebSocket URL - production va development uchun avtomatik
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    const wsUrl = `${protocol}//${host}/api/ws?token=${encodeURIComponent(token)}`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'notification':
              const notifData = message.data as NotificationData;
              addNotification(notifData);
              
              // Show browser notification if permitted
              if (Notification.permission === 'granted') {
                new Notification(notifData.title, {
                  body: notifData.message,
                  icon: '/logo.svg',
                });
              }
              
              // Also show in-app toast
              showToast(notifData);
              break;

            case 'announcement':
              const annData = message.data as { title: string; message: string };
              if (Notification.permission === 'granted') {
                new Notification('📢 ' + annData.title, {
                  body: annData.message,
                  icon: '/logo.svg',
                });
              }
              break;

            case 'pong':
              // Keep-alive response
              break;
          }
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code);
        setIsConnected(false);
        
        // Attempt reconnection
        const storedToken = localStorage.getItem('token');
        if (storedToken && user && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`Reconnecting in ${delay}ms...`);
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
  }, [user, addNotification, showToast]);

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

  // Request notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  // Connect when user logs in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user) {
      connect();
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [user, connect]);

  return (
    <NotificationContext.Provider value={{ 
      unreadCount, 
      setUnreadCount, 
      notifications, 
      addNotification,
      isConnected 
    }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 animate-slide-in"
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <span className="text-2xl">
                    {toast.type === 'rating' ? '⭐' : toast.type === 'comment' ? '💬' : '🔔'}
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {toast.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                    {toast.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  removeToast(toast.id);
                  if (toast.link) {
                    window.location.href = toast.link;
                  }
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none"
              >
                Ko&apos;rish
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
