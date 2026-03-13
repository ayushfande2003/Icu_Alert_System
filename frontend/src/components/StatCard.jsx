import React from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Minus, 
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react'

const TrendIcon = ({ trend }) => {
  if (trend === 'up') return <TrendingUp className="w-4 h-4" />
  if (trend === 'down') return <TrendingDown className="w-4 h-4" />
  return <Minus className="w-4 h-4" />
}

const TrendArrow = ({ trend }) => {
  if (trend === 'up') return <ArrowUpRight className="w-4 h-4" />
  if (trend === 'down') return <ArrowDownRight className="w-4 h-4" />
  return <Minus className="w-4 h-4" />
}

export default function StatCard({
  title,
  value,
  unit,
  change,
  changeLabel,
  trend = 'neutral',
  icon: Icon,
  iconBg = 'from-blue-500 to-blue-600',
  iconColor = 'text-white',
  onClick,
  loading = false,
  delay = 0,
  className = ''
}) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    down: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    neutral: 'text-surface-600 dark:text-surface-400 bg-surface-100 dark:bg-surface-700',
    warning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
    success: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
  }

  const trendBgColors = {
    up: 'bg-green-100 dark:bg-green-900/30',
    down: 'bg-red-100 dark:bg-red-900/30',
    neutral: 'bg-surface-100 dark:bg-surface-700',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30',
    success: 'bg-green-100 dark:bg-green-900/30',
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={`card p-5 ${onClick ? 'cursor-pointer' : ''}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="skeleton h-4 w-24 mb-3" />
            <div className="skeleton h-8 w-20 mb-2" />
            <div className="skeleton h-4 w-16" />
          </div>
          <div className="skeleton w-12 h-12 rounded-xl" />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className={`
        card p-5 group cursor-pointer
        ${onClick ? 'hover:shadow-card-hover hover:border-primary-300 dark:hover:border-primary-600' : ''}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-surface-500 dark:text-surface-400 mb-1">
            {title}
          </p>
          
          <div className="flex items-baseline gap-1">
            <motion.p
              className="text-3xl font-bold text-surface-900 dark:text-white"
              initial={{ scale: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              {value}
            </motion.p>
            {unit && (
              <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
                {unit}
              </span>
            )}
          </div>

          {change && (
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium ${trendColors[trend]}`}>
                <TrendIcon trend={trend} />
                {change}
              </span>
              {changeLabel && (
                <span className="text-xs text-surface-500 dark:text-surface-400">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>

        {Icon && (
          <motion.div
            className={`
              w-12 h-12 rounded-xl bg-gradient-to-br ${iconBg} 
              flex items-center justify-center shadow-lg shadow-${iconBg.split(' ')[0]}/20
              group-hover:scale-110 group-hover:rotate-3 transition-all duration-300
            `}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export function MiniStatCard({
  title,
  value,
  icon: Icon,
  trend = 'neutral',
  className = ''
}) {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-surface-500',
    warning: 'text-yellow-500',
    success: 'text-green-500',
  }

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl bg-surface-50 dark:bg-surface-700/50 ${className}`}>
      {Icon && (
        <div className={`p-2 rounded-lg ${trendBgColors[trend]}`}>
          <Icon className={`w-4 h-4 ${trendColors[trend]}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-surface-500 dark:text-surface-400 truncate">
          {title}
        </p>
        <p className="text-sm font-semibold text-surface-900 dark:text-white">
          {value}
        </p>
      </div>
      <TrendArrow trend={trend} className={trendColors[trend]} />
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="skeleton h-4 w-24 mb-3" />
          <div className="skeleton h-8 w-20 mb-2" />
          <div className="skeleton h-4 w-16" />
        </div>
        <div className="skeleton w-12 h-12 rounded-xl" />
      </div>
    </div>
  )
}

export function StatsGrid({ children, columns = 4 }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
  }

  return (
    <div className={`grid ${gridCols[columns] || gridCols[4]} gap-4 lg:gap-6`}>
      {children}
    </div>
  )
}

