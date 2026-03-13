import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { api } from '../services/api'
import StatCard, { StatsGrid } from '../components/StatCard'
import PatientCard, { PatientList } from '../components/PatientCard'
import VitalsChart from '../components/charts/VitalsChart'
import {
  Users, Activity, FileText, Pill, FlaskConical,
  Video, Heart, Thermometer, Wind, Activity as ActivityIcon,
  Stethoscope, Calendar, MessageSquare, Phone, ClipboardList,
  AlertCircle, CheckCircle, Clock, User, Search, Filter
} from 'lucide-react'

const demoPatients = [
  { 
    id: 'ICU-A-12', 
    name: 'John Doe', 
    status: 'stable', 
    condition: 'Post-operative monitoring',
    room: 'A-12',
    nurse: 'Nurse Smith',
    heartRate: 78,
    oxygen: 97,
    temperature: 98.6,
    respRate: 16,
  },
  { 
    id: 'ICU-B-08', 
    name: 'Jane Smith', 
    status: 'critical', 
    condition: 'Respiratory distress',
    room: 'B-08',
    nurse: 'Nurse Johnson',
    heartRate: 112,
    oxygen: 89,
    temperature: 101.2,
    respRate: 24,
  },
  { 
    id: 'ICU-C-15', 
    name: 'Robert Brown', 
    status: 'recovering', 
    condition: 'Cardiac observation',
    room: 'C-15',
    nurse: 'Nurse Williams',
    heartRate: 72,
    oxygen: 98,
    temperature: 98.4,
    respRate: 14,
  },
  { 
    id: 'ICU-D-03', 
    name: 'Emily Wilson', 
    status: 'watch', 
    condition: 'Neurological monitoring',
    room: 'D-03',
    nurse: 'Nurse Davis',
    heartRate: 85,
    oxygen: 95,
    temperature: 99.1,
    respRate: 18,
  },
]

const demoTasks = [
  { id: 1, task: 'Review patient labs', priority: 'high', status: 'pending', patient: 'Jane Smith' },
  { id: 2, task: 'Prescribe medication', priority: 'high', status: 'pending', patient: 'John Doe' },
  { id: 3, task: 'Consultation note', priority: 'medium', status: 'completed', patient: 'Robert Brown' },
  { id: 4, task: 'Order diagnostic tests', priority: 'medium', status: 'pending', patient: 'Emily Wilson' },
  { id: 5, task: 'Discharge planning', priority: 'low', status: 'pending', patient: 'John Doe' },
]

const upcomingAppointments = [
  { id: 1, patient: 'John Doe', time: '10:00 AM', type: 'Follow-up', room: 'A-12' },
  { id: 2, patient: 'Jane Smith', time: '11:30 AM', type: 'Critical Care', room: 'B-08' },
  { id: 3, patient: 'Robert Brown', time: '2:00 PM', type: 'Family Meeting', room: 'Consult Room 1' },
]

const medicalActions = [
  { icon: FileText, label: 'Review Charts', color: 'bg-blue-500', description: 'View patient records' },
  { icon: Pill, label: 'Prescribe Meds', color: 'bg-green-500', description: 'Medication orders' },
  { icon: FlaskConical, label: 'Order Tests', color: 'bg-purple-500', description: 'Lab & imaging orders' },
  { icon: Users, label: 'Consult', color: 'bg-orange-500', description: 'Request consultation' },
  { icon: Calendar, label: 'Schedule', color: 'bg-cyan-500', description: 'Manage appointments' },
  { icon: MessageSquare, label: 'Messages', color: 'bg-pink-500', description: 'Staff communication' },
]

export default function DoctorDashboard() {
  const { user } = useAuth()
  const { connected, lastFrame, alerts } = useSocket()
  const [patients, setPatients] = useState(demoPatients)
  const [selectedPatient, setSelectedPatient] = useState(demoPatients[0])
  const [tasks, setTasks] = useState(demoTasks)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    loadPatientData()
    const interval = setInterval(loadPatientData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadPatientData = async () => {
    try {
      // Simulated API call
      setLoading(false)
    } catch (error) {
      console.error('Failed to load patient data:', error)
    }
  }

  const toggleTask = (taskId) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed' }
        : task
    ))
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         patient.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || patient.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const currentVitals = selectedPatient || demoPatients[0]

  const vitalCards = [
    { 
      label: 'Heart Rate', 
      value: currentVitals.heartRate || '--', 
      unit: 'BPM', 
      icon: Heart, 
      color: 'text-red-500', 
      bg: 'bg-red-100 dark:bg-red-900/30',
      trend: currentVitals.heartRate > 100 ? 'up' : currentVitals.heartRate < 60 ? 'down' : 'neutral'
    },
    { 
      label: 'Oxygen', 
      value: currentVitals.oxygen || '--', 
      unit: '%', 
      icon: Wind, 
      color: 'text-blue-500', 
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      trend: currentVitals.oxygen < 95 ? 'down' : 'neutral'
    },
    { 
      label: 'Temperature', 
      value: currentVitals.temperature || '--', 
      unit: '°F', 
      icon: Thermometer, 
      color: 'text-orange-500', 
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      trend: currentVitals.temperature > 100 ? 'up' : 'neutral'
    },
    { 
      label: 'Resp Rate', 
      value: currentVitals.respRate || '--', 
      unit: '/min', 
      icon: ActivityIcon, 
      color: 'text-green-500', 
      bg: 'bg-green-100 dark:bg-green-900/30',
      trend: currentVitals.respRate > 20 ? 'up' : currentVitals.respRate < 12 ? 'down' : 'neutral'
    },
  ]

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    highPriority: tasks.filter(t => t.priority === 'high' && t.status === 'pending').length,
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
            Medical Dashboard
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Dr. {user?.full_name?.split(' ').slice(1).join(' ') || 'Wilson'} - Patient Overview
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            connected 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            {connected ? 'Real-time Connected' : 'Offline'}
          </span>
        </div>
      </motion.div>

      {/* Vitals Overview */}
      <StatsGrid columns={4}>
        {vitalCards.map((vital, index) => (
          <motion.div
            key={vital.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`vital-card ${
              vital.trend === 'up' ? 'vital-card-warning' : 
              vital.trend === 'down' ? 'vital-card-critical' : ''
            }`}
          >
            <div className={`inline-flex p-3 rounded-xl ${vital.bg} mb-3`}>
              <vital.icon className={`w-6 h-6 ${vital.color}`} />
            </div>
            <p className="text-4xl font-bold text-surface-900 dark:text-white">
              {loading ? '...' : vital.value}
            </p>
            <p className="text-sm text-surface-500">{vital.unit}</p>
            <p className="text-sm font-medium text-surface-600 dark:text-surface-300 mt-2">{vital.label}</p>
          </motion.div>
        ))}
      </StatsGrid>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="p-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-600" />
                My Patients
              </h2>
              <span className="badge badge-info">{filteredPatients.length}</span>
            </div>
            
            {/* Search & Filter */}
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-sm w-full pl-9"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex flex-wrap gap-1">
              {['all', 'critical', 'stable', 'recovering', 'watch'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
            {filteredPatients.map((patient) => (
              <motion.div
                key={patient.id}
                onClick={() => setSelectedPatient(patient)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  selectedPatient?.id === patient.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                    : 'bg-surface-50 dark:bg-surface-700/50 border-2 border-transparent hover:bg-surface-100 dark:hover:bg-surface-700'
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-surface-900 dark:text-white text-sm">
                        {patient.name}
                      </p>
                      <p className="text-xs text-surface-500">{patient.id}</p>
                    </div>
                  </div>
                  <span className={`badge ${
                    patient.status === 'critical' ? 'badge-danger' :
                    patient.status === 'recovering' ? 'badge-success' :
                    patient.status === 'watch' ? 'badge-warning' :
                    'badge-info'
                  }`}>
                    {patient.status}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Live Video Feed */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 card"
        >
          <div className="flex items-center justify-between p-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-surface-900 dark:text-white">
                  Live Patient Monitor
                </h2>
                <p className="text-sm text-surface-500 dark:text-surface-400">
                  {selectedPatient?.name} - {selectedPatient?.room}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lastFrame?.emotion && (
                <span className="badge badge-info">
                  Emotion: {lastFrame.emotion}
                </span>
              )}
              <span className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                connected 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {connected ? 'LIVE' : 'OFFLINE'}
              </span>
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
                <Video className="w-16 h-16 text-surface-600 mb-4" />
                <p className="text-surface-400">AI monitoring feed</p>
                <p className="text-surface-500 text-sm mt-2">
                  Face detection, pose estimation, emotion analysis
                </p>
              </div>
            )}
            {/* Overlay info */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="px-2 py-1 bg-black/50 backdrop-blur rounded text-xs text-white">
                {selectedPatient?.name}
              </span>
              <span className="px-2 py-1 bg-black/50 backdrop-blur rounded text-xs text-white">
                Room: {selectedPatient?.room}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tasks & Vitals Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medical Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="p-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary-600" />
                Tasks
              </h2>
              <div className="flex items-center gap-2">
                <span className="badge badge-success">{taskStats.completed} done</span>
                <span className="badge badge-warning">{taskStats.pending} pending</span>
              </div>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                  task.status === 'completed'
                    ? 'bg-green-50 dark:bg-green-900/20'
                    : task.priority === 'high'
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : 'bg-surface-50 dark:bg-surface-700/50'
                }`}
                whileHover={{ scale: 1.01 }}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  task.status === 'completed'
                    ? 'bg-green-500 text-white'
                    : task.priority === 'high'
                    ? 'border-2 border-red-500'
                    : 'border-2 border-surface-300 dark:border-surface-600'
                }`}>
                  {task.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${
                    task.status === 'completed'
                      ? 'text-surface-400 dark:text-surface-500 line-through'
                      : 'text-surface-900 dark:text-white'
                  }`}>
                    {task.task}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    {task.patient}
                  </p>
                </div>
                <span className={`badge ${
                  task.priority === 'high' ? 'badge-danger' :
                  task.priority === 'medium' ? 'badge-warning' :
                  'badge-info'
                }`}>
                  {task.priority}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Vitals Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <VitalsChart height={350} patientId={selectedPatient?.id} />
        </motion.div>
      </div>

      {/* Medical Actions & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Medical Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <div className="p-4 border-b border-surface-100 dark:border-surface-700">
            <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary-600" />
              Medical Actions
            </h2>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {medicalActions.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl text-white ${action.color} flex flex-col items-center gap-2 shadow-lg hover:shadow-xl transition-all`}
              >
                <action.icon className="w-6 h-6" />
                <span className="font-medium text-sm">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Appointments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <div className="p-4 border-b border-surface-100 dark:border-surface-700">
            <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Upcoming Appointments
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {upcomingAppointments.map((apt, index) => (
              <motion.div
                key={apt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                  {apt.patient.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-surface-900 dark:text-white">
                    {apt.patient}
                  </p>
                  <p className="text-sm text-surface-500 dark:text-surface-400">
                    {apt.type} - {apt.room}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-surface-900 dark:text-white">
                    {apt.time}
                  </p>
                  <p className="text-xs text-surface-500 dark:text-surface-400">
                    Today
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Critical Alerts */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
        >
          <div className="p-4 border-b border-red-200 dark:border-red-800">
            <h2 className="font-semibold text-red-800 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Critical Alerts
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-white dark:bg-surface-800/50 border border-red-200 dark:border-red-800"
              >
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-red-800 dark:text-red-200">
                    {alert.message}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    {alert.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

