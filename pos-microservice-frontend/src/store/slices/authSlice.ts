// // src/store/authSlice.ts
// import { createSlice, PayloadAction } from '@reduxjs/toolkit'
// type User = { id?: string; username?:string; email?:string; role?:any; permissions?:string[]; is_superuser?:boolean } | null
// type State = { accessToken: string | null; user: User }
// const initial: State = { accessToken: null, user: null }
// const slice = createSlice({
//   name: 'auth',
//   initialState: initial,
//   reducers: {
//     setAccessToken(state, action: PayloadAction<string>) { state.accessToken = action.payload },
//     setUser(state, action: PayloadAction<User>) { state.user = action.payload },
//     clearAuth(state) { state.accessToken = null; state.user = null }
//   }
// })
// export const { setAccessToken, setUser, clearAuth } = slice.actions
// export default slice.reducer

// src/store/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

type User = {
  id?: string
  username?: string
  email?: string
  role?: any
  permissions?: string[]
  is_superuser?: boolean
} | null

type State = {
  accessToken: string | null
  user: User
  loading: boolean
  error?: string | null
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '' // set in .env.local

const initial: State = { accessToken: null, user: null, loading: false, error: null }

/**
 * Fetch current user (/me/)
 */
export const fetchMe = createAsyncThunk<User | null, void, { rejectValue: string }>(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/me/`, {
        credentials: 'include',
        headers: { Accept: 'application/json' }
      })
      if (res.status === 200) {
        return (await res.json()) as User
      }
      // if 401 or 403 treat as not authenticated
      return null
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Network error')
    }
  }
)

/**
 * Login: calls /token/ (backend expected to set httpOnly cookie)
 * If backend returns access token in body, you may capture it.
 */
export const login = createAsyncThunk<User | null, { username: string; password: string }, { rejectValue: string }>(
  'auth/login',
  async (payload, { dispatch, rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/token/`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => null)
        return rejectWithValue(txt || `Login failed (${res.status})`)
      }

      // If backend returns user in response, use it. Otherwise call /me/
      try {
        const body = await res.json().catch(() => null)
        if (body && body.user) {
          // optional: if server returns access token in body, set it
          // dispatch(setAccessToken(body.access || null))
          return body.user as User
        }
      } catch (e) { /* ignore */ }

      // fallback: fetch /me/
      const me = await dispatch(fetchMe()).unwrap().catch(() => null)
      return me ?? null
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Network error')
    }
  }
)

/**
 * Refresh tokens
 */
export const refreshToken = createAsyncThunk<User | null, void, { rejectValue: string }>(
  'auth/refreshToken',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/token/refresh/`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) return rejectWithValue('Refresh failed')
      const me = await dispatch(fetchMe()).unwrap().catch(() => null)
      return me ?? null
    } catch (e: any) {
      return rejectWithValue(e?.message || 'Network error')
    }
  }
)

/**
 * Logout
 */
export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await fetch(`${API_BASE}/logout/`, {
        method: 'POST',
        credentials: 'include',
      })
      // clear client state done by reducer
    } catch (e: any) {
      // ignore network error but still clear client
    }
  }
)

const slice = createSlice({
  name: 'auth',
  initialState: initial,
  reducers: {
    setAccessToken(state, action: PayloadAction<string | null>) { state.accessToken = action.payload },
    setUser(state, action: PayloadAction<User>) { state.user = action.payload },
    clearAuth(state) { state.accessToken = null; state.user = null; state.error = null }
  },
  extraReducers: (builder) => {
    // fetchMe
    builder.addCase(fetchMe.pending, (s) => { s.loading = true; s.error = null })
    builder.addCase(fetchMe.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; s.error = null })
    builder.addCase(fetchMe.rejected, (s, a) => { s.loading = false; s.user = null; s.error = a.payload || a.error?.message })

    // login
    builder.addCase(login.pending, (s) => { s.loading = true; s.error = null })
    builder.addCase(login.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; s.error = null })
    builder.addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error?.message })

    // refresh
    builder.addCase(refreshToken.pending, (s) => { s.loading = true; s.error = null })
    builder.addCase(refreshToken.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; s.error = null })
    builder.addCase(refreshToken.rejected, (s, a) => { s.loading = false; s.error = a.payload || a.error?.message })

    // logout
    builder.addCase(logout.fulfilled, (s) => { s.accessToken = null; s.user = null; s.error = null })
  }
})

export const { setAccessToken, setUser, clearAuth } = slice.actions
export default slice.reducer
