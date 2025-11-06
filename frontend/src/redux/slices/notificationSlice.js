import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
  pagination: {
    totalPages: 0,
    currentPage: 1,
    totalNotifications: 0,
  },
};

// Get notifications
export const getNotifications = createAsyncThunk(
  'notifications/getAll',
  async (filters = {}, thunkAPI) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/notifications?${params}`);
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch notifications';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get unread count
export const getUnreadCount = createAsyncThunk(
  'notifications/getUnreadCount',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.data.count;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to get unread count';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Mark as read
export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id, thunkAPI) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data.data.notification;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to mark as read';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Mark all as read
export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, thunkAPI) => {
    try {
      await api.put('/notifications/read-all');
      return true;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to mark all as read';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete notification
export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/notifications/${id}`);
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to delete notification';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
  },
  extraReducers: (builder) => {
    builder
      // Get notifications
      .addCase(getNotifications.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
        state.pagination = {
          totalPages: action.payload.totalPages,
          currentPage: action.payload.currentPage,
          totalNotifications: action.payload.totalNotifications,
        };
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get unread count
      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      // Mark as read
      .addCase(markAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex((n) => n._id === action.payload._id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      // Mark all as read
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({
          ...n,
          isRead: true,
        }));
        state.unreadCount = 0;
      })
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.notifications = state.notifications.filter((n) => n._id !== action.payload);
      });
  },
});

export const { reset } = notificationSlice.actions;
export default notificationSlice.reducer;