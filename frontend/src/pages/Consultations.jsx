import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Search, Calendar, User, Activity } from 'lucide-react'
import { api } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Consultations() {
    const [consultations, setConsultations] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [patients, setPatients] = useState([])
    const [formData, setFormData] = useState({
        patient_id: '',
        notes: '',
        diagnosis: '',
        prescription: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [consultRes, patientsRes] = await Promise.all([
                api.getConsultations(),
                api.getPatients()
            ])
            setConsultations(Array.isArray(consultRes.data) ? consultRes.data : [])
            setPatients(Array.isArray(patientsRes.data) ? patientsRes.data : [])
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await api.createConsultation({
                ...formData,
                doctor_id: 1 // Mock doctor ID, typically from auth context
            })
            setShowModal(false)
            setFormData({ patient_id: '', notes: '', diagnosis: '', prescription: '' })
            loadData()
        } catch (error) {
            console.error('Failed to create consultation:', error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Consultations</h1>
                    <p className="text-surface-500 dark:text-surface-400">Manage patient check-ups and diagnoses</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Consultation
                </button>
            </div>

            <div className="card p-6">
                {loading ? (
                    <div className="flex justify-center p-12"><LoadingSpinner /></div>
                ) : consultations.length > 0 ? (
                    <div className="space-y-4">
                        {consultations.map((consult) => (
                            <motion.div
                                key={consult.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-full">
                                            <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-surface-900 dark:text-white">
                                                Patient ID: {consult.patient_id}
                                            </h3>
                                            <div className="text-sm text-surface-500 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(consult.consultation_date).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="px-2 py-1 bg-surface-100 dark:bg-surface-700 rounded text-xs font-medium">
                                        ID: #{consult.id}
                                    </span>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4 mt-4">
                                    <div className="bg-surface-50 dark:bg-surface-800/50 p-3 rounded">
                                        <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Diagnosis</span>
                                        <p className="text-surface-900 dark:text-gray-200 mt-1">{consult.diagnosis || 'Pending'}</p>
                                    </div>
                                    <div className="bg-surface-50 dark:bg-surface-800/50 p-3 rounded">
                                        <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Prescription</span>
                                        <p className="text-surface-900 dark:text-gray-200 mt-1">{consult.prescription || 'None'}</p>
                                    </div>
                                    <div className="bg-surface-50 dark:bg-surface-800/50 p-3 rounded">
                                        <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">Notes</span>
                                        <p className="text-surface-900 dark:text-gray-200 mt-1 line-clamp-2">{consult.notes}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-surface-500">No consultations found.</div>
                )}
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-surface-800 rounded-xl shadow-xl max-w-lg w-full p-6"
                        >
                            <h2 className="text-2xl font-bold mb-4 dark:text-white">New Consultation</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="label">Patient</label>
                                    <select
                                        required
                                        className="input w-full"
                                        value={formData.patient_id}
                                        onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                                    >
                                        <option value="">Select a patient</option>
                                        {patients.map(driver => (
                                            <option key={driver.id} value={driver.id}>
                                                {driver.first_name} {driver.last_name} (ID: {driver.patient_id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Diagnosis</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.diagnosis}
                                        onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Notes</label>
                                    <textarea
                                        required
                                        className="input w-full h-24"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Prescription</label>
                                    <textarea
                                        className="input w-full h-24"
                                        value={formData.prescription}
                                        onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="btn btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create Record
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
