import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Trash2, Edit2, Shield, Search, X } from 'lucide-react'
import { api } from '../../services/api'

export default function UserManagement({ onClose }) {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: 'nurse'
    })
    const [error, setError] = useState(null)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        try {
            setLoading(true)
            const { data } = await api.getUsers()
            setUsers(data)
        } catch (err) {
            console.error('Failed to load users:', err)
            setError('Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return

        try {
            await api.deleteUser(userId)
            setUsers(users.filter(u => u.id !== userId))
        } catch (err) {
            setError('Failed to delete user')
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const { data: newUser } = await api.createUser(formData)
            setUsers([...users, newUser])
            setShowAddModal(false)
            setFormData({ username: '', email: '', full_name: '', password: '', role: 'nurse' })
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create user')
        }
    }

    const isModal = !!onClose

    if (!isModal) {
        return (
            <div className="flex-1 flex flex-col h-full bg-surface-50 dark:bg-surface-900 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white">User Management</h2>
                            <p className="text-surface-500 dark:text-surface-400">Manage system access and roles</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 flex-1 overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-auto p-6">
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
                                <Shield className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        <div className="flex justify-between mb-6">
                            <div className="relative">
                                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="pl-10 input max-w-xs"
                                />
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add User
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-surface-200 dark:border-surface-700">
                                        <th className="p-4 font-semibold text-surface-600 dark:text-surface-400">User</th>
                                        <th className="p-4 font-semibold text-surface-600 dark:text-surface-400">Role</th>
                                        <th className="p-4 font-semibold text-surface-600 dark:text-surface-400">Status</th>
                                        <th className="p-4 font-semibold text-surface-600 dark:text-surface-400">Last Login</th>
                                        <th className="p-4 font-semibold text-surface-600 dark:text-surface-400 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" className="p-8 text-center text-surface-500">Loading users...</td></tr>
                                    ) : users.map(user => (
                                        <tr key={user.id} className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                                                        {user.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-surface-900 dark:text-white">{user.full_name}</p>
                                                        <p className="text-xs text-surface-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`badge ${user.role === 'admin' ? 'badge-primary' :
                                                    user.role === 'doctor' ? 'badge-success' : 'badge-info'
                                                    }`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`w-2 h-2 rounded-full inline-block mr-2 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </td>
                                            <td className="p-4 text-sm text-surface-500">
                                                {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Add User Modal - Always a modal */}
                {showAddModal && (
                    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white dark:bg-surface-800 p-6 rounded-2xl shadow-2xl w-full max-w-md"
                        >
                            <h3 className="text-lg font-bold mb-4 text-surface-900 dark:text-white">Add New User</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-surface-300">Full Name</label>
                                    <input
                                        required
                                        className="input w-full"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-surface-300">Username</label>
                                    <input
                                        required
                                        className="input w-full"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-surface-300">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="input w-full"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-surface-300">Password</label>
                                    <input
                                        required
                                        type="password"
                                        className="input w-full"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-surface-300">Role</label>
                                    <select
                                        className="input w-full"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="nurse">Nurse</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="admin">Admin</option>
                                        <option value="family">Family</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="btn btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-100 dark:border-surface-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white">User Management</h2>
                            <p className="text-sm text-surface-500 dark:text-surface-400">Manage system access and roles</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    <div className="flex justify-between mb-6">
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                            <input
                                type="text"
                                placeholder="Search users..."
                                className="pl-10 input max-w-xs"
                            />
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add User
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-surface-200 dark:border-surface-700">
                                    <th className="p-4 font-semibold text-surface-600 dark:text-surface-400">User</th>
                                    <th className="p-4 font-semibold text-surface-600 dark:text-surface-400">Role</th>
                                    <th className="p-4 font-semibold text-surface-600 dark:text-surface-400">Status</th>
                                    <th className="p-4 font-semibold text-surface-600 dark:text-surface-400">Last Login</th>
                                    <th className="p-4 font-semibold text-surface-600 dark:text-surface-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="5" className="p-8 text-center text-surface-500">Loading users...</td></tr>
                                ) : users.map(user => (
                                    <tr key={user.id} className="border-b border-surface-100 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                                                    {user.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-surface-900 dark:text-white">{user.full_name}</p>
                                                    <p className="text-xs text-surface-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`badge ${user.role === 'admin' ? 'badge-primary' :
                                                user.role === 'doctor' ? 'badge-success' : 'badge-info'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`w-2 h-2 rounded-full inline-block mr-2 ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                                            {user.is_active ? 'Active' : 'Inactive'}
                                        </td>
                                        <td className="p-4 text-sm text-surface-500">
                                            {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add User Modal */}
                {showAddModal && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white dark:bg-surface-800 p-6 rounded-2xl shadow-2xl w-full max-w-md"
                        >
                            <h3 className="text-lg font-bold mb-4 text-surface-900 dark:text-white">Add New User</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-surface-300">Full Name</label>
                                    <input
                                        required
                                        className="input w-full"
                                        value={formData.full_name}
                                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-surface-300">Username</label>
                                    <input
                                        required
                                        className="input w-full"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-surface-300">Email</label>
                                    <input
                                        required
                                        type="email"
                                        className="input w-full"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-surface-300">Password</label>
                                    <input
                                        required
                                        type="password"
                                        className="input w-full"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-surface-300">Role</label>
                                    <select
                                        className="input w-full"
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    >
                                        <option value="nurse">Nurse</option>
                                        <option value="doctor">Doctor</option>
                                        <option value="admin">Admin</option>
                                        <option value="family">Family</option>
                                    </select>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="btn btn-ghost"
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
