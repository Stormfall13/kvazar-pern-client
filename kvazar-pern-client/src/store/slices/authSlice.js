// import { createSlice } from "@reduxjs/toolkit";

// const initialState = {
//     user: JSON.parse(localStorage.getItem("user")) || null,
//     token: localStorage.getItem("token") || null,
// };

// const authSlice = createSlice({
//     name: "auth",
//     initialState,
//     reducers: {
//         loginSuccess: (state, action) => {
//             state.user = action.payload.user;
//             state.token = action.payload.token;
//             localStorage.setItem("user", JSON.stringify(action.payload.user));
//             localStorage.setItem("token", action.payload.token);
//         },
//         logout: (state) => {
//             state.user = null;
//             state.token = null;
//             localStorage.removeItem("user");
//             localStorage.removeItem("token");
//         },
//     },
// });

// export const { loginSuccess, logout } = authSlice.actions;
// export default authSlice.reducer;


import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Асинхронное действие для проверки токена
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");
      
      if (!token || !userStr) {
        return { user: null, token: null };
      }
      
      // ПРОВЕРКА ТОКЕНА НА СЕРВЕРЕ (раскомментировать когда нужно)
      // const response = await fetch('https://ваш-бекенд.railway.app/api/auth/me', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // if (!response.ok) throw new Error('Invalid token');
      // const userData = await response.json();
      
      // Пока используем данные из localStorage без проверки
      const user = JSON.parse(userStr);
      
      return { user, token };
    } catch (error) {
      // Если токен невалидный - очищаем
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  user: null, // Не читаем сразу из localStorage!
  token: null,
  isLoading: true, // Ключевое добавление
  error: null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLoading = false;
      state.error = null;
      localStorage.setItem("user", JSON.stringify(action.payload.user));
      localStorage.setItem("token", action.payload.token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isLoading = false;
      state.error = null;
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(initializeAuth.rejected, (state, action) => {
        state.user = null;
        state.token = null;
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { loginSuccess, logout, clearError } = authSlice.actions;
export default authSlice.reducer;