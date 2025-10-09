
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
type User = { id?: string; username?:string; email?:string; role?:any; permissions?:string[]; is_superuser?:boolean } | null
type State = { accessToken: string | null; user: User }
const initial: State = { accessToken: null, user: null }
const slice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    setAccessToken(state, action: PayloadAction<string>) { state.accessToken = action.payload },
    setUser(state, action: PayloadAction<User>) { state.user = action.payload },
    clearAuth(state) { state.accessToken = null; state.user = null }
  }
})
export const { setAccessToken, setUser, clearAuth } = slice.actions
export default slice.reducer
