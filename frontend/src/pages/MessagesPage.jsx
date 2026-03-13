import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Mail, AlertCircle, Plus } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function MessagesPage() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('inbox') // 'inbox', 'sent', 'compose'
    const [messages, setMessages] = useState([])
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Compose state
    const [recipientId, setRecipientId] = useState('')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [sending, setSending] = useState(false)

    useEffect(() => {
        if (activeTab === 'compose') {
            fetchUsers()
        } else {
            fetchMessages()
        }
    }, [activeTab])

    const fetchMessages = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = activeTab === 'inbox'
                ? await api.getMessages()
                : await api.getSentMessages()
            setMessages(data)
        } catch (err) {
            console.error('Failed to fetch messages:', err)
            setError('Failed to load messages')
        } finally {
            setLoading(false)
        }
    }

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers()
            setUsers(data.filter(u => u.id !== user?.id))
        } catch (err) {
            console.error('Failed to fetch users:', err)
        }
    }

    const handleSend = async (e) => {
        e.preventDefault()
        if (!recipientId || !body) return

        setSending(true)
        try {
            await api.sendMessage({
                recipient_id: parseInt(recipientId),
                subject,
                body
            })
            setRecipientId('')
            setSubject('')
            setBody('')
            setActiveTab('sent')
        } catch (err) {
            console.error('Failed to send message:', err)
            setError('Failed to send message')
        } finally {
            setSending(false)
        }
    }

    const handleMarkRead = async (message) => {
        if (message.is_read || activeTab === 'sent') return

        try {
            await api.markMessageRead(message.id)
            setMessages(messages.map(m =>
                m.id === message.id ? { ...m, is_read: true } : m
            ))
        } catch (err) {
            console.error('Failed to mark as read:', err)
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
                    <Mail className="w-8 h-8 text-primary-600" />
                    Communications
                </h1>
                <button
                    onClick={() => setActiveTab('compose')}
                    className="btn btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Message
                </button>
            </motion.div>

            <div className="card">
                <div className="flex border-b border-surface-200 dark:border-surface-700">
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'inbox'
                            ? 'text-primary-600 border-primary-600'
                            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 border-transparent'
                            }`}
                    >
                        Inbox
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === 'sent'
                            ? 'text-primary-600 border-primary-600'
                            : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 border-transparent'
                            }`}
                    >
                        Sent
                    </button>
                    {activeTab === 'compose' && (
                        <button
                            className="px-6 py-4 text-sm font-medium transition-colors border-b-2 text-primary-600 border-primary-600"
                        >
                            Compose
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                        </div>
                    )}

                    {/* Content Area */}
                    {activeTab === 'compose' ? (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="max-w-3xl mx-auto"
                        >
                            <form onSubmit={handleSend} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                        Recipient
                                    </label>
                                    <select
                                        value={recipientId}
                                        onChange={(e) => setRecipientId(e.target.value)}
                                        className="input"
                                        required
                                    >
                                        <option value="">Select a user...</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.full_name} ({u.role})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                        Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="input"
                                        placeholder="Message subject"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                                        Message
                                    </label>
                                    <textarea
                                        value={body}
                                        onChange={(e) => setBody(e.target.value)}
                                        rows={8}
                                        className="input"
                                        placeholder="Type your message here..."
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('inbox')}
                                        className="btn btn-secondary"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="btn btn-primary flex items-center gap-2"
                                    >
                                        {sending ? 'Sending...' : 'Send Message'}
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                        >
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="w-16 h-16 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-8 h-8 text-surface-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-surface-900 dark:text-white">No messages found</h3>
                                    <p className="text-surface-500 dark:text-surface-400 mt-1">
                                        {activeTab === 'inbox' ? 'Your inbox is empty' : 'You haven\'t sent any messages yet'}
                                    </p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        onClick={() => handleMarkRead(message)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${!message.is_read && activeTab === 'inbox'
                                            ? 'bg-white dark:bg-surface-800 border-primary-200 dark:border-primary-800 shadow-sm ring-1 ring-primary-50 dark:ring-primary-900/10'
                                            : 'bg-surface-50 dark:bg-surface-800/50 border-transparent hover:bg-white dark:hover:bg-surface-800'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex items-start gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${activeTab === 'inbox'
                                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                    : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                    }`}>
                                                    {activeTab === 'inbox'
                                                        ? (message.sender_name?.[0] || '?')
                                                        : 'Me'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-surface-900 dark:text-white truncate">
                                                            {activeTab === 'inbox' ? message.sender_name : 'To: ' + (message.recipient_name || 'Recipient')}
                                                        </h4>
                                                        {!message.is_read && activeTab === 'inbox' && (
                                                            <span className="w-2 h-2 rounded-full bg-primary-500" />
                                                        )}
                                                    </div>
                                                    <p className="font-medium text-surface-700 dark:text-surface-200 mb-1">
                                                        {message.subject}
                                                    </p>
                                                    <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                                                        {message.body}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs text-surface-500 whitespace-nowrap">
                                                {new Date(message.timestamp).toLocaleDateString()}
                                                <br />
                                                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    )
}
