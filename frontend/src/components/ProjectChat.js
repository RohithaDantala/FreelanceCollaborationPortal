// frontend/src/components/ProjectChat.js - FIXED SCROLLING & STYLING
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';
import {
  getProjectMessages,
  addMessage,
  updateMessage,
  removeMessage,
  clearMessages,
} from '../redux/slices/messageSlice';

const ProjectChat = ({ projectId }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { messages } = useSelector((state) => state.messages);
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isUserScrollingRef = useRef(false);
  const lastScrollTopRef = useRef(0);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const SOCKET_URL = API_URL.replace('/api', '');

  // Handle scroll detection
  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    // User is scrolling if they're not at the bottom
    isUserScrollingRef.current = !isAtBottom;
    lastScrollTopRef.current = scrollTop;
  };

  // Smooth scroll to bottom only if user isn't manually scrolling
  const scrollToBottom = (force = false) => {
    if (force || !isUserScrollingRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Initialize Socket.io
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.error('No token found');
      return;
    }

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('join_project', projectId);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      setIsConnected(false);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    newSocket.on('recent_messages', (recentMessages) => {
      console.log('📨 Received recent messages:', recentMessages.length);
      dispatch(clearMessages());
      recentMessages.forEach((msg) => dispatch(addMessage(msg)));
      // Force scroll on initial load
      setTimeout(() => scrollToBottom(true), 100);
    });

    newSocket.on('new_message', (message) => {
      console.log('📩 New message received:', message);
      dispatch(addMessage(message));
      // Only auto-scroll if it's the user's own message
      if (message.sender?._id === user.id || message.sender === user.id) {
        setTimeout(() => scrollToBottom(true), 100);
      }
    });

    newSocket.on('message_edited', (message) => {
      console.log('✏️ Message edited:', message);
      dispatch(updateMessage(message));
    });

    newSocket.on('message_deleted', ({ messageId }) => {
      console.log('🗑️ Message deleted:', messageId);
      dispatch(removeMessage(messageId));
    });

    newSocket.on('online_users', (users) => {
      console.log('👥 Online users:', users);
      setOnlineUsers(users);
    });

    newSocket.on('user_typing', (data) => {
      if (data.userId !== user.id) {
        setTypingUsers((prev) => {
          if (!prev.find((u) => u.userId === data.userId)) {
            return [...prev, data];
          }
          return prev;
        });
      }
    });

    newSocket.on('user_stop_typing', (data) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    setSocket(newSocket);

    return () => {
      console.log('🔌 Disconnecting socket');
      newSocket.emit('leave_project', projectId);
      newSocket.disconnect();
    };
  }, [projectId, user.id, SOCKET_URL, dispatch]);

  // Fetch initial messages from API
  useEffect(() => {
    if (projectId) {
      dispatch(getProjectMessages(projectId));
    }
    return () => {
      dispatch(clearMessages());
    };
  }, [projectId, dispatch]);

  // Scroll to bottom when messages load initially
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      
      // Only auto-scroll if user is near bottom
      if (isAtBottom || messages.length === 1) {
        scrollToBottom();
      }
    }
  }, [messages]);

  const handleTyping = () => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing', { projectId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket) {
        socket.emit('stop_typing', { projectId });
      }
    }, 1000);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    console.log('📤 Sending message:', newMessage);

    socket.emit('send_message', {
      projectId,
      content: newMessage.trim(),
    });

    setNewMessage('');
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('stop_typing', { projectId });
    
    // Force scroll after sending
    setTimeout(() => scrollToBottom(true), 100);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-primary-600 text-white px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">💬 Project Chat</h3>
            <p className="text-sm text-primary-100">Real-time team communication</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-400' : 'bg-red-400'
              }`}
              title={isConnected ? 'Connected' : 'Disconnected'}
            />
            <span className="text-sm text-primary-100">
              {onlineUsers.length} online
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        style={{ scrollBehavior: 'smooth' }}
      >
        {Object.keys(groupedMessages).length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <svg
                className="w-16 h-16 mx-auto mb-4 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p>No messages yet. Start the conversation!</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {date}
                </div>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message, index) => {
                const isOwnMessage =
                  message.sender?._id === user.id || message.sender === user.id;
                const showAvatar =
                  index === 0 ||
                  dateMessages[index - 1].sender?._id !== message.sender?._id;

                return (
                  <div
                    key={message._id || index}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2`}
                  >
                    {!isOwnMessage && showAvatar && (
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="text-primary-600 text-xs font-semibold">
                          {message.sender?.firstName?.charAt(0) || '?'}
                          {message.sender?.lastName?.charAt(0) || ''}
                        </span>
                      </div>
                    )}
                    {!isOwnMessage && !showAvatar && <div className="w-8 mr-2" />}

                    <div
                      className={`max-w-[70%] ${
                        isOwnMessage
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-gray-800'
                      } rounded-lg px-4 py-2 shadow-sm`}
                    >
                      {!isOwnMessage && showAvatar && (
                        <p className="text-xs font-semibold mb-1 opacity-75">
                          {message.sender?.firstName} {message.sender?.lastName}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p
                          className={`text-xs ${
                            isOwnMessage ? 'text-primary-100' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.createdAt)}
                        </p>
                        {message.isEdited && (
                          <span
                            className={`text-xs italic ${
                              isOwnMessage ? 'text-primary-200' : 'text-gray-400'
                            }`}
                          >
                            (edited)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="flex items-center text-gray-500 text-sm italic pl-10">
            <div className="flex space-x-1 mr-2">
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
            {typingUsers[0]?.userName || 'Someone'} is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4 bg-white flex-shrink-0">
        {!isConnected && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm px-3 py-2 rounded-lg mb-3 flex items-center gap-2">
            <span>⚠️</span>
            <span>Reconnecting to chat...</span>
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Press Enter to send)"
            disabled={!isConnected}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-sm hover:shadow-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectChat;