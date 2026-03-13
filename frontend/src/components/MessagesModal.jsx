import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, User, Mail, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function MessagesModal({ isOpen, onClose }) {
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
        if (isOpen) {
            if (activeTab === 'compose') {
                fetchUsers()
            } else {
                fetchMessages()
            }
        }
    }, [isOpen, activeTab])

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
            // Filter out self
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
            // Reset form and switch to sent tab
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

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="p-4 border-b border-surface-200 dark:border-surface-700 flex items-center justify-between bg-surface-50 dark:bg-surface-900/50">
                    <h2 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-primary-600" />
                        Messages
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-200 dark:hover:bg-surface-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-surface-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-surface-200 dark:border-surface-700">
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'inbox'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                            }`}
                    >
                        Inbox
                    </button>
                    <button
                        onClick={() => setActiveTab('sent')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'sent'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                            }`}
                    >
                        Sent
                    </button>
                    <button
                        onClick={() => setActiveTab('compose')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'compose'
                                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/10'
                                : 'text-surface-500 hover:text-surface-700 dark:hover:text-surface-300'
                            }`}
                    >
                        Compose
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-surface-50 dark:bg-surface-900/30">
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {activeTab === 'compose' ? (
                        <form onSubmit={handleSend} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Recipient
                                </label>
                                <select
                                    value={recipientId}
                                    onChange={(e) => setRecipientId(e.target.value)}
                                    className="w-full rounded-lg border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
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

                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Subject
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full rounded-lg border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
                                    placeholder="Message subject"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                                    Message
                                </label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    rows={6}
                                    className="w-full rounded-lg border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 py-2.5"
                                    placeholder="Type your message here..."
                                    required
                                />
                            </div>

                            <div className="flex justify-end pt-2">
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
                    ) : (
                        <div className="space-y-3">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-12 text-surface-500 dark:text-surface-400">
                                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No messages found</p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => handleMarkRead(message)}
                                        className={`p-4 rounded-xl border transition-all cursor-pointer group ${!message.is_read && activeTab === 'inbox'
                                                ? 'bg-white dark:bg-surface-800 border-primary-200 dark:border-primary-800 shadow-sm'
                                                : 'bg-surface-50 dark:bg-surface-800/50 border-transparent hover:bg-white dark:hover:bg-surface-800'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${activeTab === 'inbox'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                                        : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                                    }`}>
                                                    {activeTab === 'inbox'
                                                        ? (message.sender_name?.[0] || '?')
                                                        : 'Me'}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-sm text-surface-900 dark:text-white">
                                                        {activeTab === 'inbox' ? message.sender_name : 'To: ' + (message.recipient_name || 'Recipient')}
                                                    </p>
                                                    <p className="text-xs text-surface-500">
                                                        {new Date(message.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            {!message.is_read && activeTab === 'inbox' && (
                                                <span className="w-2.5 h-2.5 rounded-full bg-primary-500" />
                                            )}
                                        </div>
                                        {message.subject && (
                                            <p className="font-medium text-surface-800 dark:text-surface-100 mb-1">
                                                {message.subject}
                                            </p>
                                        )}
                                        <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2 group-hover:line-clamp-none transition-all">
                                            {message.body}
                                        </p>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
