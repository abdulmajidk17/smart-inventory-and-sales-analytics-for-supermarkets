import os
import sys

# Check if instance directory exists
instance_dir = os.path.join(os.path.dirname(__file__), 'instance')
if not os.path.exists(instance_dir):
    os.makedirs(instance_dir)
    print(f"Created instance directory: {instance_dir}")

# Import and run the app
try:
    from app import app, db, User
    
    with app.app_context():
        db.create_all()
        
        # Create admin user if not exists
        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin', is_admin=True)
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Admin user created: username='admin', password='admin123'")
    
    print("\n" + "="*50)
    print("Backend server starting on http://127.0.0.1:5000")
    print("="*50 + "\n")
    
    app.run(debug=True, host='127.0.0.1', port=5000)
    
except Exception as e:
    print(f"Error starting backend: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
