import axios from 'axios'
import { useAuthStore } from '@/store/auth'
import type {
  Portfolio,
  DashboardResponse,
  Folder,
  TickerSearchResult,
  TickerQuote,
  AssetOverview,
  AssetItem,
  AssetLot,
  AssetNote,
  AssetDocument,
  AutopilotRule,
} from '@/types/api'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/v1/auth/refresh-token', {
            refresh_token: refreshToken,
          })
          const newToken = data.data.access_token
          useAuthStore.getState().setAccessToken(newToken)
          original.headers.Authorization = `Bearer ${newToken}`
          return api(original)
        } catch {
          useAuthStore.getState().clearAuth()
        }
      }
    }
    return Promise.reject(error)
  },
)

export const authApi = {
  sendCode: (email: string) => api.post('/auth/send-code', { email }),
  verifyCode: (email: string, code: string) =>
    api.post('/auth/verify-code', { email, code }),
}

export const userApi = {
  getMe: () => api.get('/users/me'),
  onboard: (data: {
    first_name: string
    last_name: string
    phone_number: string
    phone_country_code: string
  }) => api.patch('/users/me/onboard', data),
}

export const portfolioApi = {
  create: (data: {
    name: string
    base_currency: string
    description?: string
    image_url?: string | null
  }) => api.post('/portfolios', data),
  list: () => api.get<{ data: { items: Portfolio[]; page: unknown } }>('/portfolios'),
  update: (
    id: string,
    data: { name?: string; description?: string; base_currency?: string; image_url?: string | null },
  ) => api.patch<{ data: Portfolio }>(`/portfolios/${id}`, data),
}

export const dashboardApi = {
  get: (portfolioId: string, period: string) =>
    api.get<{ data: DashboardResponse }>(`/portfolios/${portfolioId}/dashboard`, {
      params: { period },
    }),
}

export interface Currency {
  code: string   // "USD"
  name: string   // "US Dollar"
  symbol: string // "$"
}

export const currencyApi = {
  list: () => api.get<{ data: Currency[] }>('/currencies'),
}

export const folderApi = {
  list: (portfolioId: string, type: 'asset' | 'debt') =>
    api.get<{ data: Folder[] }>(`/portfolios/${portfolioId}/folders`, { params: { type } }),
  create: (
    portfolioId: string,
    data: { name: string; folder_type: 'asset' | 'debt'; icon?: string | null; image_url?: string | null },
  ) => api.post<{ data: Folder }>(`/portfolios/${portfolioId}/folders`, data),
  update: (portfolioId: string, folderId: string, data: { name?: string; icon?: string | null }) =>
    api.patch<{ data: Folder }>(`/portfolios/${portfolioId}/folders/${folderId}`, data),
  remove: (portfolioId: string, folderId: string) =>
    api.delete(`/portfolios/${portfolioId}/folders/${folderId}`),
  reorder: (portfolioId: string, folders: Array<{ id: string; position: number }>) =>
    api.put(`/portfolios/${portfolioId}/folders/reorder`, { folders }),
}

export const uploadApi = {
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ data: { url: string; key: string; size: number; content_type: string } }>(
      '/upload',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },
}

export const assetApi = {
  overview: (portfolioId: string) =>
    api.get<{ data: AssetOverview }>(`/portfolios/${portfolioId}/assets/overview`),
  list: (portfolioId: string, folderId?: string) =>
    api.get<{ data: AssetItem[] }>(`/portfolios/${portfolioId}/assets`, {
      params: folderId ? { folder_id: folderId } : undefined,
    }),
  searchTicker: (portfolioId: string, q: string, type: 'stock' | 'crypto' = 'stock') =>
    api.get<{ data: TickerSearchResult[] }>(
      `/portfolios/${portfolioId}/assets/ticker/search`,
      { params: { q, type } },
    ),
  previewTicker: (portfolioId: string, ticker: string) =>
    api.get<{ data: TickerQuote }>(
      `/portfolios/${portfolioId}/assets/ticker/preview`,
      { params: { ticker } },
    ),
  create: (
    portfolioId: string,
    data: {
      folder_id: string
      asset_type: string
      ticker?: string
      name?: string
      image_url?: string
      ownership_pct?: number
      current_price?: number
      currency?: string
      lots: Array<{ quantity: number; acquisition_date: string; notes?: string }>
    },
  ) => api.post<{ data: AssetItem }>(`/portfolios/${portfolioId}/assets`, data),

  update: (portfolioId: string, assetId: string, data: { ownership_pct?: number; investability?: string; folder_id?: string }) =>
    api.patch<{ data: AssetItem }>(`/portfolios/${portfolioId}/assets/${assetId}`, data),
  delete: (portfolioId: string, assetId: string) =>
    api.delete(`/portfolios/${portfolioId}/assets/${assetId}`),

  listLots: (portfolioId: string, assetId: string) =>
    api.get<{ data: AssetLot[] }>(`/portfolios/${portfolioId}/assets/${assetId}/lots`),

  listNotes: (portfolioId: string, assetId: string) =>
    api.get<{ data: AssetNote[] }>(`/portfolios/${portfolioId}/assets/${assetId}/notes`),
  addNote: (portfolioId: string, assetId: string, data: { title?: string; content: string; tags?: string[] }) =>
    api.post<{ data: AssetNote }>(`/portfolios/${portfolioId}/assets/${assetId}/notes`, {
      ...data,
      tags: data.tags?.length ? { items: data.tags } : undefined,
    }),
  updateNote: (portfolioId: string, assetId: string, noteId: string, data: { title?: string; content?: string; tags?: string[] }) =>
    api.patch<{ data: AssetNote }>(`/portfolios/${portfolioId}/assets/${assetId}/notes/${noteId}`, {
      ...data,
      tags: data.tags !== undefined ? (data.tags.length ? { items: data.tags } : {}) : undefined,
    }),
  deleteNote: (portfolioId: string, assetId: string, noteId: string) =>
    api.delete(`/portfolios/${portfolioId}/assets/${assetId}/notes/${noteId}`),

  listDocuments: (portfolioId: string, assetId: string) =>
    api.get<{ data: AssetDocument[] }>(`/portfolios/${portfolioId}/assets/${assetId}/documents`),
  uploadDocument: (portfolioId: string, assetId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ data: AssetDocument }>(
      `/portfolios/${portfolioId}/assets/${assetId}/documents`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
  },
  documentDownloadUrl: (portfolioId: string, assetId: string, docId: string) =>
    api.get<{ data: { url: string; expires_in: number } }>(
      `/portfolios/${portfolioId}/assets/${assetId}/documents/${docId}/download-url`,
    ),
  deleteDocument: (portfolioId: string, assetId: string, docId: string) =>
    api.delete(`/portfolios/${portfolioId}/assets/${assetId}/documents/${docId}`),
}

export const autopilotApi = {
  listRules: (portfolioId: string) =>
    api.get<{ data: AutopilotRule[] }>(`/portfolios/${portfolioId}/autopilot/rules`),
  createRule: (portfolioId: string, data: {
    target_id: string
    target_type: 'asset' | 'debt'
    action: 'add' | 'remove'
    amount?: number
    units?: number
    percentage?: number
    frequency: string
    start_date: string
    end_date?: string
  }) => api.post<{ data: AutopilotRule }>(`/portfolios/${portfolioId}/autopilot/rules`, data),
  pauseRule: (portfolioId: string, ruleId: string) =>
    api.post(`/portfolios/${portfolioId}/autopilot/rules/${ruleId}/pause`),
  resumeRule: (portfolioId: string, ruleId: string) =>
    api.post(`/portfolios/${portfolioId}/autopilot/rules/${ruleId}/resume`),
  deleteRule: (portfolioId: string, ruleId: string) =>
    api.delete(`/portfolios/${portfolioId}/autopilot/rules/${ruleId}`),
}
