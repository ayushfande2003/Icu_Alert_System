import React from 'react'
import { Construction } from 'lucide-react'

export default function PlaceholderPage({ title }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
                <Construction className="w-8 h-8 text-primary-500" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{title}</h1>
                <p className="text-surface-500 dark:text-surface-400 mt-2">
                    This page is currently under construction.
                </p>
            </div>
        </div>
    )
}
