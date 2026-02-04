const CONFIG = {
    BACKEND_URL: 'http://localhost:8000',
    SOCKET_URL: 'http://localhost:8000'
};

// Global state
let appState = {
    monitoring: false,
    patient: null,
    vitals: null,
    alerts: [],
    socket: null
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function () {
    initializeDashboard();
    setupEventListeners();
    loadInitialData();
});

function initializeDashboard() {
    console.log('Family Dashboard Initialized');

    // Check authentication
    const user = checkAuthentication();
    if (!user) return;

    // Display user info
    document.getElementById('userName').textContent = user.name || 'Family Member';

    // Initialize theme
    initTheme();
}

function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', logout);

    // Family feature buttons
    document.getElementById('sendMessageBtn').addEventListener('click', sendMessageToStaff);
    document.getElementById('requestUpdateBtn').addEventListener('click', requestPatientUpdate);

    // Notifications toggle
    document.getElementById('notificationsToggle').addEventListener('click', function () {
        this.classList.toggle('active');
    });
}

async function loadInitialData() {
    try {
        // Load patient data
        const patientResponse = await fetch(`${CONFIG.BACKEND_URL}/api/patient`);
        appState.patient = await patientResponse.json();
        updatePatientInfo();

        // Load vitals
        const vitalsResponse = await fetch(`${CONFIG.BACKEND_URL}/api/vitals`);
        appState.vitals = await vitalsResponse.json();
        updateVitalsDisplay();

        // Load alerts
        const alertsResponse = await fetch(`${CONFIG.BACKEND_URL}/api/alerts`);
        const alertsData = await alertsResponse.json();
        appState.alerts = alertsData.alerts;
        updateAlertsDisplay();

        console.log('All data loaded successfully');

    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error connecting to server', 'error');
    }
}

// Update UI functions
function updatePatientInfo() {
    if (appState.patient) {
        document.getElementById('patientName').textContent = appState.patient.name;
        document.getElementById('patientId').textContent = `#ICU-${appState.patient.id}`;
        document.getElementById('patientRoom').textContent = appState.patient.room;
        document.getElementById('patientStatus').textContent = appState.patient.status;
    }
}

function updateVitalsDisplay() {
    if (appState.vitals) {
        document.getElementById('heartRate').textContent = appState.vitals.heartRate;
        document.getElementById('oxygen').textContent = appState.vitals.oxygen;
        document.getElementById('temperature').textContent = appState.vitals.temperature;
        document.getElementById('respRate').textContent = appState.vitals.respiratoryRate;
    }
}

function updateAlertsDisplay() {
    const alertsContainer = document.getElementById('alertsContainer');
    alertsContainer.innerHTML = '';

    appState.alerts.forEach(alert => {
        const alertElement = document.createElement('div');
        alertElement.className = `alert-item ${alert.type === 'warning' ? 'new' : ''}`;
        alertElement.innerHTML = `
            <div class="alert-time">${alert.timestamp}</div>
            <div class="alert-message">${alert.message}</div>
        `;
        alertsContainer.appendChild(alertElement);
    });
}

// Family feature functions
function sendMessageToStaff() {
    showNotification('Message sent to nursing staff. They will respond shortly.', 'success');
}

function requestPatientUpdate() {
    showNotification('Update request sent. A nurse will contact you soon.', 'success');
}

// Theme functions
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.querySelector('#themeToggle i').className = 'fas fa-sun';
    }
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    const icon = document.querySelector('#themeToggle i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

// Utility functions
function showNotification(message, type = 'info') {
    alert(`${type.toUpperCase()}: ${message}`);
}

// Authentication check (from auth.js)
function checkAuthentication() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = 'index.html';
        return null;
    }

    try {
        return JSON.parse(userData);
    } catch (e) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
        return null;
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}