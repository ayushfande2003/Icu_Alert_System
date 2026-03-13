import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { 
  Activity, Shield, User, Users, Heart, 
  Lock, Mail, ArrowRight, Sparkles, CheckCircle 
} from 'lucide-react'

const roles = [
  { id: 'admin', label: 'Admin', icon: Shield, description: 'System Management', color: 'from-violet-600 to-indigo-600' },
  { id: 'doctor', label: 'Doctor', icon: User, description: 'Medical Staff', color: 'from-emerald-600 to-teal-600' },
  { id: 'nurse', label: 'Nurse', icon: Heart, description: 'Nursing Staff', color: 'from-blue-600 to-cyan-600' },
  { id: 'family', label: 'Family', icon: Users, description: 'Family Access', color: 'from-amber-500 to-orange-500' },
]

export default function Login() {
  const navigate = useNavigate()
  const { login, loading, error } = useAuth()
  const [selectedRole, setSelectedRole] = useState('admin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    // Auto-fill demo credentials based on selected role
    const credentials = {
      admin: { username: 'admin', password: 'admin123' },
      doctor: { username: 'doctor', password: 'doctor123' },
      nurse: { username: 'nurse', password: 'nurse123' },
      family: { username: 'family', password: 'family123' },
    }
    setUsername(credentials[selectedRole].username)
    setPassword(credentials[selectedRole].password)
  }, [selectedRole])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')

    const result = await login(username, password)
    if (result.success) {
      navigate(`/${result.user.role}-dashboard`)
    } else {
      setLoginError(result.error || 'Invalid credentials')
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  }

  const features = [
    'Real-time patient monitoring',
    'AI-powered emotion detection',
    'Secure video communication',
    'Instant alerts & notifications',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-900 via-primary-900 to-surface-900 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 via-purple-600/20 to-surface-900" />
          <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-r from-blue-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-l from-purple-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4"
          >
            <motion.div
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center shadow-2xl shadow-primary-500/30"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Activity className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold">SafeSign</h1>
              <p className="text-primary-300">ICU Monitoring</p>
            </div>
          </motion.div>

          {/* Center Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-1 flex flex-col justify-center"
          >
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Advanced Patient<br />
              <span className="text-gradient-primary">Monitoring System</span>
            </h2>
            <p className="text-xl text-surface-300 mb-8 max-w-md">
              Real-time AI-powered monitoring with emotion detection, pose estimation, and instant alerts for better patient care.
            </p>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-surface-200">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-surface-400 text-sm"
          >
            © 2024 SafeSign ICU Monitoring. All rights reserved.
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Mobile Logo */}
          <motion.div variants={itemVariants} className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <motion.div
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-purple-500 flex items-center justify-center shadow-xl"
              whileHover={{ scale: 1.05 }}
            >
              <Activity className="w-7 h-7 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white">
              SafeSign <span className="text-primary-400">ICU</span>
            </h1>
          </motion.div>

          {/* Login Card */}
          <motion.div
            variants={itemVariants}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl"
          >
            <motion.div variants={itemVariants} className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-surface-400">Sign in to access your dashboard</p>
            </motion.div>

            {/* Role Selection */}
            <motion.div variants={itemVariants} className="mb-6">
              <label className="block text-sm font-medium text-surface-300 mb-3">Select Your Role</label>
              <div className="grid grid-cols-4 gap-2">
                {roles.map((role) => (
                  <motion.button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-300 ${
                      selectedRole === role.id
                        ? `border-transparent bg-gradient-to-br ${role.color} text-white shadow-lg`
                        : 'border-white/10 text-surface-400 hover:border-white/30 hover:bg-white/5'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`p-2 rounded-xl mb-2 ${
                      selectedRole === role.id 
                        ? 'bg-white/20' 
                        : 'bg-surface-100 dark:bg-surface-700'
                    }`}>
                      <role.icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold">{role.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-surface-300 mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-surface-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </motion.div>

              {(loginError || error) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm"
                >
                  {loginError || error}
                </motion.div>
              )}

              <motion.button
                variants={itemVariants}
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold text-lg shadow-lg shadow-primary-500/30 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <motion.div
                    className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Demo Credentials */}
          <motion.div
            variants={itemVariants}
            className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-2 mb-3 text-surface-300">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Demo Credentials</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <span className="text-violet-300">Admin</span>
                </div>
                <span className="text-surface-400 font-mono">admin123</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-300">Doctor</span>
                </div>
                <span className="text-surface-400 font-mono">doctor123</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-blue-300">Nurse</span>
                </div>
                <span className="text-surface-400 font-mono">nurse123</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-amber-300">Family</span>
                </div>
                <span className="text-surface-400 font-mono">family123</span>
              </div>
            </div>
          </motion.div>

          {/* Footer for mobile */}
          <motion.p variants={itemVariants} className="mt-6 text-center text-surface-500 text-sm lg:hidden">
            © 2024 SafeSign ICU Monitoring. All rights reserved.
          </motion.p>
        </motion.div>
      </div>
    </div>
  )
}

