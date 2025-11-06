import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  files: [],
  currentFile: null,
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
  pagination: {
    totalPages: 0,
    currentPage: 1,
    totalFiles: 0,
  },
  uploadProgress: 0,
};

// Upload file
export const uploadFile = createAsyncThunk(
  'files/upload',
  async ({ projectId, formData, onProgress }, thunkAPI) => {
    try {
      const response = await api.post(`/projects/${projectId}/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          if (onProgress) {
            onProgress(percentCompleted);
          }
        },
      });
      return response.data.data.file;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to upload file';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get project files
export const getProjectFiles = createAsyncThunk(
  'files/getProjectFiles',
  async ({ projectId, filters = {} }, thunkAPI) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/projects/${projectId}/files?${params}`);
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch files';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single file
export const getFile = createAsyncThunk(
  'files/getOne',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/files/${id}`);
      return response.data.data.file;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch file';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update file
export const updateFile = createAsyncThunk(
  'files/update',
  async ({ id, fileData }, thunkAPI) => {
    try {
      const response = await api.put(`/files/${id}`, fileData);
      return response.data.data.file;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to update file';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete file
export const deleteFile = createAsyncThunk(
  'files/delete',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/files/${id}`);
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to delete file';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Submit as deliverable
export const submitDeliverable = createAsyncThunk(
  'files/submit',
  async (id, thunkAPI) => {
    try {
      const response = await api.post(`/files/${id}/submit`);
      return response.data.data.file;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to submit deliverable';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Review deliverable
export const reviewDeliverable = createAsyncThunk(
  'files/review',
  async ({ id, status, comments }, thunkAPI) => {
    try {
      const response = await api.put(`/files/${id}/review`, { status, comments });
      return response.data.data.file;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to review deliverable';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Upload new version
export const uploadNewVersion = createAsyncThunk(
  'files/uploadVersion',
  async ({ id, formData, onProgress }, thunkAPI) => {
    try {
      const response = await api.post(`/files/${id}/version`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          if (onProgress) {
            onProgress(percentCompleted);
          }
        },
      });
      return response.data.data.file;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to upload new version';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Download file
export const downloadFile = createAsyncThunk(
  'files/download',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/files/${id}/download`);
      return response.data.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to download file';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.message = '';
      state.uploadProgress = 0;
    },
    clearCurrentFile: (state) => {
      state.currentFile = null;
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Upload file
      .addCase(uploadFile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(uploadFile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.files.unshift(action.payload);
        state.message = 'File uploaded successfully';
        state.uploadProgress = 0;
      })
      .addCase(uploadFile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.uploadProgress = 0;
      })
      // Get project files
      .addCase(getProjectFiles.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProjectFiles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.files = action.payload.files;
        state.pagination = {
          totalPages: action.payload.totalPages,
          currentPage: action.payload.currentPage,
          totalFiles: action.payload.totalFiles,
        };
      })
      .addCase(getProjectFiles.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get single file
      .addCase(getFile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getFile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentFile = action.payload;
      })
      .addCase(getFile.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Update file
      .addCase(updateFile.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.currentFile = action.payload;
        const index = state.files.findIndex((f) => f._id === action.payload._id);
        if (index !== -1) {
          state.files[index] = action.payload;
        }
        state.message = 'File updated successfully';
      })
      // Delete file
      .addCase(deleteFile.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.files = state.files.filter((f) => f._id !== action.payload);
        state.message = 'File deleted successfully';
      })
      // Submit deliverable
      .addCase(submitDeliverable.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.currentFile = action.payload;
        const index = state.files.findIndex((f) => f._id === action.payload._id);
        if (index !== -1) {
          state.files[index] = action.payload;
        }
        state.message = 'Deliverable submitted successfully';
      })
      // Review deliverable
      .addCase(reviewDeliverable.fulfilled, (state, action) => {
        state.isSuccess = true;
        state.currentFile = action.payload;
        const index = state.files.findIndex((f) => f._id === action.payload._id);
        if (index !== -1) {
          state.files[index] = action.payload;
        }
        state.message = 'Deliverable reviewed successfully';
      })
      // Upload new version
      .addCase(uploadNewVersion.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(uploadNewVersion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.files.unshift(action.payload);
        state.message = 'New version uploaded successfully';
        state.uploadProgress = 0;
      })
      .addCase(uploadNewVersion.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
        state.uploadProgress = 0;
      });
  },
});

export const { reset, clearCurrentFile, setUploadProgress } = fileSlice.actions;
export default fileSlice.reducer;