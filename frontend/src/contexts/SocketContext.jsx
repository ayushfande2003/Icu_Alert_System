import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

// Suppress console noise - track what we've already logged
const loggedMessages = new Set()

function logOnce(key, message, level = 'info') {
  if (loggedMessages.has(key)) return
  loggedMessages.add(key)
  
  const prefix = '[SocketContext]'
  switch (level) {
    case 'warn':
      console.warn(prefix, message)
      break
    case 'error':
      console.error(prefix, message)
      break
    default:
      console.log(prefix, message)
  }
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [connectionError, setConnectionError] = useState(null)
  const [lastFrame, setLastFrame] = useState(null)
  const [alerts, setAlerts] = useState([])
  const { user } = useAuth()
  const reconnectAttempts = useRef(0)
  const isDevelopment = import.meta.env?.DEV || false
  const isInitialized = useRef(false)
  const skipConnection = useRef(false)

  useEffect(() => {
    // Don't connect if no user or already initialized
    if (!user || isInitialized.current) return

    // Skip socket connection if explicitly disabled
    if (skipConnection.current) return

    isInitialized.current = true
    setConnectionError(null)
    reconnectAttempts.current = 0

    const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8000'

    // Only show connection attempt message once
    if (isDevelopment) {
      logOnce('init', `Initializing socket connection to ${wsUrl}`, 'info')
    }

    // Create socket instance with polling transport to avoid WebSocket errors
    // Polling is more reliable when backend isn't running
    const socketInstance = io(wsUrl, {
      path: '/socket.io',
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 5000,
      // Reduce noise from socket.io-client
      autoConnect: true,
    })

    // Connected successfully
    socketInstance.on('connect', () => {
      logOnce('connected', 'Connected to real-time server', 'info')
      setConnected(true)
      setConnectionError(null)
      reconnectAttempts.current = 0
      loggedMessages.clear()
    })

    // Disconnected
    socketInstance.on('disconnect', (reason) => {
      setConnected(false)

      if (reason === 'io server disconnect') {
        socketInstance.connect()
      }
    })

    // Connection errors are expected when backend is down
    socketInstance.on('connect_error', (error) => {
      reconnectAttempts.current += 1

      if (reconnectAttempts.current >= 3) {
        skipConnection.current = true
        setConnectionError('Real-time server unavailable. Features will be limited.')
        socketInstance.disconnect()
      }
    })

    // Reconnection events
    socketInstance.on('reconnect_attempt', () => {
      // Silent
    })

    socketInstance.on('reconnect', () => {
      logOnce('reconnected', 'Reconnected to real-time server', 'info')
      setConnected(true)
      setConnectionError(null)
      skipConnection.current = false
      loggedMessages.clear()
    })

    socketInstance.on('reconnect_failed', () => {
      skipConnection.current = true
      setConnectionError('Unable to connect to real-time server.')
    })

    // Video frame events
    socketInstance.on('video_frame', (data) => {
      setLastFrame({
        frame: data.frame,
        count: data.count,
        timestamp: data.timestamp,
        emotion: data.emotion
      })
    })

    socketInstance.on('camera_started', (data) => {
      if (isDevelopment) {
        logOnce('camera', data.message, 'info')
      }
    })

    socketInstance.on('camera_error', (data) => {
      if (isDevelopment) {
        logOnce('camera_error', data.message, 'error')
      }
    })

    // Alert events
    socketInstance.on('new_alert', (data) => {
      const alert = {
        id: Date.now(),
        message: data.alert,
        timestamp: data.timestamp || new Date().toISOString(),
        type: getAlertType(data.alert)
      }
      setAlerts(prev => [alert, ...prev].slice(0, 50))
    })

    socketInstance.on('emotion_update', () => {
      // Handle if needed
    })

    setSocket(socketInstance)

    // Cleanup on unmount or user change
    return () => {
      isInitialized.current = false
      skipConnection.current = false
      try {
        socketInstance.disconnect()
      } catch {
        // Ignore cleanup errors
      }
    }
  }, [user])

  const getAlertType = (message) => {
    if (message.includes('Critical') || message.includes('Emergency')) return 'danger'
    if (message.includes('Warning') || message.includes('Pain')) return 'warning'
    if (message.includes(' blink') || message.includes('movement')) return 'info'
    return 'info'
  }

  const emit = useCallback((event, data) => {
    if (socket && connected) {
      socket.emit(event, data)
    }
  }, [socket, connected])

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id))
  }, [])

  const value = {
    socket,
    connected,
    connectionError,
    lastFrame,
    alerts,
    emit,
    clearAlerts,
    removeAlert,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

