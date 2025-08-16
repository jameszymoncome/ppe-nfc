import React, { createContext, useRef, useEffect } from 'react';

export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const ws = useRef(null);

useEffect(() => {
  ws.current = new WebSocket('ws://localhost:8080'); // <-- use your real server URL
  ws.current.onopen = () => console.log('WebSocket connected');
  ws.current.onclose = () => console.log('WebSocket disconnected');
  return () => ws.current.close();
}, []);

  return (
    <WebSocketContext.Provider value={ws.current}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;