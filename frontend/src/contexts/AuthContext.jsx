
import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken')
    const userData = localStorage.getItem('currentUser')

    if (token && userData) {
      try {
        setUser(JSON.parse(userData))
        await api.me()
      } catch (err) {
        console.log('Token expired, logging out')
        logout()
      }
    }
    setLoading(false)
  }

  const login = async (username, password) => {
    try {
      setError(null)
      const response = await api.login({ username, password })
      
      if (response.data.access_token) {
        const userData = response.data.user
        setUser(userData)
        localStorage.setItem('accessToken', response.data.access_token)
        localStorage.setItem('refreshToken', response.data.refresh_token || '')
        localStorage.setItem('currentUser', JSON.stringify(userData))
        return { success: true, user: userData }
      }
      return { success: false, error: 'Login failed' }
    } catch (err) {
      const errorMessage = err.detail || err.message || 'Login failed'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('currentUser')
  }

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor',
    isNurse: user?.role === 'nurse',
    isFamily: user?.role === 'family',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}


