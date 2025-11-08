// backend/sockets/chatSocket.js - FIXED PATHS
const Message = require('../src/models/Message');
const Project = require('../src/models/Project');
const User = require('../src/models/User');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.firstName} ${socket.user.lastName} (${socket.id})`);

    // Join project room
    socket.on('join_project', async (projectId) => {
      try {
        // Verify user is project member
        const project = await Project.findById(projectId);
        
        if (!project) {
          socket.emit('error', { message: 'Project not found' });
          return;
        }

        const isMember = project.members.some(
          m => m.user.toString() === socket.user.id
        ) || project.owner.toString() === socket.user.id;

        if (!isMember) {
          socket.emit('error', { message: 'Not a project member' });
          return;
        }

        socket.join(`project_${projectId}`);
        console.log(`📥 ${socket.user.firstName} joined project ${projectId}`);

        // Get online users in this project room
        const socketsInRoom = await io.in(`project_${projectId}`).fetchSockets();
        const onlineUsers = socketsInRoom.map(s => ({
          id: s.user.id,
          name: `${s.user.firstName} ${s.user.lastName}`,
          socketId: s.id
        }));

        // Notify room about online users
        io.to(`project_${projectId}`).emit('online_users', onlineUsers);

        // Send recent messages to the newly joined user
        const recentMessages = await Message.find({ project: projectId, isDeleted: false })
          .sort({ createdAt: -1 })
          .limit(50)
          .populate('sender', 'firstName lastName avatar')
          .lean();

        socket.emit('recent_messages', recentMessages.reverse());

      } catch (error) {
        console.error('❌ Join project error:', error);
        socket.emit('error', { message: 'Failed to join project' });
      }
    });
    
    // Send message
    socket.on('send_message', async (data) => {
      try {
        const { projectId, content } = data;

        if (!content || !content.trim()) {
          return;
        }

        // Save message to database
        const message = await Message.create({
          project: projectId,
          sender: socket.user.id,
          content: content.trim(),
          createdAt: new Date()
        });

        // Populate sender info
        await message.populate('sender', 'firstName lastName avatar');

        // Broadcast to all users in project room
        io.to(`project_${projectId}`).emit('new_message', {
          _id: message._id,
          content: message.content,
          sender: {
            _id: message.sender._id,
            name: `${message.sender.firstName} ${message.sender.lastName}`,
            firstName: message.sender.firstName,
            lastName: message.sender.lastName,
            avatar: message.sender.avatar
          },
          createdAt: message.createdAt,
          type: message.type,
          isEdited: message.isEdited,
          isDeleted: message.isDeleted
        });

        console.log(`📤 Message sent in project ${projectId} by ${socket.user.firstName}`);

      } catch (error) {
        console.error('❌ Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ projectId }) => {
      socket.to(`project_${projectId}`).emit('user_typing', {
        userId: socket.user.id,
        userName: `${socket.user.firstName} ${socket.user.lastName}`
      });
    });

    socket.on('stop_typing', ({ projectId }) => {
      socket.to(`project_${projectId}`).emit('user_stop_typing', {
        userId: socket.user.id
      });
    });

    // Leave project
    socket.on('leave_project', async (projectId) => {
      socket.leave(`project_${projectId}`);
      console.log(`📤 ${socket.user.firstName} left project ${projectId}`);

      // Update online users
      const socketsInRoom = await io.in(`project_${projectId}`).fetchSockets();
      const onlineUsers = socketsInRoom.map(s => ({
        id: s.user.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        socketId: s.id
      }));

      io.to(`project_${projectId}`).emit('online_users', onlineUsers);
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.firstName} (${socket.id})`);
      
      // Update all rooms this user was in
      const rooms = Array.from(socket.rooms).filter(r => r.startsWith('project_'));
      for (const room of rooms) {
        const socketsInRoom = await io.in(room).fetchSockets();
        const onlineUsers = socketsInRoom.map(s => ({
          id: s.user.id,
          name: `${s.user.firstName} ${s.user.lastName}`,
          socketId: s.id
        }));
        io.to(room).emit('online_users', onlineUsers);
      }
    });
  });
};