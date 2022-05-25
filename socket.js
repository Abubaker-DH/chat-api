let io;
let conUsers = [];

module.exports = {
  init: (httpServer) => {
    io = require("socket.io")(httpServer);
    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket io not initialized.");
    }
    return io;
  },
  getUsers: () => {
    return conUsers;
  },
  saveUser: (userId, socketId) => {
    !conUsers.some((user) => user.userId === userId) &&
      conUsers.push({ userId, socketId });
  },
  removeUser: (socketId) => {
    conUsers.filter((user) => user.socketId !== socketId);
  },
};
