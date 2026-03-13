import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    X, User, Activity, Heart, Clock, Calendar,
    FileText, Phone, MapPin, AlertCircle, CheckCircle,
    Thermometer, Wind
} from 'lucide-react'
import { api } from '../services/api'
import VitalsChart from './charts/VitalsChart'

export default function PatientDetailModal({ patient, onClose }) {
    const [activeTab, setActiveTab] = useState('overview')
    const [vitalsHistory, setVitalsHistory] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (patient?.id) {
            loadVitalsHistory()
        }
    }, [patient])

    const loadVitalsHistory = async () => {
        try {
            setLoading(true)
            // Mocking history for now if API endpoint isn't ready or returns empty
            // In a real scenario: const res = await api.getVitalsHistory({ patient_id: patient.id })
            // setVitalsHistory(res.data)

            // For now, generating some dummy trend data based on current vitals
            const now = new Date()
            const history = Array.from({ length: 24 }).map((_, i) => ({
                timestamp: new Date(now.getTime() - (23 - i) * 3600000).toISOString(),
                heart_rate: (patient.heartRate || 75) + Math.random() * 10 - 5,
                oxygen_saturation: (patient.oxygen || 98) + Math.random() * 2 - 1,
                temperature: (patient.temperature || 98.6) + Math.random() * 0.5 - 0.25,
                blood_pressure_systolic: 120 + Math.random() * 10 - 5,
                blood_pressure_diastolic: 80 + Math.random() * 10 - 5,
            }))
            setVitalsHistory(history)
        } catch (err) {
            console.error('Failed to load vitals history', err)
        } finally {
            setLoading(false)
        }
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'critical': return 'text-red-500 bg-red-100 dark:bg-red-900/30'
            case 'stable': return 'text-green-500 bg-green-100 dark:bg-green-900/30'
            case 'watch': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30'
            case 'recovering': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
            default: return 'text-surface-500 bg-surface-100 dark:bg-surface-800'
        }
    }

    if (!patient) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white">
                                {patient.name || (patient.first_name && patient.last_name ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient')}
                            </h2>
                            <div className="flex items-center gap-3 text-sm text-surface-500 dark:text-surface-400">
                                <span className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    ID: {patient.patient_id || patient.id}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-surface-300" />
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    Room {patient.room_number || patient.room}, Bed {patient.bed_number || patient.bed || '-'}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                                    {patient.status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-surface-200 dark:border-surface-700 px-6">
                    {['overview', 'vitals', 'notes'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'border-transparent text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-surface-50 dark:bg-surface-900/50">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Vitals Cards */}
                            <div className="col-span-1 md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <VitalCard
                                    icon={Heart}
                                    label="Heart Rate"
                                    value={patient.heartRate || patient.heart_rate || '--'}
                                    unit="bpm"
                                    color="bg-red-500"
                                />
                                <VitalCard
                                    icon={Wind}
                                    label="Oxygen"
                                    value={patient.oxygen || patient.oxygen_saturation || '--'}
                                    unit="%"
                                    color="bg-blue-500"
                                />
                                <VitalCard
                                    icon={Thermometer}
                                    label="Temp"
                                    value={patient.temperature || '--'}
                                    unit="°F"
                                    color="bg-orange-500"
                                />
                                <VitalCard
                                    icon={Activity}
                                    label="Resp Rate"
                                    value={patient.respRate || patient.respiratory_rate || '--'}
                                    unit="/min"
                                    color="bg-green-500"
                                />
                            </div>

                            {/* Info Columns */}
                            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm border border-surface-100 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-primary-500" />
                                    Demographics
                                </h3>
                                <dl className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-surface-500">Gender</dt>
                                        <dd className="font-medium">{patient.gender || 'N/A'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-surface-500">DOB</dt>
                                        <dd className="font-medium">{patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : 'N/A'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-surface-500">Admission Date</dt>
                                        <dd className="font-medium">{patient.admission_date ? new Date(patient.admission_date).toLocaleDateString() : 'N/A'}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm border border-surface-100 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-primary-500" />
                                    Care Team
                                </h3>
                                <dl className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-surface-500">Doctor</dt>
                                        <dd className="font-medium">{patient.primary_doctor_id || patient.doctor || 'Unassigned'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-surface-500">Nurse</dt>
                                        <dd className="font-medium">{patient.primary_nurse_id || patient.nurse || 'Unassigned'}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm border border-surface-100 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-primary-500" />
                                    Emergency Contact
                                </h3>
                                <dl className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <dt className="text-surface-500">Name</dt>
                                        <dd className="font-medium">{patient.family_contact_name || 'N/A'}</dd>
                                    </div>
                                    <div className="flex justify-between">
                                        <dt className="text-surface-500">Phone</dt>
                                        <dd className="font-medium">{patient.family_contact_phone || 'N/A'}</dd>
                                    </div>
                                </dl>
                            </div>

                            {/* Main Chart for Overview */}
                            <div className="col-span-1 md:col-span-3 bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm border border-surface-100 dark:border-surface-700">
                                <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Live Vitals Monitoring</h3>
                                <div className="h-64 flex items-center justify-center text-surface-500 bg-surface-50 dark:bg-surface-900/50 rounded-lg">
                                    {/* Placeholder for actual live chart or use VitalsChart component */}
                                    <VitalsChart
                                        historyData={vitalsHistory}
                                        selectedVitals={['heartRate', 'oxygen']}
                                        timeRange="24h"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'vitals' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-100 dark:border-surface-700">
                                    <h4 className="font-medium mb-4">Heart Rate Trend</h4>
                                    <div className="h-64">
                                        <VitalsChart
                                            historyData={vitalsHistory}
                                            selectedVitals={['heartRate']}
                                            timeRange="24h"
                                            showLegend={false}
                                        />
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-surface-800 p-6 rounded-xl border border-surface-100 dark:border-surface-700">
                                    <h4 className="font-medium mb-4">Oxygen Saturation</h4>
                                    <div className="h-64">
                                        <VitalsChart
                                            historyData={vitalsHistory}
                                            selectedVitals={['oxygen']}
                                            timeRange="24h"
                                            showLegend={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div className="bg-white dark:bg-surface-800 rounded-xl p-6 shadow-sm border border-surface-100 dark:border-surface-700 h-full">
                            <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Medical Notes</h3>
                            <div className="p-4 bg-surface-50 dark:bg-surface-900/50 rounded-lg min-h-[200px] whitespace-pre-wrap text-surface-700 dark:text-surface-300">
                                {patient.notes || "No notes available."}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

function VitalCard({ icon: Icon, label, value, unit, color }) {
    return (
        <div className="bg-white dark:bg-surface-800 p-4 rounded-xl shadow-sm border border-surface-100 dark:border-surface-700 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${color} bg-opacity-10 flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
            <div>
                <p className="text-sm text-surface-500 dark:text-surface-400">{label}</p>
                <p className="text-xl font-bold text-surface-900 dark:text-white">
                    {typeof value === 'number' ? Math.round(value) : value}
                    <span className="text-xs font-normal text-surface-500 ml-1">{unit}</span>
                </p>
            </div>
        </div>
    )
}
