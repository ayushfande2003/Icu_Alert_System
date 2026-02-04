from flask import jsonify, request
import hashlib

# Demo user database (in real app, use proper database)
users = {
    'admin': {
        'password': 'admin123',
        'role': 'admin',
        'name': 'System Administrator',
        'permissions': ['manage_users', 'view_all_patients', 'system_settings']
    },
    'doctor': {
        'password': 'doctor123', 
        'role': 'doctor',
        'name': 'Dr. Sarah Wilson',
        'permissions': ['view_patients', 'manage_alerts', 'medical_records']
    },
    'nurse': {
        'password': 'nurse123',
        'role': 'nurse', 
        'name': 'Nurse Jane Smith',
        'permissions': ['view_patients', 'basic_monitoring', 'alert_acknowledge']
    },
    'family': {
        'password': 'family123',
        'role': 'family',
        'name': 'Family Member',
        'permissions': ['view_family_patient', 'basic_info']
    }
}

def authenticate_user(username, password):
    """Authenticate user and return user data if valid"""
    if username in users and users[username]['password'] == password:
        user_data = users[username].copy()
        # Remove password from returned data
        user_data.pop('password', None)
        user_data['username'] = username
        return user_data
    return None

def setup_auth_routes(app):
    """Setup authentication routes for the Flask app"""
    
    @app.route('/api/auth/login', methods=['POST'])
    def login():
        try:
            data = request.get_json()
            username = data.get('username', '').strip()
            password = data.get('password', '').strip()
            
            if not username or not password:
                return jsonify({
                    'success': False,
                    'message': 'Username and password are required'
                }), 400
            
            user = authenticate_user(username, password)
            
            if user:
                return jsonify({
                    'success': True,
                    'message': 'Login successful',
                    'user': user
                })
            else:
                return jsonify({
                    'success': False, 
                    'message': 'Invalid username or password'
                }), 401
                
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Login error: {str(e)}'
            }), 500
    
    @app.route('/api/auth/check', methods=['GET'])
    def check_auth():
        """Check if user is authenticated (simple demo)"""
        return jsonify({
            'success': True,
            'message': 'Auth check endpoint'
        })
    
    @app.route('/api/auth/logout', methods=['POST'])
    def logout():
        """Logout endpoint"""
        return jsonify({
            'success': True,
            'message': 'Logout successful'
        })