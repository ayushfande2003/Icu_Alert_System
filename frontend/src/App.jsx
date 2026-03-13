import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'

// Pages
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import DoctorDashboard from './pages/DoctorDashboard'
import NurseDashboard from './pages/NurseDashboard'
import FamilyDashboard from './pages/FamilyDashboard'
import FamilyLiveMonitor from './pages/FamilyLiveMonitor'
import FamilyUpdates from './pages/FamilyUpdates'
import ContactStaff from './pages/ContactStaff'

// Components
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import PlaceholderPage from './components/PlaceholderPage'
import Patients from './pages/Patients'
import Consultations from './pages/Consultations'
import MedicalRecords from './pages/MedicalRecords'
import Schedule from './pages/Schedule'
import VitalsMonitoring from './pages/VitalsMonitoring'
import UserManagement from './components/admin/UserManagement'
import SystemSettings from './components/admin/SystemSettings'
import Reports from './components/admin/Reports'
import MessagesPage from './pages/MessagesPage'
import AlertsPage from './pages/AlertsPage'
import TasksPage from './pages/TasksPage'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return <LoadingSpinner fullScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}-dashboard`} replace />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={`/${user.role}-dashboard`} replace /> : <Login />}
      />

      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <SocketProvider>
            <Layout />
          </SocketProvider>
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="system" element={<SystemSettings />} />
        <Route path="analytics" element={<Reports />} />
        <Route path="settings" element={<SystemSettings />} /> {/* Settings and System might be same? */}
      </Route>

      {/* Doctor Routes */}
      <Route path="/doctor-dashboard" element={
        <ProtectedRoute allowedRoles={['doctor', 'admin']}>
          <SocketProvider>
            <Layout />
          </SocketProvider>
        </ProtectedRoute>
      }>
        <Route index element={<DoctorDashboard />} />
        <Route path="patients" element={<Patients />} /> {/* Reusing Patients page */}
        <Route path="consultations" element={<Consultations />} />
        <Route path="vitals" element={<VitalsMonitoring />} />
        <Route path="records" element={<MedicalRecords />} />
        <Route path="schedule" element={<Schedule />} />
      </Route>

      {/* Nurse Routes */}
      <Route path="/nurse-dashboard" element={
        <ProtectedRoute allowedRoles={['nurse', 'admin']}>
          <SocketProvider>
            <Layout />
          </SocketProvider>
        </ProtectedRoute>
      }>
        <Route index element={<NurseDashboard />} />
        <Route path="patients" element={<Patients />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="vitals" element={<VitalsMonitoring />} />
        <Route path="vitals" element={<VitalsMonitoring />} />
        <Route path="alerts" element={<AlertsPage />} />
        <Route path="communications" element={<MessagesPage />} />
      </Route>

      {/* Family Routes */}
      <Route path="/family-dashboard" element={
        <ProtectedRoute allowedRoles={['family']}>
          <SocketProvider>
            <Layout />
          </SocketProvider>
        </ProtectedRoute>
      }>
        <Route index element={<FamilyDashboard />} />
        <Route path="vitals" element={<VitalsMonitoring />} />
        <Route path="monitor" element={<FamilyLiveMonitor />} />
        <Route path="alerts" element={<FamilyUpdates />} />
        <Route path="contact" element={<ContactStaff />} />
      </Route>

      <Route path="/" element={
        user ? (
          <Navigate to={`/${user.role}-dashboard`} replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      {/*
        React Router v7 Future Flags
        These flags opt-in to React Router v7 behavior early:
        - v7_startTransition: Wraps state updates in React.startTransition
        - v7_relativeSplatPath: Changes relative route resolution within splat routes
        See: https://reactrouter.com/upgrading/future
      */}
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App

