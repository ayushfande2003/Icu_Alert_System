import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Calendar, Filter, X } from 'lucide-react'
import { api } from '../../services/api'

export default function Reports({ onClose }) {
    const [reportType, setReportType] = useState('activity')
    const [days, setDays] = useState(7)
    const [loading, setLoading] = useState(false)
    const [downloadUrl, setDownloadUrl] = useState(null)

    const handleGenerate = async () => {
        try {
            setLoading(true)
            setDownloadUrl(null)
            setDownloadUrl(null)
            const { data } = await api.downloadReport({ report_type: reportType, days })

            // Simulate download link ready (in real app, this would be a blob or a real URL)
            setTimeout(() => {
                setDownloadUrl(data.download_url || '#')
            }, 1000)

        } catch (err) {
            console.error('Failed to generate report:', err)
        } finally {
            setLoading(false)
        }
    }

    const isModal = !!onClose

    if (!isModal) {
        return (
            <div className="flex-1 flex flex-col h-full bg-surface-50 dark:bg-surface-900 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-surface-900 dark:text-white">Generate Reports</h2>
                            <p className="text-surface-500 dark:text-surface-400">Export system data</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-sm border border-surface-200 dark:border-surface-700 p-6 space-y-6 max-w-3xl">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">Report Type</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {['activity', 'patients', 'alerts'].map(type => (
                                <div
                                    key={type}
                                    onClick={() => setReportType(type)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${reportType === type
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${reportType === type ? 'bg-primary-100 text-primary-600' : 'bg-surface-100 text-surface-500'
                                        }`}>
                                        {type === 'activity' && <Calendar className="w-4 h-4" />}
                                        {type === 'patients' && <FileText className="w-4 h-4" />}
                                        {type === 'alerts' && <Filter className="w-4 h-4" />}
                                    </div>
                                    <span className="capitalize font-medium text-surface-900 dark:text-white">{type} Report</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">Time Range</label>
                        <select
                            className="input w-full"
                            value={days}
                            onChange={e => setDays(e.target.value)}
                        >
                            <option value={1}>Last 24 Hours</option>
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                            <option value={90}>Last 3 Months</option>
                        </select>
                    </div>

                    {downloadUrl && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            Report generated successfully!
                        </div>
                    )}

                    <div className="pt-6 border-t border-surface-100 dark:border-surface-700 flex justify-end gap-3">
                        {!downloadUrl ? (
                            <button
                                onClick={handleGenerate}
                                disabled={loading}
                                className="btn btn-primary flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                {loading ? 'Generating...' : 'Generate Report'}
                            </button>
                        ) : (
                            <a
                                href={downloadUrl}
                                className="btn btn-success flex items-center gap-2"
                                download
                                onClick={onClose}
                            >
                                <Download className="w-4 h-4" />
                                Download Now
                            </a>
                        )}
                    </div>

                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-100 dark:border-surface-700">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-surface-900 dark:text-white">Generate Reports</h2>
                            <p className="text-sm text-surface-500 dark:text-surface-400">Export system data</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">

                    <div>
                        <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">Report Type</label>
                        <div className="grid grid-cols-1 gap-3">
                            {['activity', 'patients', 'alerts'].map(type => (
                                <div
                                    key={type}
                                    onClick={() => setReportType(type)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${reportType === type
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-surface-200 dark:border-surface-700 hover:bg-surface-50 dark:hover:bg-surface-700'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${reportType === type ? 'bg-primary-100 text-primary-600' : 'bg-surface-100 text-surface-500'
                                        }`}>
                                        {type === 'activity' && <Calendar className="w-4 h-4" />}
                                        {type === 'patients' && <FileText className="w-4 h-4" />}
                                        {type === 'alerts' && <Filter className="w-4 h-4" />}
                                    </div>
                                    <span className="capitalize font-medium text-surface-900 dark:text-white">{type} Report</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-surface-700 dark:text-surface-300">Time Range</label>
                        <select
                            className="input w-full"
                            value={days}
                            onChange={e => setDays(e.target.value)}
                        >
                            <option value={1}>Last 24 Hours</option>
                            <option value={7}>Last 7 Days</option>
                            <option value={30}>Last 30 Days</option>
                            <option value={90}>Last 3 Months</option>
                        </select>
                    </div>

                    {downloadUrl && (
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-xl flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            Report generated successfully!
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-6 border-t border-surface-100 dark:border-surface-700 flex justify-end gap-3">
                    <button onClick={onClose} className="btn btn-ghost">Cancel</button>
                    {!downloadUrl ? (
                        <button
                            onClick={handleGenerate}
                            disabled={loading}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            {loading ? 'Generating...' : 'Generate Report'}
                        </button>
                    ) : (
                        <a
                            href={downloadUrl}
                            className="btn btn-success flex items-center gap-2"
                            download
                            onClick={onClose}
                        >
                            <Download className="w-4 h-4" />
                            Download Now
                        </a>
                    )}

                </div>
            </motion.div>
        </div>
    )
}
