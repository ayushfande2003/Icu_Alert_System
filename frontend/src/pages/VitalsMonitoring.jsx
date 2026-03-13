import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Heart, Thermometer, Wind, Droplets } from 'lucide-react'
import { api } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function VitalsMonitoring() {
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
        // Poll for vitals every 5 seconds
        const interval = setInterval(loadData, 5000)
        return () => clearInterval(interval)
    }, [])

    const loadData = async () => {
        try {
            const response = await api.getPatients()
            setPatients(Array.isArray(response.data) ? response.data : [])
            setLoading(false)
        } catch (error) {
            console.error('Failed to load vitals:', error)
            setLoading(false)
        }
    }

    // Helper to determine status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'critical': return 'bg-red-500'
            case 'recovering': return 'bg-yellow-500'
            case 'stable': return 'bg-green-500'
            default: return 'bg-gray-400'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Vitals Monitoring</h1>
                    <p className="text-surface-500 dark:text-surface-400">Real-time patient physiological data</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-surface-500">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Live Updates
                </div>
            </div>

            <div className="card p-6">
                {loading ? (
                    <div className="flex justify-center p-12"><LoadingSpinner /></div>
                ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {patients.map(patient => (
                            <motion.div
                                key={patient.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="border border-surface-200 dark:border-surface-700 rounded-xl overflow-hidden"
                            >
                                <div className="p-4 bg-surface-50 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg dark:text-white">{patient.first_name} {patient.last_name}</h3>
                                        <p className="text-sm text-surface-500">Room: {patient.room_number}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs text-white capitalize ${getStatusColor(patient.status)}`}>
                                        {patient.status}
                                    </div>
                                </div>

                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <VitalsCard
                                        icon={<Heart className="w-5 h-5 text-red-500" />}
                                        label="Heart Rate"
                                        value={patient.current_vitals?.heart_rate || '--'}
                                        unit="bpm"
                                    />
                                    <VitalsCard
                                        icon={<Wind className="w-5 h-5 text-blue-500" />}
                                        label="O2 Sat"
                                        value={patient.current_vitals?.oxygen_saturation || '--'}
                                        unit="%"
                                    />
                                    <VitalsCard
                                        icon={<Activity className="w-5 h-5 text-orange-500" />}
                                        label="BP"
                                        value={`${patient.current_vitals?.blood_pressure_systolic || '--'}/${patient.current_vitals?.blood_pressure_diastolic || '--'}`}
                                        unit="mmHg"
                                    />
                                    <VitalsCard
                                        icon={<Thermometer className="w-5 h-5 text-amber-500" />}
                                        label="Temp"
                                        value={patient.current_vitals?.temperature || '--'}
                                        unit="°F"
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function VitalsCard({ icon, label, value, unit }) {
    return (
        <div className="bg-surface-50 dark:bg-surface-900/40 p-3 rounded-lg flex flex-col justify-center items-center text-center">
            <div className="mb-2">{icon}</div>
            <span className="text-xs text-surface-500 uppercase font-semibold">{label}</span>
            <div className="flex items-baseline gap-1 mt-1">
                <span className="text-xl font-bold dark:text-white">{value}</span>
                <span className="text-xs text-surface-400">{unit}</span>
            </div>
        </div>
    )
}
