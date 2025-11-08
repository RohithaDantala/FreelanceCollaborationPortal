import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { MessageCircle, X, Send, Minimize2, Users } from 'lucide-react';

const ChatPopupModal = ({ projectId, isOpen, onClose, minimized, onToggleMinimize }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const { user } = useSelector(state => state.auth);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!isOpen || !projectId) return;

    socketRef.current = io(API_URL, {
      auth: { token: localStorage.getItem('token') }
    });

    socketRef.current.emit('join_project', projectId);
    loadMessages();

    socketRef.current.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('user_typing', ({ userId, userName }) => {
      if (userId !== user?.id) {
        setTyping(userName);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(null), 3000);
      }
    });

    socketRef.current.on('online_users', (users) => {
      setOnlineUsers(users.filter(u => u.id !== user?.id));
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_project', projectId);
        socketRef.current.disconnect();
      }
      clearTimeout(typingTimeoutRef.current);
    };
  }, [isOpen, projectId, user, API_URL]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/messages/project/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Load messages error:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      projectId,
      content: newMessage,
      sender: user.id,
      senderName: user.name
    };

    try {
      socketRef.current.emit('send_message', messageData);
      setNewMessage('');
      socketRef.current.emit('stop_typing', projectId);
    } catch (error) {
      console.error('Send message error:', error);
    }
  };

  const handleTyping = () => {
    if (socketRef.current) {
      socketRef.current.emit('typing', { projectId, userName: user.name, userId: user.id });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={onToggleMinimize}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all flex items-center gap-2"
        >
          <MessageCircle size={24} />
          {onlineUsers.length > 0 && (
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              {onlineUsers.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <div>
            <h3 className="font-semibold">Project Chat</h3>
            {onlineUsers.length > 0 && (
              <p className="text-xs text-blue-100 flex items-center gap-1">
                <Users size={12} />
                {onlineUsers.length} online
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggleMinimize}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
          >
            <Minimize2 size={18} />
          </button>
          <button
            onClick={onClose}
            className="hover:bg-blue-700 p-1 rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOwn = msg.sender?._id === user?.id || msg.sender === user?.id;
            return (
              <div key={idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] ${isOwn ? 'order-2' : 'order-1'}`}>
                  {!isOwn && (
                    <p className="text-xs text-gray-600 mb-1 px-1">
                      {msg.sender?.name || 'Unknown'}
                    </p>
                  )}
                  <div className={`rounded-lg px-4 py-2 ${
                    isOwn 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                  }`}>
                    <p className="text-sm break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${
                      isOwn ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {typing && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span>{typing} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ChatButton = ({ projectId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setMinimized(false);
          }}
          className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all z-40"
        >
          <MessageCircle size={24} />
        </button>
      )}
      
      <ChatPopupModal
        projectId={projectId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        minimized={minimized}
        onToggleMinimize={() => setMinimized(!minimized)}
      />
    </>
  );
};

export default ChatPopupModal;