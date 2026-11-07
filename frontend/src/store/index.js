import { configureStore } from '@reduxjs/toolkit';
import evalReducer from './evalSlice';

export const store = configureStore({
  reducer: {
    eval: evalReducer,
  },
});
