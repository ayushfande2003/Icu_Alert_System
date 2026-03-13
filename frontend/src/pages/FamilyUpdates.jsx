import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Heart, User, Calendar, Bell, FileText, Activity } from 'lucide-react'

// Demo Data
const recentUpdates = [
    { id: 1, message: 'Vital signs are within normal range', time: '10 min ago', type: 'success', icon: Heart },
    { id: 2, message: 'Medication administered on schedule', time: '1 hour ago', type: 'info', icon: Clock },
    { id: 3, message: 'Doctor completed morning rounds', time: '2 hours ago', type: 'info', icon: User },
    { id: 4, message: 'Patient is comfortable and resting', time: '3 hours ago', type: 'success', icon: Calendar },
    { id: 5, message: 'Lunch served - Special Diet', time: '4 hours ago', type: 'info', icon: Activity },
    { id: 6, message: 'Lab results reviewed by Dr. Wilson', time: '5 hours ago', type: 'info', icon: FileText },
]

export default function FamilyUpdates() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
                    Updates & Alerts
                </h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Recent activity and notifications regarding your loved one
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card"
            >
                <div className="p-4 border-b border-surface-100 dark:border-surface-700">
                    <h2 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary-600" />
                        Timeline
                    </h2>
                </div>
                <div className="p-4">
                    <div className="relative border-l-2 border-surface-200 dark:border-surface-700 ml-4 space-y-8 my-4">
                        {recentUpdates.map((update, index) => (
                            <motion.div
                                key={update.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                className="relative pl-8"
                            >
                                {/* Timeline Dot */}
                                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-surface-800 ${update.type === 'success' ? 'bg-green-500' :
                                        update.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`} />

                                <div className={`p-4 rounded-xl ${update.type === 'success'
                                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800'
                                        : 'bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700'
                                    }`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${update.type === 'success'
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : 'bg-white dark:bg-surface-700'
                                            }`}>
                                            <update.icon className={`w-5 h-5 ${update.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-surface-600 dark:text-surface-300'
                                                }`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-surface-900 dark:text-white text-lg">{update.message}</p>
                                            <p className="text-sm text-surface-500 dark:text-surface-400 mt-1 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {update.time}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
