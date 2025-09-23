import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type State = { accessToken: string | null, user: any | null }
const initial: State = { accessToken: null, user: null }

const slice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    setAccessToken(state, action: PayloadAction<string>) { state.accessToken = action.payload },
    setUser(state, action: PayloadAction<any>) { state.user = action.payload },
    clearAuth(state) { state.accessToken = null; state.user = null }
  }
})

export const { setAccessToken, setUser, clearAuth } = slice.actions
export default slice.reducer
