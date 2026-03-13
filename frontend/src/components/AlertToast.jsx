import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, CheckCircle, AlertCircle, AlertTriangle, Info, 
  Bell, BellOff, Clock, RefreshCw, Share2, Download
} from 'lucide-react'

const ToastContext = createContext()

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      duration: 5000,
      ...toast,
    }
    setToasts((prev) => [...prev, newToast])

    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const updateToast = useCallback((id, updates) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    )
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, updateToast, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer({ toasts, onRemove }) {
  const position = 'bottom-right'

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  return (
    <div className={`fixed z-50 ${positionClasses[position]} space-y-3`}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function ToastItem({ toast, onRemove }) {
  const {
    type = 'info',
    title,
    message,
    duration = 5000,
    action,
    onAction,
    icon: Icon,
    closeable = true,
  } = toast

  const typeConfig = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    },
  }

  const config = typeConfig[type] || typeConfig.info
  const IconComponent = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`
        w-80 flex items-start gap-3 p-4 rounded-xl shadow-lg
        ${config.bgColor}
        border
      `}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${config.iconBg} flex items-center justify-center`}>
        <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold text-surface-900 dark:text-white text-sm mb-1">
            {title}
          </h4>
        )}
        {message && (
          <p className="text-sm text-surface-600 dark:text-surface-300 leading-relaxed">
            {message}
          </p>
        )}
        {action && (
          <button
            onClick={onAction}
            className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            {action}
          </button>
        )}
      </div>

      {/* Close button */}
      {closeable && (
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  )
}

// Toast notification types
export function showToast(message, type = 'info', options = {}) {
  const config = {
    success: { icon: CheckCircle, iconColor: 'text-green-500' },
    error: { icon: AlertCircle, iconColor: 'text-red-500' },
    warning: { icon: AlertTriangle, iconColor: 'text-yellow-500' },
    info: { icon: Info, iconColor: 'text-blue-500' },
  }
  return { message, type, ...config[type], ...options }
}

// Pre-built toast helpers
export const toastHelpers = {
  success: (message, title) => showToast(message, 'success', { title }),
  error: (message, title) => showToast(message, 'error', { title }),
  warning: (message, title) => showToast(message, 'warning', { title }),
  info: (message, title) => showToast(message, 'info', { title }),
}

// Alert Banner Component (for inline alerts)
export function AlertBanner({
  type = 'info',
  title,
  message,
  onDismiss,
  action,
  className = '',
}) {
  const typeConfig = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    },
  }

  const config = typeConfig[type] || typeConfig.info
  const IconComponent = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        flex items-start gap-3 p-4 rounded-xl border ${config.bg}
        ${className}
      `}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center`}>
        <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold text-surface-900 dark:text-white text-sm mb-1">
            {title}
          </h4>
        )}
        {message && (
          <p className="text-sm text-surface-600 dark:text-surface-300">
            {message}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-200/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  )
}

// Notification Bell with badge
export function NotificationBell({ count = 0, onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors ${className}`}
    >
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold"
        >
          {count > 9 ? '9+' : count}
        </motion.span>
      )}
    </button>
  )
}

