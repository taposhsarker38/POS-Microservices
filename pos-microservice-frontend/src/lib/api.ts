import axios, { AxiosHeaders } from 'axios'
import store from '../store'
import { setAccessToken, clearAuth } from '../store/authSlice'

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8001'
const api = axios.create({ timeout: 15000 })

// attach access token from redux
api.interceptors.request.use((cfg) => {
  const token = store.getState().auth.accessToken

  const headers = new AxiosHeaders(cfg.headers as any)

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  headers.set('Content-Type', 'application/json')

  cfg.headers = headers // typed as AxiosRequestHeaders
  return cfg
})


let isRefreshing = false
let queue: ((token: string | null) => void)[] = []

function processQueue(newToken: string | null) {
  queue.forEach(cb => cb(newToken))
  queue = []
}

api.interceptors.response.use(
  res => res,
  async err => {
    const orig = err.config
    if (err.response?.status === 401 && !orig._retry) {
      orig._retry = true
      try {
        if (!isRefreshing) {
          isRefreshing = true
          const r = await axios.post(`${AUTH_BASE}/api/v1/token/refresh/`, {}, { withCredentials: true })
          const newAccess = r.data.access
          store.dispatch(setAccessToken(newAccess))
          processQueue(newAccess)
          isRefreshing = false
          orig.headers['Authorization'] = `Bearer ${newAccess}`
          return api(orig)
        } else {
          return new Promise((resolve, reject) => {
            queue.push((token) => {
              if (token) {
                orig.headers['Authorization'] = `Bearer ${token}`
                resolve(api(orig))
              } else {
                reject(err)
              }
            })
          })
        }
      } catch (e) {
        isRefreshing = false
        processQueue(null)
        store.dispatch(clearAuth())
        return Promise.reject(e)
      }
    }
    return Promise.reject(err)
  }
)

export default api
