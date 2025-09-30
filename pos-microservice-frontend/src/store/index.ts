import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/slice';
import { authApi } from '@/features/auth/api';
import { usersApi } from '@/features/users/api';
import { settingsApi } from '@/features/settings/api';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
      [usersApi.reducerPath]: usersApi.reducer,
      [settingsApi.reducerPath]: settingsApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        authApi.middleware,
        usersApi.middleware,
        settingsApi.middleware
      ),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
