import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, Bell, Menu, X, ChevronDown, 
  User, Settings, LogOut, HelpCircle,
  Sun, Moon, SunMoon
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useSocket } from '../contexts/SocketContext'

export default function Header({ onMenuToggle, sidebarCollapsed }) {
  const { user, logout } = useAuth()
  const { darkMode, toggleTheme } = useTheme()
  const { connected, alerts } = useSocket()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  
  const notifRef = useRef(null)
  const userRef = useRef(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
      if (userRef.current && !userRef.current.contains(event.target)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const notifications = [
    { id: 1, title: 'Critical Alert', message: 'Patient heart rate above threshold', time: '2 min ago', type: 'critical' },
    { id: 2, title: 'New Message', message: 'Dr. Smith sent a message', time: '15 min ago', type: 'info' },
    { id: 3, title: 'System Update', message: 'System backup completed', time: '1 hour ago', type: 'success' },
  ]

  const handleLogout = () => {
    logout()
  }

  const roleConfig = {
    admin: { bg: 'from-violet-600 to-indigo-600' },
    doctor: { bg: 'from-emerald-600 to-teal-600' },
    nurse: { bg: 'from-blue-600 to-cyan-600' },
    family: { bg: 'from-amber-500 to-orange-500' },
  }

  const config = roleConfig[user?.role] || roleConfig.family

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search patients, records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 lg:w-80 pl-10 pr-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-700 
                         border-0 text-surface-900 dark:text-white placeholder:text-surface-400
                         focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center px-2 py-0.5 text-xs text-surface-400 bg-surface-200 dark:bg-surface-600 rounded">
              ⌘K
            </kbd>
          </div>

          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Connection Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-100 dark:bg-surface-700">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs font-medium text-surface-600 dark:text-surface-300">
              {connected ? 'Live' : 'Offline'}
            </span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {alerts.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold"
                >
                  {alerts.length > 9 ? '9+' : alerts.length}
                </motion.span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-80 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
                >
                  <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between">
                    <h3 className="font-semibold text-surface-900 dark:text-white">Notifications</h3>
                    <span className="badge badge-info">{alerts.length} new</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="p-4 hover:bg-surface-50 dark:hover:bg-surface-700/50 cursor-pointer border-b border-surface-100 dark:border-surface-700 last:border-0"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notif.type === 'critical' ? 'bg-red-500' :
                              notif.type === 'success' ? 'bg-green-500' :
                              notif.type === 'warning' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-surface-900 dark:text-white text-sm">
                                {notif.title}
                              </p>
                              <p className="text-sm text-surface-500 dark:text-surface-400 truncate">
                                {notif.message}
                              </p>
                              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
                                {notif.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
                        <p className="text-surface-500 dark:text-surface-400">No notifications</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-surface-200 dark:border-surface-700">
                    <button className="w-full py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                      View All Notifications
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${config.bg} flex items-center justify-center text-white font-semibold shadow-md`}>
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-surface-900 dark:text-white">
                  {user?.full_name?.split(' ')[0] || user?.username}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 capitalize">
                  {user?.role}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-400 hidden sm:block" />
            </button>

            {/* User Dropdown */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-56 bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 overflow-hidden"
                >
                  <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${config.bg} flex items-center justify-center text-white font-bold text-lg`}>
                        {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-surface-900 dark:text-white">
                          {user?.full_name || user?.username}
                        </p>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          {user?.email || `${user?.role}@safesign.com`}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2">
                    <button className="dropdown-item w-full">
                      <User className="w-4 h-4" />
                      <span>My Profile</span>
                    </button>
                    <button className="dropdown-item w-full">
                      <Settings className="w-4 h-4" />
                      <span>Account Settings</span>
                    </button>
                    <button className="dropdown-item w-full">
                      <HelpCircle className="w-4 h-4" />
                      <span>Help & Support</span>
                    </button>
                  </div>

                  <div className="p-2 border-t border-surface-200 dark:border-surface-700">
                    <button
                      onClick={handleLogout}
                      className="dropdown-item w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden px-4 pb-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
              <input
                type="text"
                placeholder="Search patients, records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-surface-100 dark:bg-surface-700 
                           border-0 text-surface-900 dark:text-white placeholder:text-surface-400
                           focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => setShowSearch(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-surface-400 hover:text-surface-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

