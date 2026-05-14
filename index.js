const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const clients = new Map();

app.get('/', (req, res) => {
    res.json({
          status: 'online',
          service: 'DoctorGreen Signaling Server',
          version: '1.0.0',
          connections: clients.size
    });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
          origin: "*",
          methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

        socket.on('register', (data) => {
              clients.set(data.id, { socketId: socket.id, password: data.password });
              socket.userId = data.id;
              console.log(`Registered user ${data.id}`);
        });

        socket.on('offer', (data) => {
              console.log(`Offer from ${data.caller} to ${data.target}`);
              const targetClient = clients.get(data.target);
              if (targetClient) {
                      io.to(targetClient.socketId).emit('offer', {
                                caller: data.caller,
                                offer: data.offer,
                                password: data.password
                      });
              }
        });

        socket.on('answer', (data) => {
              console.log(`Answer to ${data.target}`);
              const targetClient = clients.get(data.target);
              if (targetClient) {
                      io.to(targetClient.socketId).emit('answer', {
                                answer: data.answer
                      });
              }
        });

        socket.on('ice-candidate', (data) => {
              const targetClient = clients.get(data.target);
              if (targetClient) {
                      io.to(targetClient.socketId).emit('ice-candidate', {
                                candidate: data.candidate
                      });
              }
        });

        socket.on('disconnect', () => {
              console.log('User disconnected:', socket.id);
              if (socket.userId) {
                      clients.delete(socket.userId);
                      console.log(`Unregistered user ${socket.userId}`);
              }
        });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Signaling server running on port ${PORT}`);
});
