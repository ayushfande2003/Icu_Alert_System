import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, User, FileText, Activity } from 'lucide-react'
import { api } from '../services/api'

export default function EditPatientModal({ patient, onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        room_number: '',
        bed_number: '',
        status: 'stable',
        notes: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (patient) {
            setFormData({
                first_name: patient.first_name || '',
                last_name: patient.last_name || '',
                room_number: patient.room_number || '',
                bed_number: patient.bed_number || '',
                status: patient.status || 'stable',
                notes: patient.notes || ''
            })
        }
    }, [patient])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            await api.updatePatient(patient.id, formData)
            onSuccess?.()
            onClose()
        } catch (err) {
            console.error('Failed to update patient:', err)
            setError(err.response?.data?.detail || err.message || 'Failed to update patient')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-primary-500" />
                        Edit Patient: {patient?.first_name} {patient?.last_name}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-surface-500 hover:text-surface-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 text-sm">
                            {error}
                        </div>
                    )}

                    <form id="edit-patient-form" onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-surface-900 dark:text-white flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                        First Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        required
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                        Last Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        required
                                        className="input w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Location & Status */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-surface-900 dark:text-white flex items-center gap-2">
                                <Activity className="w-4 h-4" />
                                Admission Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                        Room Number *
                                    </label>
                                    <input
                                        type="text"
                                        name="room_number"
                                        value={formData.room_number}
                                        onChange={handleChange}
                                        required
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                        Bed Number
                                    </label>
                                    <input
                                        type="text"
                                        name="bed_number"
                                        value={formData.bed_number}
                                        onChange={handleChange}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="input w-full"
                                    >
                                        <option value="stable">Stable</option>
                                        <option value="critical">Critical</option>
                                        <option value="watch">Under Watch</option>
                                        <option value="recovering">Recovering</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                Medical Notes / Diagnosis
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={3}
                                className="input w-full resize-none"
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800/50">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-ghost"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="edit-patient-form"
                        className="btn btn-primary flex items-center gap-2"
                        disabled={loading}
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
