// frontend/src/redux/slices/milestoneSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  milestones: [],
  currentMilestone: null,
  progress: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Create milestone
export const createMilestone = createAsyncThunk(
  'milestones/create',
  async ({ projectId, milestoneData }, thunkAPI) => {
    try {
      const response = await api.post(
        `/projects/${projectId}/milestones`,
        milestoneData
      );
      return response.data.data.milestone;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to create milestone';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get project milestones
export const getProjectMilestones = createAsyncThunk(
  'milestones/getProjectMilestones',
  async (projectId, thunkAPI) => {
    try {
      const response = await api.get(`/projects/${projectId}/milestones`);
      return response.data.data.milestones;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch milestones';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single milestone
export const getMilestone = createAsyncThunk(
  'milestones/getOne',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/milestones/${id}`);
      return response.data.data.milestone;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch milestone';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update milestone
export const updateMilestone = createAsyncThunk(
  'milestones/update',
  async ({ id, milestoneData }, thunkAPI) => {
    try {
      const response = await api.put(`/milestones/${id}`, milestoneData);
      return response.data.data.milestone;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to update milestone';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete milestone
export const deleteMilestone = createAsyncThunk(
  'milestones/delete',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/milestones/${id}`);
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to delete milestone';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get project progress
export const getProjectProgress = createAsyncThunk(
  'milestones/getProgress',
  async (projectId, thunkAPI) => {
    try {
      const response = await api.get(`/projects/${projectId}/progress`);
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch progress';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Link task to milestone
export const linkTaskToMilestone = createAsyncThunk(
  'milestones/linkTask',
  async ({ milestoneId, taskId }, thunkAPI) => {
    try {
      const response = await api.post(`/milestones/${milestoneId}/tasks/${taskId}`);
      return response.data.data.milestone;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to link task';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Reorder milestones
export const reorderMilestones = createAsyncThunk(
  'milestones/reorder',
  async ({ projectId, milestones }, thunkAPI) => {
    try {
      await api.put(`/projects/${projectId}/milestones/reorder`, { milestones });
      return milestones;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to reorder milestones';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const milestoneSlice = createSlice({
  name: 'milestones',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearCurrentMilestone: (state) => {
      state.currentMilestone = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create milestone
      .addCase(createMilestone.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createMilestone.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.milestones.push(action.payload);
        state.message = 'Milestone created successfully';
      })
      .addCase(createMilestone.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get project milestones
      .addCase(getProjectMilestones.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProjectMilestones.fulfilled, (state, action) => {
        state.isLoading = false;
        state.milestones = action.payload;
      })
      .addCase(getProjectMilestones.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get single milestone
      .addCase(getMilestone.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMilestone.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentMilestone = action.payload;
      })
      .addCase(getMilestone.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update milestone
      .addCase(updateMilestone.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.currentMilestone = action.payload;
        const index = state.milestones.findIndex((m) => m._id === action.payload._id);
        if (index !== -1) {
          state.milestones[index] = action.payload;
        }
        state.message = 'Milestone updated successfully';
      })
      // Delete milestone
      .addCase(deleteMilestone.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.milestones = state.milestones.filter((m) => m._id !== action.payload);
        state.message = 'Milestone deleted successfully';
      })
      // Get project progress
      .addCase(getProjectProgress.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProjectProgress.fulfilled, (state, action) => {
        state.isLoading = false;
        state.progress = action.payload;
      })
      .addCase(getProjectProgress.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Link task
      .addCase(linkTaskToMilestone.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.currentMilestone = action.payload;
        state.message = 'Task linked to milestone';
      });
  },
});

export const { reset, clearCurrentMilestone } = milestoneSlice.actions;
export default milestoneSlice.reducer;