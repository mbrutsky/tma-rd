// src/lib/store/slices/authSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../index';

interface AuthUser {
  id: string;
  telegramUserId?: number;
  name: string;
  username: string;
  avatar?: string;
  role: string;
  position?: string;
  email?: string;
  companyId?: string;
  isActive: boolean;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

// Async thunk для авторизации через Telegram
export const authenticateWithTelegram = createAsyncThunk(
  'auth/telegram',
  async (initData: string) => {
    const response = await fetch('/api/auth/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Authentication failed');
    }

    const data = await response.json();
    
    // Сохраняем токен в localStorage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.setItem('userId', data.user.id);
    
    return data;
  }
);

// Async thunk для проверки существующего токена
export const verifyToken = createAsyncThunk(
  'auth/verify',
  async () => {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch('/api/auth/telegram', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token validation failed');
    }

    const userData = localStorage.getItem('currentUser');
    return {
      token,
      user: userData ? JSON.parse(userData) : null
    };
  }
);

// Async thunk для выхода
export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userId');
    
    // Закрываем Telegram Web App если доступен
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      window.Telegram.WebApp.close();
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('currentUser', JSON.stringify(state.user));
      }
    },
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Authenticate with Telegram
    builder.addCase(authenticateWithTelegram.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(authenticateWithTelegram.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(authenticateWithTelegram.rejected, (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = action.error.message || 'Authentication failed';
    });

    // Verify Token
    builder.addCase(verifyToken.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(verifyToken.fulfilled, (state, action) => {
      state.loading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    });
    builder.addCase(verifyToken.rejected, (state) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
    });

    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    });
  }
});

export const { clearError, updateUser, setAuthLoading } = authSlice.actions;

// Selectors
export const selectAuth = (state: RootState) => state.auth;
export const selectCurrentUser = (state: RootState) => state.auth.user;
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectAuthToken = (state: RootState) => state.auth.token;

export default authSlice.reducer;