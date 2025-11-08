import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  tasks: [],
  groupedTasks: {
    todo: [],
    in_progress: [],
    review: [],
    done: [],
  },
  currentTask: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Create task
export const createTask = createAsyncThunk(
  'tasks/create',
  async ({ projectId, taskData }, thunkAPI) => {
    try {
      const response = await api.post(
        `/projects/${projectId}/tasks`, 
        taskData,
        { timeout: 10000 } // 10 second timeout
      );
      return response.data.data.task;
    } catch (error) {
      // Proper error handling
      const message = error.response?.data?.message 
        || error.message 
        || 'Failed to create task';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get project tasks
export const getProjectTasks = createAsyncThunk(
  'tasks/getProjectTasks',
  async (projectId, thunkAPI) => {
    try {
      const response = await api.get(`/projects/${projectId}/tasks`);
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch tasks';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single task
export const getTask = createAsyncThunk(
  'tasks/getOne',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data.data.task;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch task';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update task
export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ id, taskData }, thunkAPI) => {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      return response.data.data.task;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to update task';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete task
export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/tasks/${id}`);
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to delete task';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Add subtask
export const addSubtask = createAsyncThunk(
  'tasks/addSubtask',
  async ({ taskId, title }, thunkAPI) => {
    try {
      const response = await api.post(`/tasks/${taskId}/subtasks`, { title });
      return response.data.data.task;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to add subtask';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Toggle subtask
export const toggleSubtask = createAsyncThunk(
  'tasks/toggleSubtask',
  async ({ taskId, subtaskId }, thunkAPI) => {
    try {
      const response = await api.put(`/tasks/${taskId}/subtasks/${subtaskId}`);
      return response.data.data.task;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to update subtask';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete subtask
export const deleteSubtask = createAsyncThunk(
  'tasks/deleteSubtask',
  async ({ taskId, subtaskId }, thunkAPI) => {
    try {
      const response = await api.delete(`/tasks/${taskId}/subtasks/${subtaskId}`);
      return response.data.data.task;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to delete subtask';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Reorder tasks (for drag and drop)
export const reorderTasks = createAsyncThunk(
  'tasks/reorder',
  async ({ projectId, tasks }, thunkAPI) => {
    try {
      await api.put(`/projects/${projectId}/tasks/reorder`, { tasks });
      return tasks;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to reorder tasks';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearCurrentTask: (state) => {
      state.currentTask = null;
    },
    // Optimistic update for drag and drop
    updateTasksOptimistically: (state, action) => {
      state.groupedTasks = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create task
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.tasks.push(action.payload);
        // Add to appropriate column
        const status = action.payload.status;
        state.groupedTasks[status].push(action.payload);
        state.message = 'Task created successfully';
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get project tasks
      .addCase(getProjectTasks.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProjectTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.tasks;
        state.groupedTasks = action.payload.groupedTasks;
      })
      .addCase(getProjectTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get single task
      .addCase(getTask.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTask.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTask = action.payload;
      })
      .addCase(getTask.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update task
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.currentTask = action.payload;
        // Update in tasks array
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
        state.message = 'Task updated successfully';
      })
      // Delete task
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
        // Remove from grouped tasks
        Object.keys(state.groupedTasks).forEach((status) => {
          state.groupedTasks[status] = state.groupedTasks[status].filter(
            (t) => t._id !== action.payload
          );
        });
        state.message = 'Task deleted successfully';
      })
      // Add/Toggle/Delete subtask
      .addCase(addSubtask.fulfilled, (state, action) => {
        state.currentTask = action.payload;
        state.message = 'Subtask added successfully';
      })
      .addCase(toggleSubtask.fulfilled, (state, action) => {
        state.currentTask = action.payload;
      })
      .addCase(deleteSubtask.fulfilled, (state, action) => {
        state.currentTask = action.payload;
        state.message = 'Subtask deleted successfully';
      });
  },
});

export const { reset, clearCurrentTask, updateTasksOptimistically } = taskSlice.actions;
export default taskSlice.reducer;