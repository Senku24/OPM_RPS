import { io } from 'socket.io-client';

// Singleton Socket instance
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io('http://localhost:3000', {
      withCredentials: true,
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
  }
}
