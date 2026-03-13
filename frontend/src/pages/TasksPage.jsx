import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ClipboardList, Plus, Search, Calendar, CheckCircle,
    Clock, AlertCircle, X, Filter, User, ChevronRight
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function TasksPage() {
    const { user } = useAuth()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // 'all', 'pending', 'in-progress', 'completed'
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [users, setUsers] = useState([])
    const [patients, setPatients] = useState([])

    // Create Task Form State
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        assigned_to: '',
        patient_id: '',
        priority: 'medium',
        due_date: ''
    })

    useEffect(() => {
        fetchTasks()
        fetchMetadata()
    }, [filter])

    const fetchTasks = async () => {
        setLoading(true)
        try {
            const params = filter !== 'all' ? { status: filter } : {}
            const data = await api.getTasks(params)
            setTasks(data)
        } catch (err) {
            console.error('Failed to fetch tasks:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchMetadata = async () => {
        try {
            const [usersData, patientsData] = await Promise.all([
                api.getUsers(),
                api.getPatients()
            ])
            setUsers(usersData)
            setPatients(patientsData.patients || patientsData) // Handle pagination wrapper if present
        } catch (err) {
            console.error('Failed to fetch metadata:', err)
        }
    }

    const handleCreateTask = async (e) => {
        e.preventDefault()
        try {
            await api.createTask({
                ...newTask,
                assigned_to: parseInt(newTask.assigned_to),
                patient_id: newTask.patient_id ? parseInt(newTask.patient_id) : null,
                due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null
            })
            setShowCreateModal(false)
            fetchTasks()
            // Reset form
            setNewTask({
                title: '',
                description: '',
                assigned_to: '',
                patient_id: '',
                priority: 'medium',
                due_date: ''
            })
        } catch (err) {
            console.error('Failed to create task:', err)
        }
    }

    const handleStatusUpdate = async (taskId, newStatus) => {
        try {
            await api.updateTask(taskId, { status: newStatus })
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
        } catch (err) {
            console.error('Failed to update task:', err)
        }
    }

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            case 'medium': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
            case 'low': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            case 'in-progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
        }
    }

    return (
        <div className="space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white flex items-center gap-3">
                    <ClipboardList className="w-8 h-8 text-primary-600" />
                    Nursing Tasks
                </h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Task
                </button>
            </motion.div>

            <div className="card overflow-hidden">
                {/* Filters */}
                <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex gap-2 overflow-x-auto">
                    {['all', 'pending', 'in-progress', 'completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === f
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800'
                                }`}
                        >
                            {f.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </button>
                    ))}
                </div>

                {/* Task List */}
                <div className="divide-y divide-surface-200 dark:divide-surface-700">
                    {loading ? (
                        <div className="p-8 flex justify-center">
                            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="p-12 text-center text-surface-500">
                            <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No tasks found</p>
                            <p className="text-sm">Create a new task to get started</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group"
                            >
                                <div className="flex items-start gap-4">
                                    <button
                                        onClick={() => handleStatusUpdate(
                                            task.id,
                                            task.status === 'completed' ? 'pending' : 'completed'
                                        )}
                                        className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === 'completed'
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-surface-400 text-transparent hover:border-primary-500'
                                            }`}
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className={`font-semibold text-lg ${task.status === 'completed'
                                                        ? 'text-surface-500 line-through decoration-surface-400'
                                                        : 'text-surface-900 dark:text-white'
                                                    }`}>
                                                    {task.title}
                                                </h3>
                                                {task.description && (
                                                    <p className="text-surface-600 dark:text-surface-400 mt-1 text-sm">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                                                    {task.priority.toUpperCase()}
                                                </span>
                                                {task.due_date && (
                                                    <span className={`text-xs flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'completed'
                                                            ? 'text-red-600 dark:text-red-400 font-medium'
                                                            : 'text-surface-500'
                                                        }`}>
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(task.due_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center gap-4 text-sm text-surface-500">
                                            {task.patient_name && (
                                                <div className="flex items-center gap-1.5">
                                                    <User className="w-4 h-4" />
                                                    <span>Patient: {task.patient_name}</span>
                                                </div>
                                            )}
                                            {task.assignee_name && (
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-4 h-4 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-bold text-primary-700">
                                                        {task.assignee_name[0]}
                                                    </div>
                                                    <span>{task.assignee_name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* Create Task Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-surface-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
                        >
                            <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center bg-surface-50 dark:bg-surface-900/50">
                                <h2 className="text-lg font-bold text-surface-900 dark:text-white">Create New Task</h2>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="p-1 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-surface-500" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTask} className="p-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                        Task Title
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={newTask.title}
                                        onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                                        className="input w-full"
                                        placeholder="e.g., Check vitals"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={newTask.description}
                                        onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                                        className="input w-full"
                                        rows={3}
                                        placeholder="Additional details..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                            Assigned To
                                        </label>
                                        <select
                                            required
                                            value={newTask.assigned_to}
                                            onChange={e => setNewTask({ ...newTask, assigned_to: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="">Select Nurse/Doctor</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.full_name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                            Patient (Optional)
                                        </label>
                                        <select
                                            value={newTask.patient_id}
                                            onChange={e => setNewTask({ ...newTask, patient_id: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="">Select Patient</option>
                                            {patients.map(p => (
                                                <option key={p.id} value={p.id}>{p.full_name || p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                            Priority
                                        </label>
                                        <select
                                            value={newTask.priority}
                                            onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="input w-full"
                                        >
                                            <option value="low">Low</option>
                                            <option value="medium">Medium</option>
                                            <option value="high">High</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                            Due Date
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={newTask.due_date}
                                            onChange={e => setNewTask({ ...newTask, due_date: e.target.value })}
                                            className="input w-full"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="btn btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                    >
                                        Create Task
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
