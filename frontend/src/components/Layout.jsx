import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-50 dark:from-surface-900 dark:via-primary-900/10 dark:to-surface-900">
      {/* Desktop Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <Sidebar
            collapsed={false}
            onToggle={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
          }`}
      >
        {/* Header */}
        <Header
          onMenuToggle={() => setSidebarOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <footer className="px-4 lg:px-6 py-4 border-t border-surface-200 dark:border-surface-700">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-sm text-surface-500 dark:text-surface-400">
              © 2024 SafeSign ICU Monitoring. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                System Online
              </span>
              <span>v1.0.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

