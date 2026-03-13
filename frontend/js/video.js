// video.js - Handle real-time video streaming with MediaPipe landmarks
const socket = io({
    path: '/socket.io'
});

let videoContainer = null;
let videoCanvas = null;
let videoContext = null;
let emotionIndicator = null;
let frameCount = 0;

// Auto-start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
        initializeVideo();
    });
} else {
    // DOM is already loaded
    initializeVideo();
}

function initializeVideo() {
    // Get or create video container
    videoContainer = document.getElementById('video-container') || createVideoContainer();
    videoCanvas = document.getElementById('video-canvas');
    videoContext = videoCanvas.getContext('2d');
    emotionIndicator = document.getElementById('emotion-indicator');

    // Set canvas size
    videoCanvas.width = 640;
    videoCanvas.height = 480;

    console.log('✅ Video handler initialized');

    // Listen for video frames from backend
    socket.on('video_frame', function (data) {
        try {
            // Decode base64 frame
            const img = new Image();
            img.onload = function () {
                // Draw frame on canvas
                videoContext.drawImage(img, 0, 0, videoCanvas.width, videoCanvas.height);
                frameCount++;

                // Update frame counter
                const frameCountEl = document.getElementById('frame-count');
                if (frameCountEl) {
                    frameCountEl.textContent = `Frame: ${frameCount}`;
                }
            };
            img.src = 'data:image/jpeg;base64,' + data.frame;
        } catch (error) {
            console.error('❌ Error rendering frame:', error);
        }
    });

    // Listen for emotion updates
    socket.on('emotion_update', function (data) {
        updateEmotionIndicator(data.emotion);
    });

    // Listen for new alerts
    socket.on('new_alert', function (data) {
        console.log('🚨 Alert received:', data.alert);
        displayAlert(data.alert, data.timestamp);
    });

    // Listen for camera errors
    socket.on('camera_error', function (data) {
        console.error('📷 Camera error:', data.message);
        displayAlert('Camera Error: ' + data.message, new Date().toLocaleTimeString(), 'danger');
    });

    // Listen for camera started
    socket.on('camera_started', function (data) {
        console.log('✅ Camera started:', data.message);
        displayAlert('Camera monitoring started', new Date().toLocaleTimeString(), 'success');
    });

    // Listen for camera stopped
    socket.on('camera_stopped', function (data) {
        console.log('🛑 Camera stopped:', data.message);
        displayAlert('Camera monitoring stopped', new Date().toLocaleTimeString(), 'info');
    });
}

function createVideoContainer() {
    const container = document.createElement('div');
    container.id = 'video-container';
    container.style.cssText = `
        position: relative;
        width: 100%;
        max-width: 640px;
        margin: 20px auto;
        border: 2px solid #00ff00;
        border-radius: 8px;
        background: #000;
        box-shadow: 0 0 10px rgba(0,255,0,0.3);
    `;

    const canvas = document.createElement('canvas');
    canvas.id = 'video-canvas';
    canvas.width = 640;
    canvas.height = 480;
    canvas.style.cssText = `
        display: block;
        width: 100%;
        height: auto;
    `;

    const statusDiv = document.createElement('div');
    statusDiv.id = 'video-status';
    statusDiv.style.cssText = `
        position: absolute;
        bottom: 10px;
        left: 10px;
        background: rgba(0,0,0,0.7);
        color: #00ff00;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-family: monospace;
    `;
    statusDiv.innerHTML = '<span id="frame-count">Frame: 0</span>';

    container.appendChild(canvas);
    container.appendChild(statusDiv);

    const mainContent = document.querySelector('main') || document.body;
    mainContent.insertBefore(container, mainContent.firstChild);

    return container;
}

function updateEmotionIndicator(emotion) {
    if (!emotionIndicator) {
        emotionIndicator = createEmotionIndicator();
    }

    // Set color based on emotion
    const emotionColors = {
        'Pain': '#ff0000',
        'Sad': '#ff9900',
        'Neutral': '#00ff00',
        'Happy': '#00ff00'
    };

    const color = emotionColors[emotion] || '#00ff00';
    emotionIndicator.style.backgroundColor = color;
    emotionIndicator.textContent = emotion;
    emotionIndicator.title = `Detected emotion: ${emotion}`;
}

function createEmotionIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'emotion-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        background: #00ff00;
        color: #000;
        font-weight: bold;
        font-size: 14px;
        box-shadow: 0 0 20px rgba(0,255,0,0.5);
        z-index: 1000;
    `;
    indicator.textContent = 'Neutral';
    document.body.appendChild(indicator);
    return indicator;
}

function displayAlert(message, timestamp, type = 'info') {
    // Get or create alerts container
    let alertsContainer = document.getElementById('alerts-container');
    if (!alertsContainer) {
        alertsContainer = document.createElement('div');
        alertsContainer.id = 'alerts-container';
        alertsContainer.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            max-width: 400px;
            max-height: 500px;
            overflow-y: auto;
            z-index: 999;
        `;
        document.body.appendChild(alertsContainer);
    }

    // Create alert element
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${type}`;
    alertEl.style.cssText = `
        padding: 12px 16px;
        margin-bottom: 10px;
        border-radius: 4px;
        background: ${getAlertColor(type)};
        color: white;
        font-size: 13px;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    `;

    alertEl.innerHTML = `
        <div style="font-weight: bold;">${message}</div>
        <div style="font-size: 11px; opacity: 0.8; margin-top: 4px;">${timestamp}</div>
    `;

    alertsContainer.insertBefore(alertEl, alertsContainer.firstChild);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        alertEl.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => alertEl.remove(), 300);
    }, 5000);
}

function getAlertColor(type) {
    const colors = {
        'success': '#4CAF50',
        'info': '#2196F3',
        'warning': '#ff9800',
        'danger': '#f44336'
    };
    return colors[type] || colors['info'];
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Export functions for use in other scripts
window.videoHandler = {
    displayAlert,
    updateEmotionIndicator,
    getFrameCount: () => frameCount
};
