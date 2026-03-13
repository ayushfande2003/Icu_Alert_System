import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Save, Server, Shield, Bell, Database, X } from 'lucide-react'
import { api } from '../../services/api'
import { AlertBanner } from '../AlertToast'

export default function SystemSettings({ onClose }) {
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState({
        maintenance_mode: false,
        allow_registrations: true,
        alert_threshold: 'Medium',
        data_retention_days: 30
    })
    const [notification, setNotification] = useState(null)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            setLoading(true)
            setLoading(true)
            const { data } = await api.getSettings()
            setSettings(data)
        } catch (err) {
            console.error('Failed to load settings:', err)
            setNotification({ message: 'Failed to load settings', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setLoading(true)
            setLoading(true)
            await api.updateSettings(settings)
            setNotification({ message: 'Settings saved successfully', type: 'success' })
            setTimeout(onClose, 1500)
        } catch (err) {
            setNotification({ message: 'Failed to save settings', type: 'error' })
        } finally {
            setLoading(false)
        }
    }

    const isModal = !!onClose

    if (!isModal) {
        return (
            <div className="flex-1 flex flex-col h-full bg-surface-50 dark:bg-surface-900 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white">System Settings</h2>
                            <p className="text-surface-500 dark:text-surface-400">Configure global parameters</p>
                        </div>
                    </div>
                    {/* Header Action if needed */}
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 space-y-6 overflow-auto">
                    {notification && (
                        <AlertBanner message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />
                    )}

                    {/* General Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-surface-900 dark:text-white">
                            <Server className="w-5 h-5 text-surface-400" />
                            General
                        </h3>
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white">Maintenance Mode</p>
                                    <p className="text-sm text-surface-500">Disable access for non-admin users</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.maintenance_mode}
                                        onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer dark:bg-surface-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white">User Registration</p>
                                    <p className="text-sm text-surface-500">Allow new users to register</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.allow_registrations}
                                        onChange={e => setSettings({ ...settings, allow_registrations: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer dark:bg-surface-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Database Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-surface-900 dark:text-white">
                            <Database className="w-5 h-5 text-surface-400" />
                            Data Retention
                        </h3>
                        <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                            <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
                                Keep logs for (days)
                            </label>
                            <input
                                type="number"
                                className="input w-full"
                                value={settings.data_retention_days}
                                onChange={e => setSettings({ ...settings, data_retention_days: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Alert Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-surface-900 dark:text-white">
                            <Bell className="w-5 h-5 text-surface-400" />
                            Alert Thresholds
                        </h3>
                        <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                            <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
                                Default Alert Severity
                            </label>
                            <select
                                className="input w-full"
                                value={settings.alert_threshold}
                                onChange={e => setSettings({ ...settings, alert_threshold: e.target.value })}
                            >
                                <option value="Low">Low (Info only)</option>
                                <option value="Medium">Medium (Warnings)</option>
                                <option value="High">High (Critical)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-100 dark:border-surface-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white">System Settings</h2>
                            <p className="text-sm text-surface-500 dark:text-surface-400">Configure global parameters</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {notification && (
                        <AlertBanner message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />
                    )}

                    {/* General Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-surface-900 dark:text-white">
                            <Server className="w-5 h-5 text-surface-400" />
                            General
                        </h3>
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white">Maintenance Mode</p>
                                    <p className="text-sm text-surface-500">Disable access for non-admin users</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.maintenance_mode}
                                        onChange={e => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer dark:bg-surface-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                                <div>
                                    <p className="font-medium text-surface-900 dark:text-white">User Registration</p>
                                    <p className="text-sm text-surface-500">Allow new users to register</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={settings.allow_registrations}
                                        onChange={e => setSettings({ ...settings, allow_registrations: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none rounded-full peer dark:bg-surface-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Database Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-surface-900 dark:text-white">
                            <Database className="w-5 h-5 text-surface-400" />
                            Data Retention
                        </h3>
                        <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                            <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
                                Keep logs for (days)
                            </label>
                            <input
                                type="number"
                                className="input w-full"
                                value={settings.data_retention_days}
                                onChange={e => setSettings({ ...settings, data_retention_days: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    {/* Alert Settings */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 text-surface-900 dark:text-white">
                            <Bell className="w-5 h-5 text-surface-400" />
                            Alert Thresholds
                        </h3>
                        <div className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
                            <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">
                                Default Alert Severity
                            </label>
                            <select
                                className="input w-full"
                                value={settings.alert_threshold}
                                onChange={e => setSettings({ ...settings, alert_threshold: e.target.value })}
                            >
                                <option value="Low">Low (Info only)</option>
                                <option value="Medium">Medium (Warnings)</option>
                                <option value="High">High (Critical)</option>
                            </select>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-surface-100 dark:border-surface-700 flex justify-end gap-3">
                    <button onClick={onClose} className="btn btn-ghost">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
