import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, User, FileText, Activity } from 'lucide-react'
import { api } from '../services/api'

export default function AdmitPatientModal({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        patient_id: '',
        first_name: '',
        last_name: '',
        room_number: '',
        bed_number: '',
        gender: 'male',
        date_of_birth: '',
        status: 'stable',
        notes: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            // Basic validation
            if (!formData.patient_id || !formData.first_name || !formData.last_name || !formData.room_number) {
                throw new Error('Please fill in all required fields')
            }

            // Format date if present
            const payload = {
                ...formData,
                date_of_birth: formData.date_of_birth ? new Date(formData.date_of_birth).toISOString() : null
            }

            await api.createPatient(payload)
            onSuccess?.()
            onClose()
        } catch (err) {
            console.error('Failed to admit patient:', err)
            setError(err.response?.data?.detail || err.message || 'Failed to admit patient')
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
                        Admit New Patient
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

                    <form id="admit-patient-form" onSubmit={handleSubmit} className="space-y-6">
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
                                        placeholder="John"
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
                                        placeholder="Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                        Patient ID *
                                    </label>
                                    <input
                                        type="text"
                                        name="patient_id"
                                        value={formData.patient_id}
                                        onChange={handleChange}
                                        required
                                        className="input w-full"
                                        placeholder="ICU-XXX"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                        Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleChange}
                                        className="input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="input w-full"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
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
                                        placeholder="Room 101"
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
                                        placeholder="Bed A"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                        Initial Status
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
                                placeholder="Initial diagnosis, allergies, special requirements..."
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
                        form="admit-patient-form"
                        className="btn btn-primary flex items-center gap-2"
                        disabled={loading}
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Admitting...' : 'Admit Patient'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
