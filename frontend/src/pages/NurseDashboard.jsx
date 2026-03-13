import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { api } from '../services/api'
import StatCard, { StatsGrid } from '../components/StatCard'
import PatientCard, { PatientList } from '../components/PatientCard'
import VitalsChart from '../components/charts/VitalsChart'
import {
  Users, Activity, CheckCircle, AlertCircle, Phone,
  Heart, Thermometer, Wind, Activity as ActivityIcon,
  ClipboardList, Clock, UserCheck, Bell, PhoneCall,
  MessageSquare, AlertTriangle, Check, Send, Calendar,
  Mail
} from 'lucide-react'
import MessagesModal from '../components/MessagesModal'


const demoPatients = [
  { id: 'ICU-A-12', name: 'John Doe', status: 'stable', room: 'A-12', nurse: 'Nurse Smith', heartRate: 78, oxygen: 97, temperature: 98.6 },
  { id: 'ICU-B-08', name: 'Jane Smith', status: 'critical', room: 'B-08', nurse: 'Nurse Johnson', heartRate: 112, oxygen: 89, temperature: 101.2 },
  { id: 'ICU-C-15', name: 'Robert Brown', status: 'watch', room: 'C-15', nurse: 'Nurse Williams', heartRate: 85, oxygen: 95, temperature: 99.1 },
  { id: 'ICU-D-03', name: 'Emily Wilson', status: 'stable', room: 'D-03', nurse: 'Nurse Davis', heartRate: 72, oxygen: 98, temperature: 98.4 },
]



const quickActions = [
  { icon: Bell, label: 'Acknowledge Alert', color: 'bg-blue-500', action: 'alert' },
  { icon: ActivityIcon, label: 'Record Vitals', color: 'bg-green-500', action: 'vitals' },
  { icon: PhoneCall, label: 'Call Doctor', color: 'bg-purple-500', action: 'doctor' },
  { icon: AlertCircle, label: 'Emergency', color: 'bg-red-500', action: 'emergency', pulse: true },
  { icon: ClipboardList, label: 'New Task', color: 'bg-orange-500', action: 'task' },
  { icon: MessageSquare, label: 'Send Message', color: 'bg-cyan-500', action: 'message' },
]

const NurseDashboard = () => {
  const { user } = useAuth()
  const { connected, alerts } = useSocket()
  const [patients, setPatients] = useState(demoPatients)
  const [tasks, setTasks] = useState([]) // Initialize empty
  const [vitals, setVitals] = useState({
    heartRate: 78,
    oxygen: 97,
    temperature: 98.6,
    respiratoryRate: 16
  })
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedPatient, setSelectedPatient] = useState(null)

  // Messages state
  const [messagesOpen, setMessagesOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Alert state
  const [activeAlerts, setActiveAlerts] = useState([])

  useEffect(() => {
    loadData()
    loadAlerts()
    checkUnreadMessages()
    fetchTasks() // Fetch tasks

    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    const dataInterval = setInterval(() => {
      loadData()
      loadAlerts()
      checkUnreadMessages()
      fetchTasks()
    }, 15000)
    return () => {
      clearInterval(timer)
      clearInterval(dataInterval)
    }
  }, [])

  const fetchTasks = async () => {
    try {
      // Fetch only pending/in-progress tasks for the dashboard widget
      const data = await api.getTasks({ status: 'pending' }) // or fetch all and filter
      // Actually let's fetch pending and in-progress.
      // Since API might not support multiple status params cleanly without implementation, 
      // let's fetch all and filter client side for the widget, or just fetch pending which is most important.
      // Let's try to get all and slice.
      const allTasks = await api.getTasks()
      setTasks(allTasks.slice(0, 5)) // Show top 5 recent tasks
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    }
  }

  const loadAlerts = async () => {
    try {
      const response = await api.getAlerts({ acknowledged: false })
      if (response.data && Array.isArray(response.data.alerts)) {
        setActiveAlerts(response.data.alerts)
      }
    } catch (error) {
      console.error('Failed to load alerts:', error)
    }
  }

  const checkUnreadMessages = async () => {
    try {
      const msgs = await api.getMessages()
      const unread = msgs.filter(m => !m.is_read).length
      setUnreadCount(unread)
    } catch (error) {
      console.error('Failed to check messages:', error)
    }
  }

  const handleAcknowledge = async (alertId) => {
    try {
      await api.acknowledgeAlert(alertId)
      setActiveAlerts(prev => prev.filter(a => a.id !== alertId))
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }

  const loadData = async () => {
    try {
      // Simulated data loading
      setLoading(false)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const toggleTask = async (taskId) => {
    // For dashboard widget, maybe just navigate to tasks page or simple toggle?
    // Let's implement simple toggle if it's easy, or just link to tasks.
    // Let's try to update status.
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    try {
      await api.updateTask(taskId, { status: newStatus })
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    } catch (err) {
      console.error("Failed to toggle task", err)
    }
  }

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    pending: tasks.filter(t => t.status === 'pending').length,
  }

  const vitalCards = [
    { label: 'Heart Rate', value: vitals.heartRate || '--', unit: 'BPM', icon: Heart, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', trend: vitals.heartRate > 100 ? 'up' : vitals.heartRate < 60 ? 'down' : 'neutral' },
    { label: 'Oxygen', value: vitals.oxygen || '--', unit: '%', icon: Wind, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', trend: vitals.oxygen < 95 ? 'down' : 'neutral' },
    { label: 'Temperature', value: vitals.temperature || '--', unit: '°F', icon: Thermometer, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', trend: vitals.temperature > 100 ? 'up' : 'neutral' },
    { label: 'Resp Rate', value: vitals.respiratoryRate || '--', unit: '/min', icon: ActivityIcon, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30', trend: vitals.respiratoryRate > 20 ? 'up' : 'neutral' },
  ]

  const patientStats = {
    total: patients.length,
    critical: patients.filter(p => p.status === 'critical').length,
    stable: patients.filter(p => p.status === 'stable').length,
    watch: patients.filter(p => p.status === 'watch').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
            Nursing Station
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            {user?.full_name || 'Nurse'} - {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-100 dark:bg-surface-700">
            <Clock className="w-5 h-5 text-primary-600" />
            <span className="font-mono font-semibold text-surface-900 dark:text-white">
              {currentTime.toLocaleTimeString()}
            </span>
          </div>
          <span className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${connected
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
            }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {connected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <StatsGrid columns={4}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{patientStats.total}</p>
            <p className="text-sm text-surface-500 dark:text-surface-400">Total Patients</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="card p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{patientStats.critical}</p>
            <p className="text-sm text-surface-500 dark:text-surface-400">Critical</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="card p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{taskStats.completed}</p>
            <p className="text-sm text-surface-500 dark:text-surface-400">Tasks Done</p>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="card p-4 flex items-center gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900 dark:text-white">{taskStats.pending}</p>
            <p className="text-sm text-surface-500 dark:text-surface-400">Pending</p>
          </div>
        </motion.div>
      </StatsGrid>

      {/* Vitals Quick View */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <ActivityIcon className="w-5 h-5 text-primary-600" />
          Quick Vitals Overview
        </h2>
        <StatsGrid columns={4}>
          {vitalCards.map((vital, index) => (
            <motion.div
              key={vital.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`vital-card ${vital.trend === 'up' ? 'vital-card-warning' :
                vital.trend === 'down' ? 'vital-card-critical' : ''
                }`}
            >
              <div className={`inline-flex p-3 rounded-xl ${vital.bg} mb-2`}>
                <vital.icon className={`w-5 h-5 ${vital.color}`} />
              </div>
              <p className="text-3xl font-bold text-surface-900 dark:text-white">
                {loading ? '...' : vital.value}
              </p>
              <p className="text-sm text-surface-500">{vital.unit}</p>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">{vital.label}</p>
            </motion.div>
          ))}
        </StatsGrid>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient Assignment */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="p-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                My Patients
              </h2>
              <div className="flex items-center gap-2">
                <span className="badge badge-success">{patientStats.stable} Stable</span>
                <span className="badge badge-danger">{patientStats.critical} Critical</span>
                <span className="badge badge-warning">{patientStats.watch} Watch</span>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {patients.map((patient) => (
              <motion.div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${patient.status === 'critical'
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:border-red-300'
                  : patient.status === 'watch'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:border-yellow-300'
                    : 'bg-surface-50 dark:bg-surface-700/50 border-transparent hover:border-surface-200 dark:hover:border-surface-600'
                  }`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-surface-900 dark:text-white">{patient.name}</p>
                      <p className="text-sm text-surface-500">{patient.room}</p>
                    </div>
                  </div>
                  <span className={`badge ${patient.status === 'critical' ? 'badge-danger' :
                    patient.status === 'watch' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                    {patient.status}
                  </span>
                </div>
                {patient.status === 'critical' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Requires immediate attention
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Nursing Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <div className="p-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary-600" />
                Today's Tasks
              </h2>
              <span className="badge badge-warning">
                {taskStats.inProgress} in progress
              </span>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${task.status === 'completed'
                  ? 'bg-green-50 dark:bg-green-900/20'
                  : task.status === 'in-progress'
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : task.priority === 'high'
                      ? 'bg-red-50 dark:bg-red-900/20'
                      : 'bg-surface-50 dark:bg-surface-700/50'
                  }`}
                whileHover={{ scale: 1.01 }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${task.status === 'completed'
                  ? 'bg-green-500 text-white'
                  : task.status === 'in-progress'
                    ? 'border-2 border-blue-500'
                    : task.priority === 'high'
                      ? 'border-2 border-red-500'
                      : 'border-2 border-surface-300 dark:border-surface-600'
                  }`}>
                  {task.status === 'completed' && <Check className="w-4 h-4" />}
                  {task.status === 'in-progress' && <Clock className="w-4 h-4 text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${task.status === 'completed'
                    ? 'text-surface-400 dark:text-surface-500 line-through'
                    : 'text-surface-900 dark:text-white'
                    }`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {task.patient_name || 'General'} • {task.due_date ? new Date(task.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time'}
                  </p>
                </div>
                <span className={`badge ${task.priority === 'high' ? 'badge-danger' :
                  task.priority === 'medium' ? 'badge-warning' :
                    'badge-info'
                  }`}>
                  {task.priority}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="p-4 border-b border-surface-100 dark:border-surface-700">
            <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              Quick Actions
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {quickActions.map((item, index) => (
              <motion.button
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full p-4 rounded-xl text-white ${item.color} flex items-center gap-3 shadow-lg hover:shadow-xl transition-all relative overflow-hidden`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.pulse && (
                  <motion.span
                    className="absolute right-4 w-3 h-3 bg-white rounded-full"
                    animate={{ opacity: [1, 0.3, 1], scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Active Alerts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`card ${activeAlerts.length > 0 ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' : ''}`}
      >
        <div className="p-4 border-b border-surface-100 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-red-500" />
              Active Alerts
            </h2>
            {activeAlerts.length > 0 && (
              <span className="badge badge-danger">{activeAlerts.length} alerts</span>
            )}
          </div>
        </div>
        <div className="p-4">
          {activeAlerts.length > 0 ? (
            <div className="space-y-3">
              {activeAlerts.slice(0, 5).map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-surface-800/50 border border-red-200 dark:border-red-800"
                >
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-surface-900 dark:text-white">{alert.message || alert.title}</p>
                    <p className="text-sm text-surface-500 dark:text-surface-400">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                  >
                    Acknowledge
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-surface-600 dark:text-surface-400 font-medium">All Clear!</p>
              <p className="text-sm text-surface-500 dark:text-surface-500 mt-1">No active alerts at this time</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Vitals Chart for Selected Patient */}
      {selectedPatient && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <VitalsChart height={300} patientId={selectedPatient.id} />
        </motion.div>
      )}

      {/* Messages Modal */}
      <MessagesModal
        isOpen={messagesOpen}
        onClose={() => setMessagesOpen(false)}
      />

      {/* Floating Action Button for Messages */}
      <motion.button
        onClick={() => setMessagesOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors z-40"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Mail className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center border-2 border-white dark:border-surface-900">
            {unreadCount}
          </span>
        )}
      </motion.button>


    </div>
  )
}

export default NurseDashboard

