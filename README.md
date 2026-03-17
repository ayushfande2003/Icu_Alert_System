# SafeSign ICU Monitoring System

SafeSign is a production-ready Intensive Care Unit (ICU) patient monitoring system. It leverages real-time video streaming, computer vision, and automated alerting to assist healthcare professionals in monitoring patient status and vitals.

## 🚀 Key Features

- **Real-time Monitoring**: High-performance async API for patient data and system status.
- **AI-Powered Vision**: Eye blink detection and emotion recognition using MediaPipe.
- **Automated Alerts**: Instant notifications via Telegram and internal dashboard alerts.
- **Comprehensive Patient Management**: Track vitals, medical records, consultations, and nursing tasks.
- **Role-Based Access Control**: Secure JWT-based authentication for Admins, Doctors, Nurses, and Family.
- **Dynamic Analytics**: Real-time charts and system performance metrics.

## 🏗️ Architecture

The system follows a modern decoupled architecture:
- **Backend**: FastAPI (Python) provides a robust, asynchronous REST & WebSocket API.
- **Frontend**: React (Vite) offers a responsive, high-performance user interface.
- **Database**: PostgreSQL (via SQLAlchemy ORM) for persistent data storage.
- **Communication**: Socket.IO for real-time bi-directional messaging.

## 📚 External Libraries & Citations

SafeSign is built upon several powerful open-source libraries:

### Backend (Python)
- **[FastAPI](https://fastapi.tiangolo.com/)**: High-performance web framework for building APIs.
- **[SQLAlchemy](https://www.sqlalchemy.org/)**: SQL toolkit and Object Relational Mapper.
- **[MediaPipe](https://google.github.io/mediapipe/)**: Cross-platform, customizable ML solutions for live and streaming media.
- **[OpenCV](https://opencv.org/)**: Open Source Computer Vision Library.
- **[Socket.IO](https://socket.io/)**: Real-time, bidirectional, event-based communication.
- **[Pydantic](https://docs.pydantic.dev/)**: Data validation and settings management using Python type annotations.
- **[Python-Jose](https://github.com/mpdavis/python-jose)**: JavaScript Object Signing and Encryption implementation.
- **[Alembic](https://alembic.sqlalchemy.org/)**: Lightweight database migration tool for SQLAlchemy.

### Frontend (JavaScript/React)
- **[React](https://reactjs.org/)**: A JavaScript library for building user interfaces.
- **[Vite](https://vitejs.dev/)**: Next-generation frontend tooling.
- **[Tailwind CSS](https://tailwindcss.com/)**: A utility-first CSS framework.
- **[Lucide React](https://lucide.dev/)**: Beautiful & consistent icon toolkit.
- **[Chart.js](https://www.chartjs.org/)**: Simple yet flexible JavaScript charting for designers & developers.
- **[Framer Motion](https://www.framer.com/motion/)**: A production-ready motion library for React.
- **[Axios](https://axios-http.com/)**: Promise-based HTTP client for the browser and node.js.

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL Server

### Backend Setup
1. Navigate to the `backend` directory.
2. Install dependencies: `pip install -r requirements.txt`.
3. Configure `.env` (use `.env.example` as a template).
4. Run the server: `python main.py`.

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`.
3. Start the development server: `npm run dev`.

### Quick Start
You can use the provided batch file in the root directory to start the backend:
```bash
run_monitor.bat
```

## 👨‍💻 Authors
Developed by the SafeSign Development Team.

## 📄 License
This project is licensed under the MIT License.
