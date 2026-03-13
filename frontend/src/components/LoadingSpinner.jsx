import React from 'react'
import { motion } from 'framer-motion'

export default function LoadingSpinner({ fullScreen = false, size = 'medium', text = 'Loading...' }) {
  const sizeClasses = {
    small: 'w-5 h-5 border-2',
    medium: 'w-10 h-10 border-3',
    large: 'w-16 h-16 border-4',
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <motion.div
        className={`${sizeClasses[size]} border-primary-200 border-t-primary-600 rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      {text && (
        <motion.p
          className="text-surface-500 dark:text-surface-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {text}
        </motion.p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <motion.div
        className="fixed inset-0 bg-white/80 dark:bg-surface-900/80 backdrop-blur-sm z-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            className={`${sizeClasses[size]} border-primary-200 border-t-primary-600 rounded-full`}
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          {text && (
            <motion.p
              className="text-surface-600 dark:text-surface-300 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {text}
            </motion.p>
          )}
        </div>
      </motion.div>
    )
  }

  return spinner
}

// Pulse loader animation
export function PulseLoader({ color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
  }

  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`w-3 h-3 rounded-full ${colors[color]}`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  )
}

// Dots loader
export function DotsLoader({ color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-500',
    white: 'bg-white',
  }

  return (
    <div className="flex items-center justify-center gap-1.5">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className={`w-2.5 h-2.5 rounded-full ${colors[color]}`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  )
}

// Circular progress loader
export function CircularProgress({ progress = 0, size = 60, strokeWidth = 4, color = 'primary' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  const colors = {
    primary: { base: 'stroke-primary-200', fill: 'stroke-primary-600' },
    success: { base: 'stroke-green-200', fill: 'stroke-green-500' },
    warning: { base: 'stroke-yellow-200', fill: 'stroke-yellow-500' },
    danger: { base: 'stroke-red-200', fill: 'stroke-red-500' },
  }

  const config = colors[color] || colors.primary

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className={`${config.base}`}
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          className={`${config.fill}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <span className="absolute text-sm font-semibold text-surface-600 dark:text-surface-300">
        {Math.round(progress)}%
      </span>
    </div>
  )
}

// Skeleton rectangle
export function SkeletonRect({ width = '100%', height = '20px', radius = '4px' }) {
  return (
    <motion.div
      className="bg-surface-200 dark:bg-surface-600 rounded"
      style={{ width, height }}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// Skeleton circle
export function SkeletonCircle({ size = '40px' }) {
  return (
    <motion.div
      className="bg-surface-200 dark:bg-surface-600 rounded-full"
      style={{ width: size, height: size }}
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// Full page loading screen
export function FullPageLoader({ text = 'Loading...' }) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-surface-900 flex flex-col items-center justify-center z-50">
      <motion.div
        className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.p
        className="mt-4 text-surface-600 dark:text-surface-300 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {text}
      </motion.p>
    </div>
  )
}

// Inline loading indicator
export function InlineLoader({ size = 'small', color = 'primary' }) {
  const sizes = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  }

  const colors = {
    primary: 'border-primary-200 border-t-primary-600',
    white: 'border-white/30 border-t-white',
  }

  return (
    <motion.div
      className={`${sizes[size]} ${colors[color] || colors.primary} border-2 rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  )
}

