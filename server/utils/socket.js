let io;

module.exports = {
  init: (server) => {
    io = require('socket.io')(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT"]
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('join', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io not initialized!");
    }
    return io;
  }
};
