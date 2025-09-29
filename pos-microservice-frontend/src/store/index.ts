import { configureStore } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import authReducer from './slices/authSlice'
import navReducer from './slices/navSlice'
import prefsReducer from './slices/prefsSlice'
const store = configureStore({ reducer: { 
    nav: navReducer, 
    prefs: prefsReducer, 
    auth: authReducer 
    },
    devTools: true,
})
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()
export default store
