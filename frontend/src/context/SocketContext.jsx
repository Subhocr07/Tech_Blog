import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { info } = useToast();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    let newSocket = null;

    try {
      newSocket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });

      newSocket.on('connect', () => {
        if (user?._id || user?.id) {
          const uid = user._id || user.id;
          newSocket.emit('join', uid);
        }
      });

      newSocket.on('notification:comment', (data) => {
        info(data.message || 'Someone commented on your post');
        setNotifications((prev) => [data, ...prev]);
      });

      newSocket.on('post:created', (data) => {
        const currentUserId = user?._id || user?.id;
        if (data.author?.id !== currentUserId) {
          info(`New Post: "${data.title}" by ${data.author?.name}`);
        }
      });

      setSocket(newSocket);
    } catch {}

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user, info]);

  return (
    <SocketContext.Provider value={{ socket, notifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
