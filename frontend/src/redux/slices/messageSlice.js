// frontend/src/redux/slices/messageSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  messages: [],
  unreadCount: 0,
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// Get project messages
export const getProjectMessages = createAsyncThunk(
  'messages/getProjectMessages',
  async (projectId, thunkAPI) => {
    try {
      const response = await api.get(`/projects/${projectId}/messages`);
      return response.data.data;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Send message
export const sendMessage = createAsyncThunk(
  'messages/sendMessage',
  async ({ projectId, content, type, replyTo }, thunkAPI) => {
    try {
      const response = await api.post(`/projects/${projectId}/messages`, {
        content,
        type,
        replyTo,
      });
      return response.data.data.message;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Edit message
export const editMessage = createAsyncThunk(
  'messages/editMessage',
  async ({ messageId, content }, thunkAPI) => {
    try {
      const response = await api.put(`/messages/${messageId}`, { content });
      return response.data.data.message;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete message
export const deleteMessage = createAsyncThunk(
  'messages/deleteMessage',
  async (messageId, thunkAPI) => {
    try {
      await api.delete(`/messages/${messageId}`);
      return messageId;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get unread count
export const getUnreadCount = createAsyncThunk(
  'messages/getUnreadCount',
  async (projectId, thunkAPI) => {
    try {
      const response = await api.get(`/projects/${projectId}/messages/unread`);
      return response.data.data.count;
    } catch (error) {
      const message =
        (error.response && error.response.data && error.response.data.message) ||
        error.message ||
        error.toString();
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const messageSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex((m) => m._id === action.payload._id);
      if (index !== -1) {
        state.messages[index] = action.payload;
      }
    },
    removeMessage: (state, action) => {
      state.messages = state.messages.filter((m) => m._id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Get messages
      .addCase(getProjectMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProjectMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.messages = action.payload.messages || [];
      })
      .addCase(getProjectMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Edit message
      .addCase(editMessage.fulfilled, (state, action) => {
        const index = state.messages.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) {
          state.messages[index] = action.payload;
        }
      })
      // Delete message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        state.messages = state.messages.filter((m) => m._id !== action.payload);
      })
      // Unread count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      });
  },
});

export const { reset, clearMessages, addMessage, updateMessage, removeMessage } =
  messageSlice.actions;
export default messageSlice.reducer;