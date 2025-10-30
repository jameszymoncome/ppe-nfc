let socket = null;
let listeners = [];
let reconnectInterval = 2000; // 2s retry

export function connectWebSocket(force = false) {
  if (socket && socket.readyState !== WebSocket.CLOSED) {
    if (!force) return socket;
    socket.close(); // cleanup before reconnect
  }

  socket = new WebSocket("wss://ppe-backends.onrender.com");

  socket.onopen = () => {
    console.log("✅ WebSocket connected borat");
    const userID = localStorage.getItem("userId"); // consistent key name
    if (userID) {
      socket.send(JSON.stringify({ type: "accStatus", userID }));
    }
  };

  socket.onmessage = (event) => {
    console.log("📩 WS Message:", event.data);
    listeners.forEach((cb) => cb(event.data));
  };

  socket.onclose = () => {
    console.log("❌ WebSocket disconnected, retrying...");
    setTimeout(connectWebSocket, reconnectInterval); // auto reconnect
  };

  socket.onerror = (err) => {
    console.error("⚠️ WebSocket error:", err);
    socket.close(); // trigger onclose → retry
  };

  return socket;
}

export function sendMessage(msg) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msg));
  } else {
    console.warn("⚠️ Cannot send message, socket not open");
  }
}

export function onMessage(callback) {
  if (!listeners.includes(callback)) {
    listeners.push(callback);
  }
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}
