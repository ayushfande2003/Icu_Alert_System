import React from 'react'
import { motion } from 'framer-motion'
import { Phone, MessageSquare, Clock, User, Shield, Video } from 'lucide-react'

// Demo Data
const staffMembers = [
    {
        id: 1,
        name: 'Dr. Sarah Wilson',
        role: 'Primary ICU Doctor',
        availability: 'Available',
        image: 'https://ui-avatars.com/api/?name=Sarah+Wilson&background=0D8ABC&color=fff',
        icon: User
    },
    {
        id: 2,
        name: 'Nurse Smith',
        role: 'Head Nurse - Shift A',
        availability: 'On Rounds',
        image: 'https://ui-avatars.com/api/?name=Nurse+Smith&background=10B981&color=fff',
        icon: Shield
    },
]

export default function ContactStaff() {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-3xl font-bold text-surface-900 dark:text-white">
                    Contact Staff
                </h1>
                <p className="text-surface-500 dark:text-surface-400 mt-1">
                    Reach out to the medical team caring for your loved one
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {staffMembers.map((staff, index) => (
                    <motion.div
                        key={staff.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        className="card overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex items-center gap-4">
                                <img
                                    src={staff.image}
                                    alt={staff.name}
                                    className="w-16 h-16 rounded-full border-2 border-surface-200 dark:border-surface-700"
                                />
                                <div>
                                    <h3 className="text-xl font-bold text-surface-900 dark:text-white">{staff.name}</h3>
                                    <p className="text-primary-600 dark:text-primary-400 font-medium">{staff.role}</p>
                                    <p className={`text-sm mt-1 flex items-center gap-1 ${staff.availability === 'Available'
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-yellow-600 dark:text-yellow-400'
                                        }`}>
                                        <span className={`w-2 h-2 rounded-full ${staff.availability === 'Available' ? 'bg-green-500' : 'bg-yellow-500'
                                            }`} />
                                        {staff.availability}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full p-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 flex items-center justify-center gap-2 font-medium border border-primary-100 dark:border-primary-800 transition-colors hover:bg-primary-100 dark:hover:bg-primary-900/30"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    Send Message
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full p-3 rounded-xl bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 flex items-center justify-center gap-2 font-medium border border-surface-200 dark:border-surface-700 transition-colors hover:bg-surface-100 dark:hover:bg-surface-700"
                                >
                                    <Phone className="w-5 h-5" />
                                    Request Call Back
                                </motion.button>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full p-3 rounded-xl bg-surface-50 dark:bg-surface-800 text-surface-700 dark:text-surface-300 flex items-center justify-center gap-2 font-medium border border-surface-200 dark:border-surface-700 transition-colors hover:bg-surface-100 dark:hover:bg-surface-700"
                                >
                                    <Video className="w-5 h-5" />
                                    Request Video Consultation
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card p-6 bg-surface-900 text-white mt-6"
            >
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                        <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Visiting Hours & Guidelines</h3>
                        <p className="text-surface-300 mt-1">
                            General visiting hours are from 10:00 AM to 8:00 PM daily.
                            Please limit visitors to 2 per patient at a time.
                        </p>
                        <button className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors">
                            View Full Policy
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
