import React from 'react'
import { motion } from 'framer-motion'

export function Skeleton({ className = '', variant = 'text', width, height }) {
  const baseClass = 'skeleton bg-surface-200 dark:bg-surface-600 animate-pulse rounded'
  
  const variants = {
    text: 'h-4',
    title: 'h-6',
    paragraph: 'h-4 w-3/4',
    avatar: 'rounded-full',
    button: 'h-10 rounded-xl',
    card: 'rounded-2xl',
    input: 'h-12 rounded-xl',
    image: 'rounded-xl',
    badge: 'h-6 w-20 rounded-full',
  }

  const style = {
    width: width || undefined,
    height: height || undefined,
  }

  return (
    <motion.div
      className={`${baseClass} ${variants[variant]} ${className}`}
      style={style}
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

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant={i === lines - 1 ? 'paragraph' : 'text'}
          className={i === lines - 1 ? 'w-2/3' : ''}
        />
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="avatar" className="w-12 h-12" />
          <div>
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton variant="badge" />
      </div>
      <SkeletonText lines={2} className="mb-4" />
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid border-t border-surface-100 dark:border-surface-700 pt-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ items = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton variant="avatar" className="w-10 h-10" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton variant="badge" className="w-16" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="w-12 h-12 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonVitals() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {['Heart Rate', 'Oxygen', 'Temperature', 'Resp Rate'].map((label) => (
        <div key={label} className="vital-card">
          <Skeleton variant="avatar" className="w-12 h-12 mx-auto mb-3" />
          <Skeleton className="h-8 w-16 mx-auto mb-1" />
          <Skeleton className="h-4 w-12 mx-auto" />
          <Skeleton className="h-3 w-20 mx-auto mt-2" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart({ height = 250 }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-2">
          {['1H', '6H', '24H', '7D'].map((period) => (
            <Skeleton key={period} className="h-8 w-12" />
          ))}
        </div>
      </div>
      <div style={{ height }}>
        <div className="w-full h-full flex items-end justify-between gap-1">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={i}
              className="flex-1 bg-surface-200 dark:bg-surface-600 rounded-t"
              style={{ height: `${20 + Math.random() * 60}%` }}
              animate={{ height: [null, `${20 + Math.random() * 60}%`] }}
              transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="card p-6">
      <div className="flex flex-col items-center">
        <Skeleton variant="avatar" className="w-24 h-24 mb-4" />
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="w-full grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
              <Skeleton className="h-3 w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Shimmer effect for skeleton
export function Shimmer({ children, active = true }) {
  if (!active) return children

  return (
    <div className="relative overflow-hidden">
      <div className="relative z-10">{children}</div>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
        }}
      />
    </div>
  )
}

