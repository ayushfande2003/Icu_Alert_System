import React from 'react'
import { motion } from 'framer-motion'
import {
  User, Heart, Activity, Clock, MapPin,
  MoreVertical, Phone, MessageSquare, AlertCircle,
  CheckCircle, XCircle, MinusCircle
} from 'lucide-react'

const statusConfig = {
  critical: {
    color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
    icon: AlertCircle,
    pulse: true,
    label: 'Critical',
  },
  warning: {
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: MinusCircle,
    pulse: false,
    label: 'Warning',
  },
  stable: {
    color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    border: 'border-green-200 dark:border-green-800',
    icon: CheckCircle,
    pulse: false,
    label: 'Stable',
  },
  recovering: {
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Activity,
    pulse: false,
    label: 'Recovering',
  },
  watch: {
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    border: 'border-orange-200 dark:border-orange-800',
    icon: Clock,
    pulse: true,
    label: 'Under Watch',
  },
  offline: {
    color: 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400',
    border: 'border-surface-200 dark:border-surface-600',
    icon: XCircle,
    pulse: false,
    label: 'Offline',
  },
}

export default function PatientCard({
  patient,
  onClick,
  onCall,
  onMessage,
  onEdit,
  compact = false,
  showVitals = true,
  loading = false,
}) {
  const config = statusConfig[patient?.status] || statusConfig.stable
  const StatusIcon = config.icon

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4"
      >
        <div className="flex items-start gap-4">
          <div className="skeleton w-12 h-12 rounded-full" />
          <div className="flex-1">
            <div className="skeleton h-5 w-32 mb-2" />
            <div className="skeleton h-4 w-24 mb-3" />
            <div className="flex gap-2">
              <div className="skeleton h-8 w-20" />
              <div className="skeleton h-8 w-20" />
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className={`
          p-4 rounded-xl border-2 cursor-pointer transition-all duration-300
          ${config.border} ${config.color}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-surface-800 flex items-center justify-center shadow-sm">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">
                {patient?.name || (patient?.first_name && patient?.last_name ? `${patient.first_name} ${patient.last_name}` : 'Unknown')}
              </p>
              <p className="text-xs opacity-75">{patient?.id || 'N/A'}</p>
            </div>
          </div>
          {config.pulse && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-3 h-3 rounded-full bg-red-500"
            />
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`
        card overflow-hidden cursor-pointer group
        ${config.border} ${config.border ? 'border-2' : ''}
      `}
    >
      {/* Header */}
      <div className={`p-4 ${config.color}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-surface-800 flex items-center justify-center shadow-md">
                <User className="w-6 h-6 text-surface-600 dark:text-surface-400" />
              </div>
              {config.pulse && (
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-red-500"
                  animate={{ scale: [1, 1.4], opacity: [1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>
            <div>
              <h3 className="font-bold text-surface-900 dark:text-white">
                {patient?.name || (patient?.first_name && patient?.last_name ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient')}
              </h3>
              <div className="flex items-center gap-1 text-sm opacity-75">
                <MapPin className="w-3 h-3" />
                <span>{patient?.room || patient?.id || 'Room N/A'}</span>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 dark:bg-surface-800/50 text-sm font-semibold`}>
            {config.pulse && (
              <motion.span
                className="w-2 h-2 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
            <StatusIcon className="w-4 h-4" />
            <span>{config.label}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Condition */}
        {patient?.condition && (
          <p className="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
            {patient.condition}
          </p>
        )}

        {/* Vitals */}
        {showVitals && (
          <div className="grid grid-cols-4 gap-2">
            <VitalPill
              icon={Heart}
              value={patient?.heartRate || '--'}
              unit="bpm"
              color="text-red-500"
            />
            <VitalPill
              icon={Activity}
              value={patient?.oxygen || '--'}
              unit="%"
              color="text-blue-500"
            />
            <VitalPill
              icon={Clock}
              value={patient?.temperature || '--'}
              unit="°F"
              color="text-orange-500"
            />
            <VitalPill
              icon={Activity}
              value={patient?.respRate || '--'}
              unit="/min"
              color="text-green-500"
            />
          </div>
        )}

        {/* Info Grid */}
        {(patient?.nurse || patient?.doctor) && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-100 dark:border-surface-700">
            {patient?.nurse && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-surface-600 dark:text-surface-400">{patient.nurse}</span>
              </div>
            )}
            {patient?.doctor && (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <User className="w-3 h-3 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-surface-600 dark:text-surface-400">{patient.doctor}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-3 border-t border-surface-100 dark:border-surface-700">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); onCall?.() }}
          className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white text-sm font-medium flex items-center justify-center gap-2"
        >
          <Phone className="w-4 h-4" />
          Call
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); onMessage?.() }}
          className="flex-1 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Message
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={(e) => { e.stopPropagation(); onEdit?.(patient) }}
          className="p-2 rounded-lg bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600 text-surface-600 dark:text-surface-300"
        >
          <MoreVertical className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  )
}

function VitalPill({ icon: Icon, value, unit, color }) {
  return (
    <div className="flex flex-col items-center p-2 rounded-lg bg-surface-50 dark:bg-surface-700/50">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-sm font-bold text-surface-900 dark:text-white">
        {value}
      </span>
      <span className="text-[10px] text-surface-500 dark:text-surface-400">{unit}</span>
    </div>
  )
}

export function PatientCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 bg-surface-100 dark:bg-surface-700">
        <div className="flex items-center gap-3">
          <div className="skeleton w-12 h-12 rounded-full" />
          <div>
            <div className="skeleton h-5 w-32 mb-1" />
            <div className="skeleton h-4 w-24" />
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-14 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex gap-2 p-3 border-t border-surface-100 dark:border-surface-700">
        <div className="skeleton h-10 rounded-lg flex-1" />
        <div className="skeleton h-10 rounded-lg flex-1" />
        <div className="skeleton h-10 rounded-lg w-10" />
      </div>
    </div>
  )
}

export function PatientList({ patients, onSelect, onEdit, compact }) {
  if (!patients || patients.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="w-16 h-16 text-surface-300 dark:text-surface-600 mx-auto mb-4" />
        <p className="text-surface-500 dark:text-surface-400">No patients found</p>
      </div>
    )
  }

  return (
    <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'}>
      {patients.map((patient, index) => (
        <motion.div
          key={patient.id || index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <PatientCard
            patient={patient}
            onClick={() => onSelect?.(patient)}
            onEdit={onEdit}
            compact={compact}
          />
        </motion.div>
      ))}
    </div>
  )
}

