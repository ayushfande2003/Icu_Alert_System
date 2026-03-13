import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useSocket } from '../contexts/SocketContext'
import { api } from '../services/api'
import VitalsChart from '../components/charts/VitalsChart'
import {
  Heart, Thermometer, Wind, Activity as ActivityIcon,
  Video, AlertCircle, MessageSquare, Clock, User,
  Phone, Calendar, Shield, Camera, Mic, MicOff,
  RefreshCw, Volume2, VolumeX, Maximize2, Minimize2
} from 'lucide-react'

const demoPatient = {
  name: 'John Doe',
  room: 'ICU-A-12',
  status: 'stable',
  condition: 'Post-operative monitoring',
  age: 65,
  admissionDate: '2024-01-15',
  doctor: 'Dr. Sarah Wilson',
  nurse: 'Nurse Smith'
}

const demoVitals = {
  heartRate: 78,
  oxygen: 97,
  temperature: 98.6,
  respiratoryRate: 16
}

const recentUpdates = [
  { id: 1, message: 'Vital signs are within normal range', time: '10 min ago', type: 'success', icon: Heart },
  { id: 2, message: 'Medication administered on schedule', time: '1 hour ago', type: 'info', icon: Clock },
  { id: 3, message: 'Doctor completed morning rounds', time: '2 hours ago', type: 'info', icon: User },
  { id: 4, message: 'Patient is comfortable and resting', time: '3 hours ago', type: 'success', icon: Calendar },
]

export default function FamilyDashboard() {
  const { user } = useAuth()
  const { connected, lastFrame, alerts, emit } = useSocket()
  const [vitals, setVitals] = useState(demoVitals)
  const [cameraStream, setCameraStream] = useState(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const videoRef = useRef(null)
  const localVideoRef = useRef(null)

  useEffect(() => {
    loadPatientData()
    // Auto-connect to camera
    startLocalCamera()
    return () => {
      stopLocalCamera()
    }
  }, [])

  const loadPatientData = async () => {
    try {
      // Simulated data loading
      setVitals(demoVitals)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const startLocalCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: true
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraStream(stream)
      setCameraActive(true)
      emit('start_video', { action: 'start' })
    } catch (error) {
      console.error('Camera access denied:', error)
    }
  }

  const stopLocalCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
      setCameraActive(false)
      emit('stop_video', { action: 'stop' })
    }
  }

  const toggleCamera = () => {
    if (cameraActive) {
      stopLocalCamera()
    } else {
      startLocalCamera()
    }
  }

  const toggleAudio = () => {
    if (cameraStream) {
      const audioTrack = cameraStream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setAudioEnabled(audioTrack.enabled)
      }
    }
  }

  const vitalCards = [
    { 
      label: 'Heart Rate', 
      value: vitals.heartRate || '--', 
      unit: 'BPM', 
      icon: Heart, 
      color: 'text-red-500', 
      bg: 'bg-red-100 dark:bg-red-900/30',
      status: vitals.heartRate >= 60 && vitals.heartRate <= 100 ? 'normal' : 'attention'
    },
    { 
      label: 'Oxygen', 
      value: vitals.oxygen || '--', 
      unit: '%', 
      icon: Wind, 
      color: 'text-blue-500', 
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      status: vitals.oxygen >= 95 ? 'normal' : 'attention'
    },
    { 
      label: 'Temperature', 
      value: vitals.temperature || '--', 
      unit: '°F', 
      icon: Thermometer, 
      color: 'text-orange-500', 
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      status: vitals.temperature < 100 ? 'normal' : 'attention'
    },
    { 
      label: 'Resp Rate', 
      value: vitals.respiratoryRate || '--', 
      unit: '/min', 
      icon: ActivityIcon, 
      color: 'text-green-500', 
      bg: 'bg-green-100 dark:bg-green-900/30',
      status: vitals.respiratoryRate >= 12 && vitals.respiratoryRate <= 20 ? 'normal' : 'attention'
    },
  ]

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
            Family Dashboard
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Real-time monitoring of your loved one
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            connected 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
              : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
          }`}>
            <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`} />
            {connected ? 'Connected to Hospital' : 'Connecting...'}
          </span>
        </div>
      </motion.div>

      {/* Patient Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card overflow-hidden"
      >
        <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-purple-600 p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <motion.div
              className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <Heart className="w-12 h-12" />
            </motion.div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{demoPatient.name}</h2>
              <p className="text-primary-100">Room {demoPatient.room}</p>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className={`px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-lg ${
                  demoPatient.status === 'stable' 
                    ? 'bg-green-500/80 text-white' 
                    : 'bg-yellow-500/80 text-white'
                }`}>
                  {demoPatient.status === 'stable' ? '✓ Stable' : 'Under Observation'}
                </span>
                <span className="text-sm text-primary-100">Age: {demoPatient.age}</span>
                <span className="text-sm text-primary-100">Since: {demoPatient.admissionDate}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary-200" />
                <span className="text-primary-100">{demoPatient.doctor}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-200" />
                <span className="text-primary-100">{demoPatient.nurse}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-surface-50 dark:bg-surface-800/50">
          <p className="text-surface-600 dark:text-surface-300">{demoPatient.condition}</p>
        </div>
      </motion.div>

      {/* Vitals Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Current Vital Signs
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {vitalCards.map((vital, index) => (
            <motion.div
              key={vital.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`vital-card ${
                vital.status === 'attention' ? 'vital-card-warning' : 'vital-card-stable'
              }`}
            >
              <div className={`inline-flex p-3 rounded-xl ${vital.bg} mb-3`}>
                <vital.icon className={`w-6 h-6 ${vital.color}`} />
              </div>
              <p className="text-4xl font-bold text-surface-900 dark:text-white">
                {vital.value}
              </p>
              <p className="text-sm text-surface-500">{vital.unit}</p>
              <p className="text-sm font-medium text-surface-600 dark:text-surface-300 mt-2">{vital.label}</p>
              <div className="mt-2">
                {vital.status === 'normal' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Normal
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    Attention
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Camera Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Camera */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="card overflow-hidden"
        >
          <div className="p-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-surface-900 dark:text-white">Your Camera</h2>
                  <p className="text-sm text-surface-500 dark:text-surface-400">Connect with your loved one</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAudio}
                  className={`p-2 rounded-lg transition-colors ${
                    audioEnabled 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600' 
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300'
                  }`}
                >
                  {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setFullscreen(!fullscreen)}
                  className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
                >
                  {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          <div className={`aspect-video bg-surface-900 relative ${fullscreen ? 'fixed inset-4 z-50' : ''}`}>
            {fullscreen && (
              <button
                onClick={() => setFullscreen(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
            )}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-900">
                <Camera className="w-16 h-16 text-surface-600 mb-4" />
                <p className="text-surface-400 mb-4">Camera feed from your device</p>
                <motion.button
                  onClick={toggleCamera}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium shadow-lg"
                >
                  Start Camera
                </motion.button>
              </div>
            )}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-3">
              <button
                onClick={toggleCamera}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  cameraActive
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {cameraActive ? 'Stop' : 'Start'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Hospital AI Monitor */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="card overflow-hidden"
        >
          <div className="p-4 border-b border-surface-100 dark:border-surface-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                  <ActivityIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-surface-900 dark:text-white">Hospital AI Monitor</h2>
                  <p className="text-sm text-surface-500 dark:text-surface-400">Real-time AI monitoring</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lastFrame?.emotion && (
                  <span className="badge badge-info">Emotion: {lastFrame.emotion}</span>
                )}
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  connected 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                  {connected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
          <div className="aspect-video bg-surface-900 relative">
            {lastFrame?.frame ? (
              <img
                src={`data:image/jpeg;base64,${lastFrame.frame}`}
                alt="Hospital Feed"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Video className="w-16 h-16 text-surface-600 mb-4" />
                <p className="text-surface-400">Connecting to hospital...</p>
                <p className="text-surface-500 text-sm mt-2">AI analysis will appear here</p>
                <motion.button
                  onClick={() => emit('start_video', { action: 'start' })}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-medium shadow-lg flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Connect
                </motion.button>
              </div>
            )}
            {lastFrame?.emotion && (
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <span className="px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-sm text-white">
                  Detection: Active
                </span>
                <span className="px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-sm text-white">
                  Emotion: {lastFrame.emotion}
                </span>
              </div>
            )}
          </div>
          <div className="p-4 bg-surface-50 dark:bg-surface-800/50">
            <p className="text-sm text-surface-600 dark:text-surface-400 text-center">
              Real-time AI monitoring with face detection & emotion analysis
            </p>
          </div>
        </motion.div>
      </div>

      {/* Vitals Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <VitalsChart height={300} patientId={demoPatient.room} />
      </motion.div>

      {/* Recent Updates */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <div className="p-4 border-b border-surface-100 dark:border-surface-700">
          <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-600" />
            Recent Updates
          </h2>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {recentUpdates.map((update, index) => (
              <motion.div
                key={update.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className={`flex items-start gap-4 p-4 rounded-xl ${
                  update.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                    : 'bg-surface-50 dark:bg-surface-700/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  update.type === 'success' 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-surface-100 dark:bg-surface-600'
                }`}>
                  <update.icon className={`w-5 h-5 ${
                    update.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-surface-600 dark:text-surface-300'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-surface-900 dark:text-white">{update.message}</p>
                  <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">{update.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Contact Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card"
      >
        <div className="p-4 border-b border-surface-100 dark:border-surface-700">
          <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            Contact Nursing Staff
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Our staff is here to answer your questions
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center gap-3 shadow-lg hover:shadow-xl transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Send Message</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 text-white flex items-center gap-3 shadow-lg hover:shadow-xl transition-all"
          >
            <Phone className="w-5 h-5" />
            <span className="font-medium">Request Call</span>
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

