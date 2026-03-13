import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react'
import { api } from '../services/api'

export default function AlertsPage() {
    const [alerts, setAlerts] = useState([])
    const [loading, setLoading] = useState(false)
    const [filter, setFilter] = useState('all') // 'all', 'active', 'acknowledged'

    useEffect(() => {
        fetchAlerts()
    }, [filter])

    const fetchAlerts = async () => {
        setLoading(true)
        try {
            const params = {
                limit: 50,
                acknowledged: filter === 'active' ? false : filter === 'acknowledged' ? true : undefined
            }
            const response = await api.getAlerts(params)
            setAlerts(response.data.alerts)
        } catch (err) {
            console.error('Failed to fetch alerts:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleAcknowledge = async (alertId) => {
        try {
            await api.acknowledgeAlert(alertId)
            // Optimistic update
            setAlerts(alerts.map(a =>
                a.id === alertId ? { ...a, is_acknowledged: true, acknowledged_at: new Date().toISOString() } : a
            ))
        } catch (err) {
            console.error('Failed to acknowledge:', err)
        }
    }

    const getSeverityColor = (severity) => {
        if (severity >= 4) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'
        if (severity === 3) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800'
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                    <Bell className="w-8 h-8 text-primary-600" />
                    Alert History
                </h1>

                <div className="flex bg-surface-100 dark:bg-surface-800 rounded-lg p-1">
                    {['all', 'active', 'acknowledged'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === f
                                ? 'bg-white dark:bg-surface-700 shadow-sm text-surface-900 dark:text-white'
                                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </motion.div>

            <div className="card overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-medium text-surface-900 dark:text-white">No alerts found</h3>
                        <p className="text-surface-500 dark:text-surface-400 mt-1">
                            Everything looks good!
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-surface-100 dark:divide-surface-700">
                        {alerts.map((alert) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors ${!alert.is_acknowledged ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-2 rounded-full flex-shrink-0 ${getSeverityColor(alert.severity)}`}>
                                        <AlertCircle className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-4 mb-1">
                                            <h3 className="font-semibold text-surface-900 dark:text-white">
                                                {alert.message || alert.title}
                                            </h3>
                                            <span className="text-sm text-surface-500 flex-shrink-0 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(alert.timestamp).toLocaleString()}
                                            </span>
                                        </div>

                                        <p className="text-surface-600 dark:text-surface-400 text-sm mb-2">
                                            Patient ID: {alert.patient_id} • Type: {alert.alert_type}
                                        </p>

                                        {alert.is_acknowledged ? (
                                            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                                                <CheckCircle className="w-3 h-3" />
                                                Acknowledged
                                                {alert.acknowledged_at && ` at ${new Date(alert.acknowledged_at).toLocaleTimeString()}`}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleAcknowledge(alert.id)}
                                                className="btn btn-sm btn-outline-danger"
                                            >
                                                Acknowledge
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
