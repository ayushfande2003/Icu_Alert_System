import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, Activity, Stethoscope, Heart, Home,
  Settings, LogOut, ChevronLeft, ChevronRight, Bell,
  Shield, User, ClipboardList, FileText, Video,
  Zap, Server, Database, Wifi, Camera, Cpu,
  Calendar, MessageSquare, Phone, AlertTriangle,
  Moon, Sun, HelpCircle, Menu
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useSocket } from '../contexts/SocketContext'

const roleNavItems = {
  admin: [
    { path: '/admin-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin-dashboard/patients', icon: Users, label: 'Patients' },
    { path: '/admin-dashboard/users', icon: User, label: 'Users' },
    { path: '/admin-dashboard/system', icon: Server, label: 'System' },
    { path: '/admin-dashboard/analytics', icon: Activity, label: 'Analytics' },
    { path: '/admin-dashboard/settings', icon: Settings, label: 'Settings' },
  ],
  doctor: [
    { path: '/doctor-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/doctor-dashboard/patients', icon: Users, label: 'Patients' },
    { path: '/doctor-dashboard/consultations', icon: Stethoscope, label: 'Consultations' },
    { path: '/doctor-dashboard/vitals', icon: Heart, label: 'Vitals' },
    { path: '/doctor-dashboard/records', icon: FileText, label: 'Records' },
    { path: '/doctor-dashboard/schedule', icon: Calendar, label: 'Schedule' },
  ],
  nurse: [
    { path: '/nurse-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/nurse-dashboard/patients', icon: Users, label: 'My Patients' },
    { path: '/nurse-dashboard/tasks', icon: ClipboardList, label: 'Tasks' },
    { path: '/nurse-dashboard/vitals', icon: Activity, label: 'Vitals' },
    { path: '/nurse-dashboard/alerts', icon: Bell, label: 'Alerts' },
    { path: '/nurse-dashboard/communications', icon: MessageSquare, label: 'Messages' },
  ],
  family: [
    { path: '/family-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/family-dashboard/vitals', icon: Heart, label: 'Vitals' },
    { path: '/family-dashboard/monitor', icon: Video, label: 'Live Monitor' },
    { path: '/family-dashboard/alerts', icon: AlertTriangle, label: 'Updates' },
    { path: '/family-dashboard/contact', icon: Phone, label: 'Contact Staff' },
  ],
}

const bottomNavItems = [
  { icon: HelpCircle, label: 'Help' },
  { icon: Settings, label: 'Settings' },
]

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { darkMode, toggleTheme } = useTheme()
  const { connected, alerts } = useSocket()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const navItems = roleNavItems[user?.role] || roleNavItems.family

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleConfig = {
    admin: {
      icon: Shield,
      bg: 'from-violet-600 to-indigo-600',
      gradient: 'bg-gradient-to-br from-violet-500 to-indigo-600',
      light: 'bg-violet-100 dark:bg-violet-900/30',
      text: 'text-violet-600 dark:text-violet-400'
    },
    doctor: {
      icon: Stethoscope,
      bg: 'from-emerald-600 to-teal-600',
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      light: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400'
    },
    nurse: {
      icon: Heart,
      bg: 'from-blue-600 to-cyan-600',
      gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600',
      light: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400'
    },
    family: {
      icon: Home,
      bg: 'from-amber-500 to-orange-500',
      gradient: 'bg-gradient-to-br from-amber-500 to-orange-500',
      light: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400'
    },
  }

  const config = roleConfig[user?.role] || roleConfig.family
  const RoleIcon = config.icon

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 280, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed left-0 top-0 bottom-0 bg-white/80 dark:bg-surface-900/90 backdrop-blur-xl border-r border-white/20 dark:border-white/10 
                   flex flex-col z-40 shadow-2xl`}
      >
        {/* Logo & Brand */}
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-3">
            <motion.div
              className={`w-12 h-12 rounded-xl ${config.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}
              whileHover={{ scale: 1.05, rotate: 3 }}
            >
              <RoleIcon className="w-6 h-6 text-white" />
            </motion.div>

            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex-1 min-w-0"
                >
                  <h1 className="text-xl font-bold text-surface-900 dark:text-white truncate">
                    SafeSign <span className="text-primary-600">ICU</span>
                  </h1>
                  <p className="text-xs text-surface-500 dark:text-surface-400 capitalize">
                    {user?.role || 'Family'} Portal
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-surface-700 border-2 border-surface-200 dark:border-surface-600 
                     rounded-full flex items-center justify-center text-surface-400 hover:text-surface-600 
                     dark:hover:text-surface-200 shadow-md hidden lg:flex"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
          <div className="mb-3">
            {!collapsed && (
              <p className="px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
                Main Menu
              </p>
            )}
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  sidebar-item relative ${isActive ? 'sidebar-item-active' : ''}
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="flex-1 whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {collapsed && item.path.includes('alerts') && alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </NavLink>
            ))}
          </div>

          {/* Connection Status */}
          <div className="pt-3 border-t border-surface-200 dark:border-surface-700">
            {!collapsed && (
              <p className="px-4 text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
                System
              </p>
            )}
            <div className={`sidebar-item ${collapsed ? 'justify-center' : ''}`}>
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm"
                  >
                    {connected ? 'Connected' : 'Offline'}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-surface-200 dark:border-surface-700 space-y-1">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="sidebar-item w-full"
          >
            {darkMode ? (
              <Sun className="w-5 h-5 flex-shrink-0" />
            ) : (
              <Moon className="w-5 h-5 flex-shrink-0" />
            )}
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  {darkMode ? 'Light Mode' : 'Dark Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Help */}
          <button className="sidebar-item w-full">
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  Help & Support
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="sidebar-item w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* User Card */}
        {!collapsed && (
          <div className="p-3 border-t border-surface-200 dark:border-surface-700">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50">
              <div className={`w-10 h-10 rounded-full ${config.gradient} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-900 dark:text-white truncate">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.aside>
    </>
  )
}

