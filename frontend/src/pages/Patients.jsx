import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Search, Filter, Plus } from 'lucide-react'
import { api } from '../services/api'
import { PatientList } from '../components/PatientCard'
import AdmitPatientModal from '../components/AdmitPatientModal'
import EditPatientModal from '../components/EditPatientModal'
import PatientDetailModal from '../components/PatientDetailModal'
import { AnimatePresence } from 'framer-motion'

export default function Patients() {
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [showAdmitModal, setShowAdmitModal] = useState(false)
    const [selectedPatient, setSelectedPatient] = useState(null)
    const [viewingPatient, setViewingPatient] = useState(null)

    useEffect(() => {
        loadPatients()
    }, [])

    const loadPatients = async () => {
        try {
            setLoading(true)
            const response = await api.getPatients({ limit: 100 })
            const data = response.data
            setPatients(Array.isArray(data) ? data : [])
        } catch (error) {
            console.error('Failed to load patients:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredPatients = patients.filter(patient => {
        const matchesSearch = patient.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            patient.patient_id?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFilter = filterStatus === 'all' || patient.status === filterStatus
        return matchesSearch && matchesFilter
    })

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-surface-900 dark:text-white">Patients</h1>
                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                        Manage and monitor patient records
                    </p>
                </div>
                <button
                    onClick={() => setShowAdmitModal(true)}
                    className="btn btn-primary"
                >
                    <Plus className="w-4 h-4" />
                    Admit Patient
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input pl-10 w-full"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                        {['all', 'critical', 'stable', 'watch', 'recovering'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === status
                                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="card p-6">
                {loading ? (
                    <div className="text-center py-12 text-surface-500">Loading patients...</div>
                ) : filteredPatients.length > 0 ? (
                    <PatientList
                        patients={filteredPatients}
                        onSelect={(p) => setViewingPatient(p)}
                        onEdit={(p) => setSelectedPatient(p)}
                    />
                ) : (
                    <div className="text-center py-12 text-surface-500">
                        No patients found matching your criteria.
                    </div>
                )}
            </div>
            {/* Modals */}
            <AnimatePresence>
                {showAdmitModal && (
                    <AdmitPatientModal
                        onClose={() => setShowAdmitModal(false)}
                        onSuccess={() => {
                            loadPatients()
                            setShowAdmitModal(false)
                        }}
                    />
                )}
                {selectedPatient && (
                    <EditPatientModal
                        patient={selectedPatient}
                        onClose={() => setSelectedPatient(null)}
                        onSuccess={() => {
                            loadPatients()
                            setSelectedPatient(null)
                        }}
                    />
                )}
                <AnimatePresence>
                    {viewingPatient && (
                        <PatientDetailModal
                            patient={viewingPatient}
                            onClose={() => setViewingPatient(null)}
                        />
                    )}
                </AnimatePresence>
            </AnimatePresence>
        </div>
    )
}
