// frontend/src/redux/slices/timeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchRunning = createAsyncThunk('time/fetchRunning', async () => {
  const { data } = await api.get('/time/running');
  return data.data;
});

export const startTimer = createAsyncThunk('time/startTimer', async (payload, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/time/start', payload);
    return data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to start timer');
  }
});

export const stopTimer = createAsyncThunk('time/stopTimer', async (entryId = '', { rejectWithValue }) => {
  try {
    const path = entryId ? `/time/stop/${entryId}` : '/time/stop';
    const { data } = await api.post(path);
    return data.data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || 'Failed to stop timer');
  }
});

export const fetchEntries = createAsyncThunk('time/fetchEntries', async (params = {}) => {
  const { data } = await api.get('/time/entries', { params });
  return data.data;
});

export const fetchSummary = createAsyncThunk('time/fetchSummary', async (days = 14) => {
  const { data } = await api.get('/time/summary', { params: { days } });
  return data.data;
});

const timeSlice = createSlice({
  name: 'time',
  initialState: {
    running: null,
    entries: [],
    summary: { perDay: [], byProject: [], since: null },
    isLoading: false,
    error: null,
  },
  reducers: {
    resetTime: (state) => {
      state.running = null;
      state.entries = [];
      state.summary = { perDay: [], byProject: [], since: null };
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRunning.fulfilled, (state, action) => {
        state.running = action.payload;
      })
      .addCase(startTimer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(startTimer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.running = action.payload;
        state.error = null;
      })
      .addCase(startTimer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to start timer';
      })
      .addCase(stopTimer.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(stopTimer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.running = null;
        // Optionally push finished entry to entries list
        state.entries = [action.payload, ...state.entries];
        state.error = null;
      })
      .addCase(stopTimer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to stop timer';
      })
      .addCase(fetchEntries.fulfilled, (state, action) => {
        state.entries = action.payload;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      });
  },
});

export const { resetTime } = timeSlice.actions;
export default timeSlice.reducer;
