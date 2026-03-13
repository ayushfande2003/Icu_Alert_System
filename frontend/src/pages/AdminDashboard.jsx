import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { api } from '../services/api'
import StatCard, { StatsGrid } from '../components/StatCard'
import PatientCard, { PatientList } from '../components/PatientCard'
import VitalsChart from '../components/charts/VitalsChart'
import UserManagement from '../components/admin/UserManagement'
import SystemSettings from '../components/admin/SystemSettings'
import Reports from '../components/admin/Reports'
import AdmitPatientModal from '../components/AdmitPatientModal'
import EditPatientModal from '../components/EditPatientModal'
import PatientDetailModal from '../components/PatientDetailModal'
import {
  Users, Activity, Server, Shield, AlertTriangle,
  Database, Wifi, Camera, Bell, RefreshCw, Settings,
  TrendingUp, Cpu, HardDrive, Zap, Calendar,
  FileText, Download, Upload, RefreshCcw
} from 'lucide-react'

// System components configuration (dynamic status will be merged)
const initialSystemComponents = [
  { name: 'Backend API', key: 'api', status: 'online', icon: Server, description: 'REST API Service' },
  { name: 'Database', key: 'database', status: 'online', icon: Database, description: 'PostgreSQL Cluster' },
  { name: 'WebSocket', key: 'websocket', status: 'online', icon: Wifi, description: 'Real-time Updates' },
  { name: 'Camera Feed', key: 'camera', status: 'warning', icon: Camera, description: 'Video Processing' },
  { name: 'Telegram Bot', key: 'telegram', status: 'online', icon: Bell, description: 'Notifications' },
]

const quickActions = [
  { icon: Users, label: 'Manage Users', color: 'from-blue-500 to-cyan-500', action: 'users' },
  { icon: Shield, label: 'Security Settings', color: 'from-purple-500 to-indigo-500', action: 'security' },
  { icon: Database, label: 'Backup Data', color: 'from-green-500 to-emerald-500', action: 'backup' },
  { icon: Settings, label: 'System Settings', color: 'from-orange-500 to-amber-500', action: 'settings' },
  { icon: FileText, label: 'Generate Report', color: 'from-pink-500 to-rose-500', action: 'report' },
  { icon: RefreshCcw, label: 'System Health', color: 'from-teal-500 to-cyan-500', action: 'health' },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const { connected, lastFrame, alerts: socketAlerts } = useSocket()

  // State
  const [stats, setStats] = useState({
    totalPatients: 0,
    activeAlerts: 0,
    onlineMonitors: 0,
    uptime: '0%',
  })
  const [loading, setLoading] = useState(true)
  const [patients, setPatients] = useState([])
  const [systemComponents, setSystemComponents] = useState(initialSystemComponents)
  const [recentActivity, setRecentActivity] = useState([])
  const [error, setError] = useState(null)

  const [selectedPatient, setSelectedPatient] = useState(null)
  const [viewingPatient, setViewingPatient] = useState(null)
  const [activeModal, setActiveModal] = useState(null)

  // Chart Data State
  const [chartData, setChartData] = useState(null)
  const [chartPatientId, setChartPatientId] = useState(null)

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [connected]) // Reload when socket connection changes

  const loadDashboardData = async () => {
    try {
      setError(null)
      // fetch all data in parallel
      const [patientsRes, alertsRes, healthRes] = await Promise.allSettled([
        api.getPatients({ limit: 100 }),
        api.getAlerts({ limit: 20 }), // Get recent alerts (acknowledged or not)
        api.healthCheck(),
      ])

      // Process Patients
      let currentPatients = []
      if (patientsRes.status === 'fulfilled') {
        // Axios returns response object, data is in response.data
        const responseData = patientsRes.value.data
        currentPatients = Array.isArray(responseData) ? responseData : (responseData.patients || [])
        setPatients(currentPatients)
      }

      // Process Alerts & Activity
      let alertCount = 0
      if (alertsRes.status === 'fulfilled') {
        const responseData = alertsRes.value.data
        const allAlerts = responseData.alerts || []
        // Count unacknowledged
        alertCount = responseData.unacknowledged_count || allAlerts.filter(a => !a.acknowledged).length

        // Map alerts to activity
        const activities = allAlerts.slice(0, 10).map(alert => ({
          id: alert.id,
          action: alert.message,
          user: 'System',
          time: formatDistanceToNow(new Date(alert.created_at || alert.timestamp), { addSuffix: true }),
          type: alert.severity > 3 ? 'error' : alert.severity > 1 ? 'warning' : 'info',
          icon: AlertTriangle
        }))

        setRecentActivity(activities.length > 0 ? activities : [
          { id: 1, action: 'System check completed', user: 'System', time: 'Just now', type: 'success', icon: Database },
        ])
      }

      // Process Health
      let uptimeStr = '99.9%'
      let camActive = false
      if (healthRes.status === 'fulfilled') {
        const health = healthRes.value.data
        camActive = health.camera === 'active'

        // Update components status based on health check
        setSystemComponents(prev => prev.map(comp => {
          let status = 'online'
          if (comp.key === 'database') status = health.database === 'connected' ? 'online' : 'error'
          if (comp.key === 'camera') status = health.camera === 'active' ? 'online' : 'warning'
          if (comp.key === 'telegram') status = health.telegram === 'connected' ? 'online' : 'warning'
          if (comp.key === 'websocket') status = connected ? 'online' : 'error'
          return { ...comp, status }
        }))

        if (health.uptime_seconds) {
          const days = Math.floor(health.uptime_seconds / 86400)
          const hours = Math.floor((health.uptime_seconds % 86400) / 3600)
          uptimeStr = days > 0 ? `${days}d ${hours}h` : `${hours}h ${(health.uptime_seconds / 60).toFixed(0) % 60}m`
        }
      }

      setStats({
        totalPatients: currentPatients.length,
        activeAlerts: alertCount,
        onlineMonitors: camActive ? 1 : 0,
        uptime: uptimeStr,
      })

      // Load chart for critical patient or first patient
      if (currentPatients.length > 0) {
        const featuredPatient = currentPatients.find(p => p.status === 'critical') || currentPatients[0]
        setChartPatientId(featuredPatient.patient_id || featuredPatient.id)
        await loadChartData(featuredPatient.patient_id || featuredPatient.id)
      }

    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setError('Failed to load system data. Retrying...')
    } finally {
      setLoading(false)
    }
  }

  const loadChartData = async (patientId) => {
    try {
      const history = await api.getVitalsHistory({ patientId, hours: 6 })
      if (history && history.vitals) {
        // Transform backend data to ChartJS format
        const labels = history.vitals.map(v => new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
        const datasets = {
          heartRate: {
            label: 'Heart Rate',
            data: history.vitals.map(v => v.heartRate),
            borderColor: '#ef4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            fill: true,
            tension: 0.4
          },
          oxygen: {
            label: 'Oxygen Saturation',
            data: history.vitals.map(v => v.oxygen),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4
          }
        }

        // Get current values from the last data point
        const lastPoint = history.vitals[history.vitals.length - 1]
        const currentValues = {
          heartRate: lastPoint?.heartRate || 0,
          oxygen: lastPoint?.oxygen || 0,
        }

        setChartData({ labels, datasets, currentValues })
      }
    } catch (err) {
      console.error("Failed to load chart data", err)
    }
  }

  const handleAction = (action) => {
    console.log('Action clicked:', action)
    if (action === 'health') loadDashboardData()
    else if (action === 'users') setActiveModal('users')
    else if (action === 'settings') setActiveModal('settings')
    else if (action === 'report') setActiveModal('report')
    else if (action === 'security') alert('Security Settings coming soon!')
    else if (action === 'backup') alert('Backup functionality coming soon!')
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-surface-900 dark:text-white"
          >
            Welcome back, <span className="text-gradient-primary">{user?.full_name?.split(' ')[0] || user?.username || 'Admin'}</span>
          </motion.h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Overview of SafeSign ICU Monitoring System
          </p>
        </div>
        <motion.button
          onClick={loadDashboardData}
          className="btn btn-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </motion.button>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </motion.div>
      )}

      {/* Stats Grid */}
      <StatsGrid columns={4}>
        <StatCard
          title="Total Patients"
          value={stats.totalPatients}
          change={stats.totalPatients > 0 ? "Active" : "None"}
          trend="neutral"
          icon={Users}
          iconBg="from-blue-500 to-cyan-500"
          loading={loading}
          delay={0}
        />
        <StatCard
          title="Active Alerts"
          value={stats.activeAlerts}
          change={stats.activeAlerts > 0 ? "Attention Needed" : "All Clear"}
          trend={stats.activeAlerts > 0 ? "down" : "up"}
          icon={AlertTriangle}
          iconBg="from-red-500 to-orange-500"
          loading={loading}
          delay={0.1}
        />
        <StatCard
          title="Online Monitors"
          value={stats.onlineMonitors}
          change={connected ? "Socket Connected" : "Socket Offline"}
          trend={connected ? "up" : "down"}
          icon={Camera}
          iconBg="from-green-500 to-emerald-500"
          loading={loading}
          delay={0.2}
        />
        <StatCard
          title="System Uptime"
          value={stats.uptime}
          change="Stable"
          trend="up"
          icon={Server}
          iconBg="from-purple-500 to-indigo-500"
          loading={loading}
          delay={0.3}
        />
      </StatsGrid>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Camera Feed */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 card overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-surface-900 dark:text-white">Live Camera Feed</h2>
                <p className="text-sm text-surface-500 dark:text-surface-400">AI-powered patient monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${connected
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {connected ? 'LIVE' : 'OFFLINE'}
              </span>
              {lastFrame?.emotion && (
                <span className="badge badge-info">Emotion: {lastFrame.emotion}</span>
              )}
            </div>
          </div>
          <div className="aspect-video bg-surface-900 relative">
            {lastFrame?.frame ? (
              <img
                src={`data:image/jpeg;base64,${lastFrame.frame}`}
                alt="Live Feed"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Camera className="w-16 h-16 text-surface-600 mb-4" />
                <p className="text-surface-400">Camera feed will appear here</p>
                <p className="text-surface-500 text-sm mt-2">
                  {connected ? 'Waiting for video stream...' : 'Backend disconnected'}
                </p>
              </div>
            )}
            {/* Overlay controls */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-black/50 backdrop-blur rounded text-xs text-white">
                  FPS: {connected ? (lastFrame?.count ? '30' : '0') : '--'}
                </span>
                <span className="px-2 py-1 bg-black/50 backdrop-blur rounded text-xs text-white">
                  {lastFrame?.timestamp ? new Date(lastFrame.timestamp).toLocaleTimeString() : '--:--:--'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <Server className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-surface-900 dark:text-white">System Status</h2>
                <p className="text-sm text-surface-500 dark:text-surface-400">Component Health</p>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {systemComponents.map((component, index) => (
              <motion.div
                key={component.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${component.status === 'online' ? 'bg-green-100 dark:bg-green-900/30' :
                    component.status === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-red-100 dark:bg-red-900/30'
                    }`}>
                    <component.icon className={`w-4 h-4 ${component.status === 'online' ? 'text-green-600 dark:text-green-400' :
                      component.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-surface-900 dark:text-white">
                      {component.name}
                    </p>
                    <p className="text-xs text-surface-500 dark:text-surface-400">
                      {component.description}
                    </p>
                  </div>
                </div>
                <span className={`badge ${component.status === 'online' ? 'badge-success' :
                  component.status === 'warning' ? 'badge-warning' :
                    'badge-danger'
                  }`}>
                  {component.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Activity & Vitals Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-surface-900 dark:text-white">Recent Activity</h2>
                <p className="text-sm text-surface-500 dark:text-surface-400">Latest system events</p>
              </div>
            </div>
            <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
              View All
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
            {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors cursor-pointer"
              >
                <div className={`w-2 h-2 rounded-full ${activity.type === 'success' ? 'bg-green-500' :
                  activity.type === 'warning' ? 'bg-yellow-500' :
                    activity.type === 'error' ? 'bg-red-500' :
                      'bg-blue-500'
                  }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 dark:text-white truncate">
                    {activity.action}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    by {activity.user}
                  </p>
                </div>
                <span className="text-xs text-surface-400 dark:text-surface-500 whitespace-nowrap">
                  {activity.time}
                </span>
              </motion.div>
            )) : (
              <div className="text-center py-8 text-surface-500">No recent activity</div>
            )}
          </div>
        </motion.div>

        {/* Vitals Trends Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <VitalsChart
            height={350}
            timeRange="6h"
            data={chartData}
            patientId={chartPatientId}
            onRangeChange={(range) => loadChartData(chartPatientId)} // Simplification: just reload
          />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card"
      >
        <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-surface-900 dark:text-white">Quick Actions</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">Common administrative tasks</p>
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              onClick={() => handleAction(action.action)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`p-4 rounded-xl bg-gradient-to-br ${action.color} text-white flex flex-col items-center gap-2 shadow-lg hover:shadow-xl transition-all`}
            >
              <action.icon className="w-6 h-6" />
              <span className="text-sm font-medium text-center">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Patients Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card"
      >
        <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-surface-900 dark:text-white">Patients Overview</h2>
              <p className="text-sm text-surface-500 dark:text-surface-400">Current ICU patients</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge badge-success">{patients.filter(p => p.status === 'stable').length} Stable</span>
            <span className="badge badge-danger">{patients.filter(p => p.status === 'critical').length} Critical</span>
            <span className="badge badge-warning">{patients.filter(p => p.status === 'watch').length} Watch</span>
          </div>
        </div>
        <div className="p-4">
          {patients.length > 0 ? (
            <PatientList
              patients={patients}
              onSelect={(p) => setViewingPatient(p)}
              onEdit={(p) => setSelectedPatient(p)}
              compact
            />
          ) : (
            <div className="text-center py-10">
              <p className="text-surface-500">No patients currently admitted.</p>
              <button onClick={() => setActiveModal('admit')} className="btn btn-primary mt-4">Admit New Patient</button>
            </div>
          )}
        </div>
      </motion.div>


      {/* Modals */}
      {activeModal === 'users' && <UserManagement onClose={() => setActiveModal(null)} />}
      {activeModal === 'settings' && <SystemSettings onClose={() => setActiveModal(null)} />}
      {activeModal === 'report' && <Reports onClose={() => setActiveModal(null)} />}
      <AnimatePresence>
        {activeModal === 'admit' && (
          <AdmitPatientModal
            onClose={() => setActiveModal(null)}
            onSuccess={() => {
              loadDashboardData()
              setActiveModal(null)
            }}
          />
        )}
        {selectedPatient && (
          <EditPatientModal
            patient={selectedPatient}
            onClose={() => setSelectedPatient(null)}
            onSuccess={() => {
              loadDashboardData()
              setSelectedPatient(null)
            }}
          />
        )}
        {viewingPatient && (
          <PatientDetailModal
            patient={viewingPatient}
            onClose={() => setViewingPatient(null)}
          />
        )}
      </AnimatePresence>
    </div >
  )
}

