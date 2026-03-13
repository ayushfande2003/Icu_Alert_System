import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useSocket } from '../contexts/SocketContext'
import VitalsChart from '../components/charts/VitalsChart'
import {
    Heart, Video, Camera, Mic, MicOff,
    RefreshCw, Volume2, VolumeX, Maximize2, Minimize2
} from 'lucide-react'

// Demo Data (Reused from Dashboard for consistency initially)
const demoPatient = {
    name: 'John Doe',
    room: 'ICU-A-12',
}

const demoVitals = {
    heartRate: 78,
    oxygen: 97,
    temperature: 98.6,
    respiratoryRate: 16
}

export default function FamilyLiveMonitor() {
    const { connected, lastFrame, emit } = useSocket()
    const [vitals, setVitals] = useState(demoVitals)
    const [cameraStream, setCameraStream] = useState(null)
    const [cameraActive, setCameraActive] = useState(false)
    const [audioEnabled, setAudioEnabled] = useState(false)
    const [fullscreen, setFullscreen] = useState(false)
    const videoRef = useRef(null)

    useEffect(() => {
        // Auto-connect to camera on mount
        startLocalCamera()
        return () => {
            stopLocalCamera()
        }
    }, [])

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

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
                        Live Monitor
                    </h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Real-time feed for {demoPatient.name} (Room {demoPatient.room})
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${connected
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                        }`}>
                        <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`} />
                        {connected ? 'Connected to Hospital' : 'Connecting...'}
                    </span>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Your Camera */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
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
                                    className={`p-2 rounded-lg transition-colors ${audioEnabled
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
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${cameraActive
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : 'bg-green-500 text-white hover:bg-green-600'
                                    }`}
                            >
                                {cameraActive ? 'Stop' : 'Start'}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Hospital Feed */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card overflow-hidden"
                >
                    <div className="p-4 border-b border-surface-100 dark:border-surface-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                                    <Video className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-surface-900 dark:text-white">Hospital Feed</h2>
                                    <p className="text-sm text-surface-500 dark:text-surface-400">Live AI Monitoring</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {lastFrame?.emotion && (
                                    <span className="badge badge-info">Emotion: {lastFrame.emotion}</span>
                                )}
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${connected
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
                    </div>
                </motion.div>
            </div>

            {/* Vitals Summary Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 className="text-lg font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Live Vitals Stream
                </h2>
                <VitalsChart height={300} patientId={demoPatient.room} />
            </motion.div>
        </div>
    )
}
