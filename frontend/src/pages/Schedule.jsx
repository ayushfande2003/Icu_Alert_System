import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar as CalendarIcon, Clock, Plus, User } from 'lucide-react'
import { api } from '../services/api'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Schedule() {
    const [appointments, setAppointments] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [patients, setPatients] = useState([])
    const [formData, setFormData] = useState({
        patient_id: '',
        title: '',
        description: '',
        start_time: '',
        end_time: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [appointRes, patientsRes] = await Promise.all([
                api.getAppointments(),
                api.getPatients()
            ])
            setAppointments(Array.isArray(appointRes.data) ? appointRes.data : [])
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
            await api.createAppointment({
                ...formData,
                doctor_id: 1, // Mock doctor ID
                start_time: new Date(formData.start_time).toISOString(),
                end_time: new Date(formData.end_time).toISOString()
            })
            setShowModal(false)
            setFormData({ patient_id: '', title: '', description: '', start_time: '', end_time: '' })
            loadData()
        } catch (error) {
            console.error('Failed to create appointment:', error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Schedule</h1>
                    <p className="text-surface-500 dark:text-surface-400">Appointments and rounds</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Appointment
                </button>
            </div>

            <div className="card p-6">
                {loading ? (
                    <div className="flex justify-center p-12"><LoadingSpinner /></div>
                ) : appointments.length > 0 ? (
                    <div className="space-y-3">
                        {appointments.map((apt) => (
                            <motion.div
                                key={apt.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border border-surface-200 dark:border-surface-700 rounded-lg hover:border-primary-500 transition-colors"
                            >
                                <div className="flex flex-col items-center justify-center bg-surface-100 dark:bg-surface-800 p-3 rounded-lg min-w-[80px]">
                                    <span className="text-xs font-bold text-surface-500 uppercase">
                                        {new Date(apt.start_time).toLocaleString('default', { month: 'short' })}
                                    </span>
                                    <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                                        {new Date(apt.start_time).getDate()}
                                    </span>
                                    <span className="text-xs text-surface-500">
                                        {new Date(apt.start_time).toLocaleString('default', { weekday: 'short' })}
                                    </span>
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Clock className="w-3 h-3 text-surface-400" />
                                        <span className="text-sm text-surface-500">
                                            {new Date(apt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(apt.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-surface-900 dark:text-white text-lg">
                                        {apt.title}
                                    </h3>
                                    <p className="text-surface-500 text-sm">
                                        {apt.description}
                                    </p>
                                </div>

                                {apt.patient_id && (
                                    <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 px-3 py-1.5 rounded-full text-sm">
                                        <User className="w-3 h-3" />
                                        Patient #{apt.patient_id}
                                    </div>
                                )}

                                <div className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                        apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                            'bg-red-100 text-red-700'
                                    }`}>
                                    {apt.status}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-surface-500">No appointments scheduled.</div>
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
                            <h2 className="text-2xl font-bold mb-4 dark:text-white">New Appointment</h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="label">Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="input w-full"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Patient (Optional)</label>
                                    <select
                                        className="input w-full"
                                        value={formData.patient_id}
                                        onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                                    >
                                        <option value="">No Patient (General Block)</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.first_name} {p.last_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Start Time</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="input w-full"
                                            value={formData.start_time}
                                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">End Time</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="input w-full"
                                            value={formData.end_time}
                                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Description</label>
                                    <textarea
                                        className="input w-full h-20"
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
                                        Schedule
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
