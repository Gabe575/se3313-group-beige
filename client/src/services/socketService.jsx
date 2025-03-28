// Sets up web sockets


let socket = null;

const initializeSocket = () => {
  socket = new WebSocket('ws://localhost:9002'); // Connect to your WebSocket server

  socket.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  socket.onerror = (error) => {
    console.error('WebSocket Error: ', error);
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received data:', data);
  };

  socket.onclose = () => {
    console.log('WebSocket connection closed');
  };
};

const sendMessage = (message) => {
  if (socket) {
    socket.send(JSON.stringify(message));
  }
};

const closeSocket = () => {
  if (socket) {
    socket.close();
  }
};

export { initializeSocket, sendMessage, closeSocket };
