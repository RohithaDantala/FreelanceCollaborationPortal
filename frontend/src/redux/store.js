// frontend/src/redux/store.js - UPDATED
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import projectReducer from './slices/projectSlice';
import taskReducer from './slices/taskSlice';
import fileReducer from './slices/fileSlice';
import notificationReducer from './slices/notificationSlice';
import milestoneReducer from './slices/milestoneSlice';
import timeReducer from './slices/timeSlice';
import paymentReducer from './slices/paymentSlice';
import messageReducer from './slices/messageSlice'; // ADDED

const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectReducer,
    tasks: taskReducer, 
    files: fileReducer,
    notifications: notificationReducer,
    milestones: milestoneReducer,
    time: timeReducer,
    payments: paymentReducer,
    messages: messageReducer, // ADDED
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;