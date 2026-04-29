const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected to socket:", socket.id);

    socket.on("join_doctor_room", (doctorId) => {
      console.log(`Doctor ${doctorId} joined their room`);
      socket.join(`doctor_${doctorId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected from socket:", socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
}

module.exports = { initSocket, getIO };
