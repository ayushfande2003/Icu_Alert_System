// SafeSign Authentication - FastAPI JWT Version
const CONFIG = {
    BACKEND_URL: 'http://localhost:8000'
};

// Global state
let currentUser = null;
let accessToken = null;
let refreshToken = null;
let selectedRole = 'admin';
let tokenRefreshTimer = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Only run on login page (index.html)
    if (window.location.pathname.includes('index.html') ||
        window.location.pathname === '/' ||
        window.location.pathname.endsWith('/') ||
        !window.location.pathname.includes('-')) {
        initializeLoginPage();
    }
});

function initializeLoginPage() {
    console.log('SafeSign Login Page Initialized');
    setupEventListeners();

    // Auto-select admin role and fill credentials for demo
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    if (usernameInput && passwordInput) {
        usernameInput.value = 'admin';
        passwordInput.value = 'admin123';
    }
}

function setupEventListeners() {
    // Role selection buttons
    const roleButtons = document.querySelectorAll('.role-card');
    roleButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            // Remove active class from all buttons
            roleButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            selectedRole = this.dataset.role;

            // Auto-fill username based on role for demo
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');

            if (usernameInput && passwordInput) {
                usernameInput.value = selectedRole;
                passwordInput.value = selectedRole + '123';
            }
        });
    });

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const loginBtn = document.getElementById('loginBtn');
    const errorAlert = document.getElementById('errorAlert');

    // Hide previous errors
    errorAlert.style.display = 'none';

    // Show loading state
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="loading-spinner" style="display:inline-block"></span> Signing In...';

    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
            // Login successful - store tokens
            accessToken = data.access_token;
            refreshToken = data.refresh_token;
            currentUser = data.user;

            // Save tokens to localStorage
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            // Set up automatic token refresh
            setupTokenRefresh(data.expires_in);

            // Show success message
            showMessage('Login successful! Redirecting...', 'success');

            // Redirect to appropriate dashboard after short delay
            setTimeout(() => {
                redirectToDashboard(currentUser.role);
            }, 1000);

        } else {
            // Login failed
            showMessage(data.detail || 'Login failed', 'error');
        }

    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error: Could not connect to server', 'error');
    } finally {
        // Reset button state
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span class="loading-spinner"></span><span class="btn-text">Sign In Securely</span><i class="fas fa-arrow-right"></i>';
    }
}

function setupTokenRefresh(expiresIn) {
    // Refresh token 5 minutes before expiry
    const refreshTime = (expiresIn - 300) * 1000;

    if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
    }

    tokenRefreshTimer = setTimeout(async () => {
        await refreshAccessToken();
    }, Math.max(refreshTime, 60000)); // Minimum 1 minute
}

async function refreshAccessToken() {
    const currentRefreshToken = localStorage.getItem('refreshToken');

    if (!currentRefreshToken) {
        console.log('No refresh token available');
        return false;
    }

    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/api/auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh_token: currentRefreshToken })
        });

        const data = await response.json();

        if (response.ok && data.access_token) {
            accessToken = data.access_token;
            refreshToken = data.refresh_token || refreshToken;

            localStorage.setItem('accessToken', accessToken);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }

            // Update token refresh timer
            setupTokenRefresh(data.expires_in);

            console.log('Token refreshed successfully');
            return true;
        } else {
            // Refresh failed - force logout
            console.log('Token refresh failed');
            logout();
            return false;
        }

    } catch (error) {
        console.error('Token refresh error:', error);
        return false;
    }
}

function redirectToDashboard(role) {
    let dashboardPage;

    switch (role) {
        case 'admin':
            dashboardPage = 'admin-dashboard.html';
            break;
        case 'doctor':
            dashboardPage = 'doctor-dashboard.html';
            break;
        case 'nurse':
            dashboardPage = 'nurse-dashboard.html';
            break;
        case 'family':
            dashboardPage = 'family-dashboard.html';
            break;
        default:
            dashboardPage = 'family-dashboard.html';
    }

    console.log(`Redirecting to ${dashboardPage} for ${role}`);
    window.location.href = dashboardPage;
}

function showMessage(message, type) {
    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.textContent = message;
    errorAlert.className = `alert alert-${type}`;
    errorAlert.style.display = 'block';

    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            errorAlert.style.display = 'none';
        }, 3000);
    }
}

// Only use this in dashboard pages, not in login page
function checkAuthentication() {
    // Don't run on login page
    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/' || path.endsWith('/') || !path.includes('.html')) {
        return null;
    }

    const userJson = localStorage.getItem('currentUser');
    const token = localStorage.getItem('accessToken');

    if (!userJson || !token) {
        window.location.href = 'index.html';
        return null;
    }

    try {
        currentUser = JSON.parse(userJson);
        accessToken = token;
        refreshToken = localStorage.getItem('refreshToken');
        return currentUser;
    } catch (e) {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = 'index.html';
        return null;
    }
}

// Get access token for API calls
function getAccessToken() {
    return localStorage.getItem('accessToken');
}

// Get authorization header
function getAuthHeader() {
    const token = getAccessToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Check if user has required role
function hasRole(requiredRoles) {
    const user = checkAuthentication();
    if (!user) return false;

    if (typeof requiredRoles === 'string') {
        requiredRoles = [requiredRoles];
    }

    return requiredRoles.includes(user.role);
}

// Check if user has required permission
function hasPermission(permission) {
    const user = checkAuthentication();
    if (!user) return false;

    return user.permissions && user.permissions.includes(permission);
}

// Logout function (for dashboard pages)
function logout() {
    // Clear timers
    if (tokenRefreshTimer) {
        clearTimeout(tokenRefreshTimer);
    }

    // Clear storage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    currentUser = null;
    accessToken = null;
    refreshToken = null;

    window.location.href = 'index.html';
}

// API helper functions
async function apiGet(endpoint) {
    const response = await fetch(`${CONFIG.BACKEND_URL}${endpoint}`, {
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
        }
    });

    if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Retry request
            return apiGet(endpoint);
        }
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'API request failed');
    }

    return response.json();
}

async function apiPost(endpoint, data) {
    const response = await fetch(`${CONFIG.BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            ...getAuthHeader(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (response.status === 401) {
        // Try to refresh token
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            // Retry request
            return apiPost(endpoint, data);
        }
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'API request failed');
    }

    return response.json();
}
