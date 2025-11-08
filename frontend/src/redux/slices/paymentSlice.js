// frontend/src/redux/slices/paymentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  payments: [],
  earnings: [],
  isLoading: false,
  isSuccess: false,
  isError: false,
  message: '',
};

// Create payment
export const createPayment = createAsyncThunk(
  'payments/create',
  async (paymentData, thunkAPI) => {
    try {
      const response = await api.post('/payments/create', paymentData);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to create payment';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get project payments
export const getProjectPayments = createAsyncThunk(
  'payments/getProject',
  async (projectId, thunkAPI) => {
    try {
      const response = await api.get(`/payments/project/${projectId}`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to fetch payments';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Hold payment in escrow
export const holdInEscrow = createAsyncThunk(
  'payments/holdEscrow',
  async ({ paymentId, escrowDays }, thunkAPI) => {
    try {
      const response = await api.post(`/payments/${paymentId}/escrow`, { escrowDays });
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to hold payment in escrow';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Release payment
export const releasePayment = createAsyncThunk(
  'payments/release',
  async (paymentId, thunkAPI) => {
    try {
      const response = await api.post(`/payments/${paymentId}/release`);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || error.message || 'Failed to release payment';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const paymentSlice = createSlice({
  name: 'payments',
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
      // Create payment
      .addCase(createPayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createPayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments.unshift(action.payload.data.payment);
        state.message = 'Payment created successfully';
      })
      .addCase(createPayment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Get project payments
      .addCase(getProjectPayments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProjectPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.payments = action.payload.data.payments;
        state.earnings = action.payload.data.earnings;
      })
      .addCase(getProjectPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Hold in escrow
      .addCase(holdInEscrow.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(holdInEscrow.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.payments.findIndex(
          (p) => p._id === action.payload.data.payment._id
        );
        if (index !== -1) {
          state.payments[index] = action.payload.data.payment;
        }
        state.message = 'Payment held in escrow';
      })
      .addCase(holdInEscrow.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      // Release payment
      .addCase(releasePayment.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(releasePayment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const index = state.payments.findIndex(
          (p) => p._id === action.payload.data.payment._id
        );
        if (index !== -1) {
          state.payments[index] = action.payload.data.payment;
        }
        state.message = 'Payment released successfully';
      })
      .addCase(releasePayment.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { reset } = paymentSlice.actions;
export default paymentSlice.reducer;