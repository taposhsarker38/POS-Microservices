// store/slices/prefsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export type Preferences = { accent?: string; dark_mode?: boolean; collapsed_sidebar?: boolean }

export const fetchPrefs = createAsyncThunk('prefs/fetch', async () => {
  const res = await fetch('/api/user/preferences')
  if (!res.ok) return null
  return (await res.json()) as Preferences | null
})

const prefsSlice = createSlice({
  name: 'prefs',
  initialState: { prefs: null as Preferences | null, status: 'idle' },
  reducers: {
    setPrefs(state, action) { state.prefs = action.payload }
  },
  extraReducers: (b) => {
    b.addCase(fetchPrefs.fulfilled, (s, a) => { s.prefs = a.payload })
  }
})

export const { setPrefs } = prefsSlice.actions
export default prefsSlice.reducer
