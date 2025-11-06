import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  projects: [],
  myProjects: [],
  currentProject: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
  pagination: {
    totalPages: 0,
    currentPage: 1,
    totalProjects: 0,
  },
};

// Create project
export const createProject = createAsyncThunk(
  'projects/create',
  async (projectData, thunkAPI) => {
    try {
      const response = await api.post('/projects', projectData);
      return response.data.data.project;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to create project';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get all projects (with filters)
export const getAllProjects = createAsyncThunk(
  'projects/getAll',
  async (filters, thunkAPI) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/projects?${params}`);
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch projects';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single project
export const getProject = createAsyncThunk(
  'projects/getOne',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/projects/${id}`);
      return response.data.data.project;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch project';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get my projects
export const getMyProjects = createAsyncThunk(
  'projects/getMy',
  async (filters = {}, thunkAPI) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/projects/user/my-projects?${params}`);
      return response.data.data.projects;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch your projects';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update project
export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ id, projectData }, thunkAPI) => {
    try {
      const response = await api.put(`/projects/${id}`, projectData);
      return response.data.data.project;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to update project';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete project
export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/projects/${id}`);
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to delete project';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Apply to project
export const applyToProject = createAsyncThunk(
  'projects/apply',
  async ({ id, message }, thunkAPI) => {
    try {
      const response = await api.post(`/projects/${id}/apply`, { message });
      return response.data;
    } catch (error) {
      const msg =
        error.response?.data?.message || error.message || 'Failed to apply';
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// Handle application (accept/reject)
export const handleApplication = createAsyncThunk(
  'projects/handleApplication',
  async ({ projectId, applicantId, status }, thunkAPI) => {
    try {
      const response = await api.put(
        `/projects/${projectId}/applicants/${applicantId}`,
        { status }
      );
      return response.data.data.project;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to handle application';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Remove member
export const removeMember = createAsyncThunk(
  'projects/removeMember',
  async ({ projectId, memberId }, thunkAPI) => {
    try {
      const response = await api.delete(`/projects/${projectId}/members/${memberId}`);
      return response.data.data.project;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to remove member';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
    },
    clearCurrentProject: (state) => {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create project
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.projects.unshift(action.payload);
        state.myProjects.unshift(action.payload);
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get all projects
      .addCase(getAllProjects.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.projects;
        state.pagination = {
          totalPages: action.payload.totalPages,
          currentPage: action.payload.currentPage,
          totalProjects: action.payload.totalProjects,
        };
      })
      .addCase(getAllProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get single project
      .addCase(getProject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentProject = action.payload;
      })
      .addCase(getProject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get my projects
      .addCase(getMyProjects.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getMyProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myProjects = action.payload;
      })
      .addCase(getMyProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update project
      .addCase(updateProject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.currentProject = action.payload;
        // Update in lists
        state.projects = state.projects.map((p) =>
          p._id === action.payload._id ? action.payload : p
        );
        state.myProjects = state.myProjects.map((p) =>
          p._id === action.payload._id ? action.payload : p
        );
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Delete project
      .addCase(deleteProject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.projects = state.projects.filter((p) => p._id !== action.payload);
        state.myProjects = state.myProjects.filter((p) => p._id !== action.payload);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Apply to project
      .addCase(applyToProject.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(applyToProject.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.message = 'Application submitted successfully';
      })
      .addCase(applyToProject.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Handle application
      .addCase(handleApplication.fulfilled, (state, action) => {
        state.currentProject = action.payload;
      })
      // Remove member
      .addCase(removeMember.fulfilled, (state, action) => {
        state.currentProject = action.payload;
      });
  },
});

export const { reset, clearCurrentProject } = projectSlice.actions;
export default projectSlice.reducer;