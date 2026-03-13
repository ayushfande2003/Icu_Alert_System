import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refresh_token: refreshToken
          })

          if (response.data.access_token) {
            localStorage.setItem('accessToken', response.data.access_token)
            originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`
            return apiClient(originalRequest)
          }
        } else {
          throw new Error('No refresh token available')
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('currentUser')
        window.location.href = '/login'
        return new Promise(() => { }) // Pending promise to halt execution during redirect
      }
    }

    return Promise.reject(error.response?.data || error)
  }
)

export const api = {
  // Auth endpoints
  login: (data) => apiClient.post('/api/auth/login', data),
  logout: () => apiClient.post('/api/auth/logout'),
  refresh: (refreshToken) => apiClient.post('/api/auth/refresh', { refresh_token: refreshToken }),
  me: () => apiClient.get('/api/auth/me'),

  // Patient endpoints
  getPatient: () => apiClient.get('/api/patient'),
  getPatients: (params) => apiClient.get('/api/patients', { params }),
  createPatient: (data) => apiClient.post('/api/patients', data),
  updatePatient: (id, data) => apiClient.put(`/api/patients/${id}`, data),
  deletePatient: (id) => apiClient.delete(`/api/patients/${id}`),

  // Vitals endpoints
  getVitals: () => apiClient.get('/api/vitals'),
  getVitalsHistory: (params) => apiClient.get('/api/vitals/history', { params }),
  createVitals: (data) => apiClient.post('/api/vitals', data),

  // Alert endpoints
  getAlerts: (params) => apiClient.get('/api/alerts', { params }),
  acknowledgeAlert: (id) => apiClient.post(`/api/alerts/acknowledge/${id}`),

  // Monitoring endpoints
  getMonitoringStatus: () => apiClient.get('/api/monitoring/status'),
  startMonitoring: () => apiClient.post('/api/monitoring/start'),
  stopMonitoring: () => apiClient.post('/api/monitoring/stop'),

  // Analytics endpoints
  getPatientTrends: (params) => apiClient.get('/api/analytics/patient-trends', { params }),
  getSystemPerformance: () => apiClient.get('/api/analytics/system-performance'),
  getAnalyticsStats: () => apiClient.get('/api/analytics/stats'),

  // Admin - User Management
  getUsers: () => apiClient.get('/api/users'),
  createUser: (data) => apiClient.post('/api/users', data),
  updateUser: (id, data) => apiClient.put(`/api/users/${id}`, data),
  deleteUser: (id) => apiClient.delete(`/api/users/${id}`),

  // Admin - System Settings
  getSettings: () => apiClient.get('/api/settings'),
  updateSettings: (data) => apiClient.post('/api/settings', data),

  // Admin - Reports
  downloadReport: (params) => apiClient.get('/api/reports/download', { params }),

  // Consultations
  getConsultations: (params) => apiClient.get('/api/consultations', { params }),
  createConsultation: (data) => apiClient.post('/api/consultations', data),

  // Medical Records
  getMedicalRecords: (params) => apiClient.get('/api/medical_records', { params }),
  createMedicalRecord: (data) => apiClient.post('/api/medical_records', data),

  // Schedule / Appointments
  getAppointments: (params) => apiClient.get('/api/appointments', { params }),
  createAppointment: (data) => apiClient.post('/api/appointments', data),
  updateAppointment: (id, data) => apiClient.put(`/api/appointments/${id}`, data),
  deleteAppointment: (id) => apiClient.delete(`/api/appointments/${id}`),

  // Health check
  healthCheck: () => apiClient.get('/api/health'),
  testTelegram: () => apiClient.post('/api/telegram/test'),
  // Messages
  getMessages: () => apiClient.get('/api/messages').then(res => res.data),
  getSentMessages: () => apiClient.get('/api/messages/sent').then(res => res.data),
  sendMessage: (data) => apiClient.post('/api/messages', data).then(res => res.data),
  markMessageRead: (id) => apiClient.put(`/api/messages/${id}/read`).then(res => res.data),

  // Tasks
  getTasks: (params) => apiClient.get('/api/tasks', { params }).then(res => res.data),
  createTask: (data) => apiClient.post('/api/tasks', data).then(res => res.data),
  updateTask: (id, data) => apiClient.put(`/api/tasks/${id}`, data).then(res => res.data),
  deleteTask: (id) => apiClient.delete(`/api/tasks/${id}`),

}

export default apiClient

