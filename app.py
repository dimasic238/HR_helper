from routes import app
from models import *

def create_tables():
    with app.app_context():
        db.create_all()
        
        # Создаем администратора
        admin = User.query.filter_by(mail=app.config['ADMIN_EMAIL']).first()
        if not admin:
            admin = User(
                role='admin',
                surname='Admin',
                name='System',
                mail=app.config['ADMIN_EMAIL'],
                phone='+10000000000',
                password=generate_password_hash(app.config['ADMIN_PASSWORD'])
            )
            db.session.add(admin)
            db.session.commit()
            print('Администратор создан!')

if __name__ == '__main__':
    create_tables()
    app.run(host='0.0.0.0', port=5000, debug=True)