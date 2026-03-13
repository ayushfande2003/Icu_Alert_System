import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, Upload, Link as LinkIcon, Calendar } from 'lucide-react'
import { api } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function MedicalRecords() {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [patients, setPatients] = useState([])
    const [formData, setFormData] = useState({
        patient_id: '',
        record_type: 'Lab Report',
        file_url: '',
        description: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [recordsRes, patientsRes] = await Promise.all([
                api.getMedicalRecords(),
                api.getPatients()
            ])
            setRecords(Array.isArray(recordsRes.data) ? recordsRes.data : [])
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
            await api.createMedicalRecord({
                ...formData,
                uploaded_by: 1 // Mock user ID
            })
            setShowModal(false)
            setFormData({ patient_id: '', record_type: 'Lab Report', file_url: '', description: '' })
            loadData()
        } catch (error) {
            console.error('Failed to create record:', error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Medical Records</h1>
                    <p className="text-surface-500 dark:text-surface-400">Digital archive of patient documents</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Record
                </button>
            </div>

            <div className="card p-6">
                {loading ? (
                    <div className="flex justify-center p-12"><LoadingSpinner /></div>
                ) : records.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {records.map((record) => (
                            <motion.div
                                key={record.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-5 border border-surface-200 dark:border-surface-700 rounded-xl hover:shadow-lg transition-shadow bg-surface-50/50 dark:bg-surface-800/30"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-lg ${record.record_type === 'Lab Report' ? 'bg-blue-100 text-blue-600' :
                                            record.record_type === 'X-Ray' ? 'bg-purple-100 text-purple-600' :
                                                'bg-green-100 text-green-600'
                                        }`}>
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs text-surface-400">
                                        {new Date(record.date_recorded).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className="font-semibold text-lg text-surface-900 dark:text-white mb-1">
                                    {record.record_type}
                                </h3>
                                <p className="text-sm text-surface-500 mb-4 line-clamp-2">
                                    {record.description}
                                </p>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-surface-600 dark:text-surface-300">
                                        Patient ID: {record.patient_id}
                                    </span>
                                    <a
                                        href={record.file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1 text-primary-600 hover:underline"
                                    >
                                        <LinkIcon className="w-3 h-3" /> View
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-surface-500">No records found.</div>
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
                            <h2 className="text-2xl font-bold mb-4 dark:text-white">Upload Medical Record</h2>
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
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.first_name} {p.last_name} (ID: {p.patient_id})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Record Type</label>
                                    <select
                                        className="input w-full"
                                        value={formData.record_type}
                                        onChange={(e) => setFormData({ ...formData, record_type: e.target.value })}
                                    >
                                        <option value="Lab Report">Lab Report</option>
                                        <option value="X-Ray">X-Ray</option>
                                        <option value="Prescription">Prescription</option>
                                        <option value="Discharge Summary">Discharge Summary</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">File URL</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="https://..."
                                        className="input w-full"
                                        value={formData.file_url}
                                        onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                                    />
                                    <p className="text-xs text-surface-400 mt-1">In a real app, this would be a file uploader.</p>
                                </div>
                                <div>
                                    <label className="label">Description</label>
                                    <textarea
                                        className="input w-full h-24"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                                        Upload
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
