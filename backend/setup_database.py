#!/usr/bin/env python3
"""
SafeSign ICU Monitoring System - Database Setup Script
=======================================================

This script initializes the PostgreSQL database for the ICU Monitoring System.
It performs the following checks and actions:

1. Validates PostgreSQL connection
2. Checks if the database exists, creates it if not
3. Checks if all required tables exist
4. Creates tables if they don't exist
5. Verifies successful setup

Usage:
    python backend/setup_database.py

Requirements:
    - PostgreSQL server running
    - psycopg2-binary installed
    - .env file with database credentials

Author: SafeSign Development Team
Version: 1.0.0
"""

import sys
import os
import time
from datetime import datetime
from contextlib import contextmanager

# Load environment variables from .env file
from dotenv import load_dotenv

# Get paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

# Load .env file from project root
env_path = os.path.join(PROJECT_ROOT, '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"✅ Loaded environment from: {env_path}")
else:
    print("⚠️ No .env file found, using system environment variables")

# Database imports
from sqlalchemy import (
    create_engine, text, inspect,
    Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func


# =============================================================================
# Define Models Directly (to avoid import issues)
# =============================================================================
Base = declarative_base()


class User(Base):
    """User model for authentication and authorization"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="nurse")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)


class Patient(Base):
    """Patient model for ICU monitoring"""
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    date_of_birth = Column(DateTime, nullable=True)
    gender = Column(String(20), nullable=True)
    room_number = Column(String(50), index=True, nullable=False)
    bed_number = Column(String(20), nullable=True)
    status = Column(String(20), default="stable")
    primary_doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    primary_nurse_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    family_contact_name = Column(String(100), nullable=True)
    family_contact_phone = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    admission_date = Column(DateTime(timezone=True), server_default=func.now())
    discharge_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now())


class Vitals(Base):
    """Patient vitals readings"""
    __tablename__ = "vitals"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    heart_rate = Column(Float, nullable=True)
    oxygen_saturation = Column(Float, nullable=True)
    temperature = Column(Float, nullable=True)
    respiratory_rate = Column(Float, nullable=True)
    blood_pressure_systolic = Column(Float, nullable=True)
    blood_pressure_diastolic = Column(Float, nullable=True)
    heart_rate_variability = Column(Float, nullable=True)
    movement_score = Column(Float, default=0.0)
    blink_rate = Column(Float, nullable=True)
    emotion_detected = Column(String(50), nullable=True)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Alert(Base):
    """Patient alerts and notifications"""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    alert_type = Column(String(20), default="info")
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(Integer, default=1)
    is_acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    telegram_notified = Column(Boolean, default=False)
    email_notified = Column(Boolean, default=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    """Audit log for tracking user actions"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SystemMetrics(Base):
    """System performance metrics"""
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    cpu_usage = Column(Float, nullable=True)
    memory_usage = Column(Float, nullable=True)
    disk_usage = Column(Float, nullable=True)
    network_latency = Column(Float, nullable=True)
    active_connections = Column(Integer, default=0)
    active_monitors = Column(Integer, default=0)
    alerts_generated = Column(Integer, default=0)
    frames_processed = Column(Integer, default=0)
    camera_status = Column(String(50), nullable=True)
    telegram_status = Column(String(50), nullable=True)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# =============================================================================
# Colors for terminal output
# =============================================================================
class Colors:
    """ANSI color codes for colored terminal output"""
    RESET = '\033[0m'
    BOLD = '\033[1m'
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'


def print_header(text: str) -> None:
    """Print a formatted header"""
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'=' * 60}{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}  {text}{Colors.RESET}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'=' * 60}{Colors.RESET}\n")


def print_step(step: str, status: str = "PENDING") -> None:
    """Print a step with status indicator"""
    status_colors = {
        "PENDING": Colors.YELLOW,
        "RUNNING": Colors.BLUE,
        "SUCCESS": Colors.GREEN,
        "ERROR": Colors.RED,
        "SKIP": Colors.CYAN
    }
    status_symbols = {
        "PENDING": "⏳",
        "RUNNING": "🔄",
        "SUCCESS": "✅",
        "ERROR": "❌",
        "SKIP": "⏭️"
    }
    color = status_colors.get(status, Colors.RESET)
    symbol = status_symbols.get(status, "•")
    print(f"  {symbol} {step:<40} [{color}{status}{Colors.RESET}]")


def get_database_url() -> str:
    """
    Get database URL from environment or build from components.
    
    Returns:
        str: PostgreSQL database URL
    """
    # First try full DATABASE_URL
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        # Build from components
        db_user = os.getenv("DB_USER", "postgres")
        db_password = os.getenv("DB_PASSWORD", "root")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME", "icu_alert_database")
        
        database_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    return database_url


def get_admin_engine():
    """
    Create engine for connecting to PostgreSQL server (not specific database).
    This is needed to create the database if it doesn't exist.
    
    Returns:
        SQLAlchemy engine connected to postgres database
    """
    db_user = os.getenv("DB_USER", "postgres")
    db_password = os.getenv("DB_PASSWORD", "root")
    db_host = os.getenv("DB_HOST", "localhost")
    db_port = os.getenv("DB_PORT", "5432")
    
    # Connect to default 'postgres' database
    admin_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/postgres"
    
    return create_engine(admin_url)


def check_postgres_connection(admin_engine) -> tuple[bool, str]:
    """
    Check if PostgreSQL server is accessible.
    
    Args:
        admin_engine: SQLAlchemy engine connected to postgres database
        
    Returns:
        tuple: (success: bool, message: str)
    """
    try:
        with admin_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True, "PostgreSQL server is accessible"
    except Exception as e:
        return False, f"Cannot connect to PostgreSQL server: {e}"


def get_database_name() -> str:
    """Get target database name from environment"""
    return os.getenv("DB_NAME", "icu_alert_database")


def check_database_exists(admin_engine, db_name: str) -> tuple[bool, str]:
    """
    Check if the target database exists.
    
    Args:
        admin_engine: SQLAlchemy engine
        db_name: Name of database to check
        
    Returns:
        tuple: (exists: bool, message: str)
    """
    try:
        with admin_engine.connect() as conn:
            result = conn.execute(
                text(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}'")
            )
            exists = result.fetchone() is not None
            
            if exists:
                return True, f"Database '{db_name}' exists"
            else:
                return False, f"Database '{db_name}' does not exist"
    except Exception as e:
        return False, f"Error checking database: {e}"


def create_database(admin_engine, db_name: str) -> tuple[bool, str]:
    """
    Create the target database if it doesn't exist.
    
    Args:
        admin_engine: SQLAlchemy engine
        db_name: Name of database to create
        
    Returns:
        tuple: (success: bool, message: str)
    """
    try:
        # Terminate existing connections to the database (if any)
        with admin_engine.connect() as conn:
            conn.execute(
                text(f"SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
                     f"WHERE datname = '{db_name}' AND pid <> pg_backend_pid()")
            )
            conn.commit()
        
        # Create database
        with admin_engine.connect() as conn:
            conn.execute(text(f"CREATE DATABASE {db_name}"))
            conn.commit()
        
        return True, f"Database '{db_name}' created successfully"
    except Exception as e:
        return False, f"Error creating database: {e}"


def get_required_tables() -> list:
    """
    Get list of all required tables in the database.
    
    Returns:
        list: Table names
    """
    return [
        "users",
        "patients",
        "vitals",
        "alerts",
        "audit_logs",
        "system_metrics"
    ]


def check_table_exists(engine, table_name: str) -> tuple[bool, str]:
    """
    Check if a specific table exists in the database.
    
    Args:
        engine: SQLAlchemy engine
        table_name: Name of table to check
        
    Returns:
        tuple: (exists: bool, message: str)
    """
    try:
        inspector = inspect(engine)
        exists = inspector.has_table(table_name)
        
        if exists:
            return True, f"Table '{table_name}' exists"
        else:
            return False, f"Table '{table_name}' does not exist"
    except Exception as e:
        return False, f"Error checking table '{table_name}': {e}"


def create_all_tables(engine) -> tuple[bool, str]:
    """
    Create all required tables in the database.
    
    Args:
        engine: SQLAlchemy engine connected to target database
        
    Returns:
        tuple: (success: bool, message: str)
    """
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        return True, "All tables created successfully"
    except Exception as e:
        return False, f"Error creating tables: {e}"


def verify_tables(engine) -> tuple[bool, list]:
    """
    Verify that all required tables exist in the database.
    
    Args:
        engine: SQLAlchemy engine connected to target database
        
    Returns:
        tuple: (all_exist: bool, missing_tables: list)
    """
    required_tables = get_required_tables()
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    missing = []
    for table in required_tables:
        if table not in existing_tables:
            missing.append(table)
    
    return len(missing) == 0, missing


def get_table_counts(engine) -> dict:
    """
    Get row counts for each table.
    
    Args:
        engine: SQLAlchemy engine
        
    Returns:
        dict: Table name to row count mapping
    """
    counts = {}
    required_tables = get_required_tables()
    
    try:
        inspector = inspect(engine)
        for table in required_tables:
            if inspector.has_table(table):
                with engine.connect() as conn:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.fetchone()[0]
                    counts[table] = count
            else:
                counts[table] = None
    except Exception as e:
        print(f"⚠️ Error getting table counts: {e}")
    
    return counts


def run_setup():
    """
    Main function to run the complete database setup process.
    
    Returns:
        bool: True if setup successful, False otherwise
    """
    start_time = datetime.now()
    
    print_header("🗄️  SafeSign ICU Database Setup")
    print(f"⏰ Started at: {start_time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Get configuration
    database_url = get_database_url()
    db_name = get_database_name()
    
    print(f"📋 Configuration:")
    print(f"   Database URL: {database_url[:50]}...")
    print(f"   Target Database: {db_name}")
    print()
    
    # Step 1: Check PostgreSQL connection
    print_step("Connecting to PostgreSQL server...", "RUNNING")
    admin_engine = get_admin_engine()
    
    connected, message = check_postgres_connection(admin_engine)
    if connected:
        print_step("Connecting to PostgreSQL server...", "SUCCESS")
        print(f"   {message}")
    else:
        print_step("Connecting to PostgreSQL server...", "ERROR")
        print(f"   {message}")
        return False
    
    # Step 2: Check if database exists
    print_step(f"Checking database '{db_name}'...", "RUNNING")
    
    db_exists, db_message = check_database_exists(admin_engine, db_name)
    if db_exists:
        print_step(f"Checking database '{db_name}'...", "SUCCESS")
        print(f"   {db_message}")
    else:
        print_step(f"Checking database '{db_name}'...", "SKIP")
        print(f"   {db_message}")
        
        # Step 3: Create database if it doesn't exist
        print_step(f"Creating database '{db_name}'...", "RUNNING")
        created, create_message = create_database(admin_engine, db_name)
        if created:
            print_step(f"Creating database '{db_name}'...", "SUCCESS")
            print(f"   {create_message}")
        else:
            print_step(f"Creating database '{db_name}'...", "ERROR")
            print(f"   {create_message}")
            return False
        
        # Give PostgreSQL a moment to finalize the database
        time.sleep(1)
    
    # Step 4: Connect to target database
    print_step("Connecting to target database...", "RUNNING")
    try:
        main_engine = create_engine(database_url)
        with main_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print_step("Connecting to target database...", "SUCCESS")
        print(f"   Connected to '{db_name}'")
    except Exception as e:
        print_step("Connecting to target database...", "ERROR")
        print(f"   {e}")
        return False
    
    # Step 5: Check required tables
    print_step("Checking required tables...", "RUNNING")
    required_tables = get_required_tables()
    print(f"   Required tables: {', '.join(required_tables)}")
    
    # Check each table
    missing_tables = []
    for table in required_tables:
        exists, table_message = check_table_exists(main_engine, table)
        if exists:
            print_step(f"  Table '{table}'", "SUCCESS")
        else:
            print_step(f"  Table '{table}'", "SKIP")
            missing_tables.append(table)
    
    if not missing_tables:
        print_step("Checking required tables...", "SUCCESS")
        print(f"   All required tables exist")
    else:
        print(f"   Missing tables: {', '.join(missing_tables)}")
        
        # Step 6: Create missing tables
        print_step("Creating missing tables...", "RUNNING")
        created, create_message = create_all_tables(main_engine)
        if created:
            print_step("Creating missing tables...", "SUCCESS")
            print(f"   {create_message}")
        else:
            print_step("Creating missing tables...", "ERROR")
            print(f"   {create_message}")
            return False
    
    # Step 7: Verify setup
    print_step("Verifying database setup...", "RUNNING")
    all_verified, missing = verify_tables(main_engine)
    if all_verified:
        print_step("Verifying database setup...", "SUCCESS")
    else:
        print_step("Verifying database setup...", "ERROR")
        print(f"   Missing tables: {missing}")
        return False
    
    # Step 8: Show table statistics
    print_step("Database setup complete!", "SUCCESS")
    
    print("\n" + "=" * 60)
    print(f"{Colors.GREEN}{Colors.BOLD}📊 Database Summary:{Colors.RESET}")
    print("=" * 60)
    
    counts = get_table_counts(main_engine)
    print(f"\n{'Table Name':<20} {'Records':>10}")
    print("-" * 32)
    for table in required_tables:
        count = counts.get(table, "N/A")
        count_str = f"{count:,}" if isinstance(count, int) else count
        print(f"{table:<20} {count_str:>10}")
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    print("\n" + "=" * 60)
    print(f"{Colors.GREEN}✅ Database setup completed successfully!{Colors.RESET}")
    print(f"⏱️  Total time: {duration:.2f} seconds")
    print(f"🕐 Completed at: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60 + "\n")
    
    return True


def main():
    """Entry point for the script"""
    try:
        success = run_setup()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}⚠️  Setup cancelled by user{Colors.RESET}")
        sys.exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}❌ Unexpected error: {e}{Colors.RESET}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

