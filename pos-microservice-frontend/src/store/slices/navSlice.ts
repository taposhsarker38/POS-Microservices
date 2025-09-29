// store/slices/navSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

export type NavItem = { id: string; title: string; path?: string; icon?: string; children?: NavItem[] }

export const fetchNav = createAsyncThunk('nav/fetch', async () => {
  const res = await fetch('/api/company/navigation')
  if (!res.ok) throw new Error('Nav load failed')
  const data = await res.json()
  return data as NavItem[]
})

const navSlice = createSlice({
  name: 'nav',
  initialState: { items: [] as NavItem[], status: 'idle', error: null as string | null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchNav.pending, (s) => { s.status = 'loading' })
    b.addCase(fetchNav.fulfilled, (s, a) => { s.status = 'succeeded'; s.items = a.payload })
    b.addCase(fetchNav.rejected, (s, a) => { s.status = 'failed'; s.error = a.error.message || 'error' })
  }
})

export default navSlice.reducer
