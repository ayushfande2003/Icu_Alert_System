import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { motion } from 'framer-motion'
import { RefreshCw, Maximize2, Minimize2, Clock } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
)

const vitalConfig = {
  heartRate: {
    label: 'Heart Rate',
    unit: 'BPM',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    min: 40,
    max: 180,
    normal: { min: 60, max: 100 },
  },
  oxygen: {
    label: 'Oxygen Saturation',
    unit: '%',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    min: 80,
    max: 100,
    normal: { min: 95, max: 100 },
  },
  temperature: {
    label: 'Temperature',
    unit: '°F',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    min: 95,
    max: 105,
    normal: { min: 97.8, max: 99.1 },
    yAxisID: 'y1',
  },
  respiratoryRate: {
    label: 'Respiratory Rate',
    unit: '/min',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    min: 8,
    max: 40,
    normal: { min: 12, max: 20 },
  },
  bloodPressureSystolic: {
    label: 'BP Systolic',
    unit: 'mmHg',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    min: 60,
    max: 200,
    normal: { min: 90, max: 140 },
  },
  bloodPressureDiastolic: {
    label: 'BP Diastolic',
    unit: 'mmHg',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    min: 40,
    max: 120,
    normal: { min: 60, max: 90 },
  },
}

const DEFAULT_VITALS = ['heartRate', 'oxygen']

export default function VitalsChart({
  height = 280,
  showControls = true,
  showLegend = true,
  timeRange = '6h',
  onRangeChange,
  refreshInterval,
  data = null,
  selectedVitals = DEFAULT_VITALS,
  patientId,
  historyData = null,
}) {
  const { darkMode } = useTheme()
  const chartRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [chartData, setChartData] = useState(null)
  const [currentValues, setCurrentValues] = useState({})
  const [hoveredData, setHoveredData] = useState(null)

  // Map config keys to likely backend data keys
  const dataKeys = {
    heartRate: ['heartRate', 'heart_rate', 'bpm'],
    oxygen: ['oxygen', 'oxygen_saturation', 'spo2'],
    temperature: ['temperature', 'temp'],
    respiratoryRate: ['respiratoryRate', 'respiratory_rate', 'resp_rate'],
    bloodPressureSystolic: ['bloodPressureSystolic', 'blood_pressure_systolic', 'systolic'],
    bloodPressureDiastolic: ['bloodPressureDiastolic', 'blood_pressure_diastolic', 'diastolic'],
  }

  const getValue = (item, vital) => {
    const keys = dataKeys[vital] || [vital]
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null) return item[key]
    }
    return null
  }

  // Process provided history data
  const processHistoryData = useCallback(() => {
    if (!historyData || historyData.length === 0) return generateDemoData()

    // Sort by timestamp if needed, assume sorted for now
    // Create labels from timestamps
    const labels = historyData.map(item =>
      new Date(item.timestamp || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )

    const datasets = selectedVitals.map(vital => {
      const config = vitalConfig[vital]
      if (!config) return null // Skip if no config found

      const values = historyData.map(item => getValue(item, vital))

      return {
        label: config.label,
        data: values,
        borderColor: config.color,
        backgroundColor: config.bgColor,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: config.color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2,
      }
    }).filter(Boolean) // Remove nulls

    // Update current values
    const lastItem = historyData[historyData.length - 1]
    const current = {}
    selectedVitals.forEach(vital => {
      current[vital] = getValue(lastItem, vital)
    })
    setCurrentValues(current)

    return { labels, datasets }
  }, [historyData, selectedVitals])

  // Generate demo data if not provided
  const generateDemoData = useCallback(() => {
    const now = Date.now()
    const points = timeRange === '1h' ? 60 : timeRange === '6h' ? 72 : timeRange === '24h' ? 288 : 168
    const interval = timeRange === '1h' ? 60000 : timeRange === '6h' ? 300000 : timeRange === '24h' ? 300000 : 3600000

    const labels = []
    const datasetsObj = {}

    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now - i * interval)
      labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }

    selectedVitals.forEach((vital) => {
      const config = vitalConfig[vital]
      if (!config) return

      const data = labels.map(() => {
        const variation = (Math.random() - 0.5) * (config.max - config.min) * 0.1
        const baseValue = (config.normal.min + config.normal.max) / 2
        return Math.round((baseValue + variation) * 10) / 10
      })

      datasetsObj[vital] = {
        label: config.label,
        data,
        borderColor: config.color,
        backgroundColor: config.bgColor,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: config.color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2,
      }
    })

    // Set current values to last data point
    const current = {}
    selectedVitals.forEach((vital) => {
      if (datasetsObj[vital] && datasetsObj[vital].data) {
        current[vital] = datasetsObj[vital].data[datasetsObj[vital].data.length - 1]
      }
    })
    setCurrentValues(current)

    return { labels, datasets: Object.values(datasetsObj) }
  }, [timeRange, selectedVitals])

  useEffect(() => {
    try {
      console.log('VitalsChart useEffect running', { data, historyData, selectedVitals })

      if (data) {
        if (!data.datasets) {
          console.warn('VitalsChart: data provided but no datasets')
          return
        }

        // Ensure datasets is an array
        let datasets = []
        if (Array.isArray(data.datasets)) {
          datasets = data.datasets
        } else if (typeof data.datasets === 'object' && data.datasets !== null) {
          datasets = Object.values(data.datasets)
        }

        const formattedData = {
          ...data,
          datasets
        }
        setChartData(formattedData)

        if (data.currentValues) {
          setCurrentValues(data.currentValues)
        }
      } else if (historyData) {
        console.log('VitalsChart: processing history data', historyData.length)
        const processed = processHistoryData()
        console.log('VitalsChart: processed history data', processed)
        setChartData(processed)
      } else {
        console.log('VitalsChart: generating demo data')
        const demo = generateDemoData()
        console.log('VitalsChart: generated demo data', demo)
        setChartData(demo)
      }
    } catch (err) {
      console.error("Error generating chart data:", err)
      // Fallback to demo data on error to prevent UI crash
      setChartData(generateDemoData())
    }
  }, [data, historyData, generateDemoData, processHistoryData, selectedVitals])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: showLegend && selectedVitals.length <= 3,
        position: 'top',
        labels: {
          color: darkMode ? '#9ca3af' : '#4b5563',
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '500',
          },
        },
      },
      tooltip: {
        backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: darkMode ? '#f1f5f9' : '#1f2937',
        bodyColor: darkMode ? '#cbd5e1' : '#4b5563',
        borderColor: darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const config = vitalConfig[context.dataset.label] || {}
            return `${context.dataset.label}: ${context.parsed.y}${config.unit ? ` ${config.unit}` : ''}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
          },
          maxTicksLimit: 8,
        },
      },
      y: {
        position: 'left',
        grid: {
          color: darkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(229, 231, 235, 0.5)',
          drawBorder: false,
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
          },
        },
        title: {
          display: true,
          text: 'HR / SpO2',
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        min: 0,
        max: 200,
      },
      y1: {
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: darkMode ? '#9ca3af' : '#6b7280',
          font: {
            size: 10,
          },
          callback: function (value) {
            return `${value}°F`
          },
        },
        title: {
          display: true,
          text: 'Temp (°F)',
          color: darkMode ? '#9ca3af' : '#6b7280',
        },
        min: 90,
        max: 110,
      },
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  }

  const timeRanges = [
    { value: '1h', label: '1H' },
    { value: '6h', label: '6H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
  ]

  if (!chartData) {
    return (
      <div className="card p-5" style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <motion.div
              className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-surface-500 dark:text-surface-400">Loading chart...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className={`card overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}
      style={{ height: isFullscreen ? 'calc(100vh - 8rem)' : height }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Header */}
      {showControls && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-surface-100 dark:border-surface-700">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-surface-900 dark:text-white">
              Vitals Trends
            </h3>
            {patientId && (
              <span className="badge badge-info">{patientId}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex items-center bg-surface-100 dark:bg-surface-700 rounded-lg p-1">
              {timeRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => onRangeChange?.(range.value)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${timeRange === range.value
                    ? 'bg-white dark:bg-surface-600 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-surface-600 dark:text-surface-300 hover:text-surface-900 dark:hover:text-white'
                    }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChartData(generateDemoData())}
                className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Current Values */}
      {Object.keys(currentValues).length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-surface-100 dark:border-surface-700">
          {selectedVitals.map((vital) => {
            const config = vitalConfig[vital]
            const value = currentValues[vital]
            const isNormal =
              value >= config.normal.min && value <= config.normal.max

            return (
              <motion.div
                key={vital}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${isNormal
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  }`}
              >
                <span className="font-medium">{config.label}:</span>
                <span className="font-bold">
                  {value}
                  {config.unit}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Chart */}
      <div className="p-4" style={{ height: 'calc(100% - 140px)' }}>
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
    </motion.div>
  )
}

// Compact vitals chart for small spaces
export function CompactVitalsChart({ vital = 'heartRate', data, height = 80 }) {
  const { darkMode } = useTheme()
  const config = vitalConfig[vital]

  const chartData = {
    labels: data?.labels || Array.from({ length: 10 }, (_, i) => i.toString()),
    datasets: [
      {
        data: data?.data || Array.from({ length: 10 }, () =>
          Math.round((config.normal.min + config.normal.max) / 2 + (Math.random() - 0.5) * 10)
        ),
        borderColor: config.color,
        backgroundColor: config.bgColor,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false },
      y: {
        display: false,
        min: config.normal.min - (config.max - config.min) * 0.2,
        max: config.normal.max + (config.max - config.min) * 0.2,
      },
    },
    animation: {
      duration: 500,
    },
  }

  return (
    <div className="relative" style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

