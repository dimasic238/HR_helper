from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import re
from datetime import datetime, timezone
from flask import jsonify
app = Flask(__name__)
import base64
from datetime import datetime

# Конфигурация приложения
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:1234@localhost/postgres'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'static/uploads'
app.config['ADMIN_EMAIL'] = 'admin@example.com'
app.config['ADMIN_PASSWORD'] = '123456'

# Инициализация базы данных
db = SQLAlchemy(app)

# Модели данных (соответствуют вашей схеме БД)
class User(db.Model):
    __tablename__ = 'Users'  
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(255))
    surname = db.Column(db.String(255))
    name = db.Column(db.String(255))
    patronymic = db.Column(db.String(255))
    password = db.Column(db.String(255))
    phone = db.Column(db.String(255))
    mail = db.Column(db.String(255), unique=True)
    image = db.Column(db.String(255))

    def __repr__(self):
        return f'<User {self.mail}>'
    
class OfficeMap(db.Model):
    __tablename__ = 'office_map'
    id = db.Column(db.Integer, primary_key=True)
    hr_id = db.Column(db.Integer, db.ForeignKey('HR.id'))  
    name = db.Column(db.String(255), nullable=False)
    image_data = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Явное определение связи
    hr = db.relationship('HR', backref='maps')

class HR(db.Model):
    __tablename__ = 'HR'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.id'), unique=True, nullable=False)
    department = db.Column(db.String(255))
    
    # Связи
    user = db.relationship('User', backref=db.backref('hr_profile', uselist=False))
    tests = db.relationship('Test', back_populates='hr', cascade='all, delete-orphan')
    candidates = db.relationship('Candidate', back_populates='hr')
    assigned_tests = db.relationship('TestAssignment', back_populates='assigned_by_hr')
    
    def __repr__(self):
        return f'<HR {self.id}>'
    

class MapAccess(db.Model):
    __tablename__ = 'map_access'
    id = db.Column(db.Integer, primary_key=True)
    map_id = db.Column(db.Integer, db.ForeignKey('office_map.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.id', ondelete='CASCADE'), nullable=False)  
    granted_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    # Явное определение связей
    user = db.relationship('User', backref='map_accesses')
    map = db.relationship('OfficeMap')
    
    __table_args__ = (
        db.UniqueConstraint('map_id', 'user_id', name='_map_user_uc'),
    )
class Test(db.Model):
    __tablename__ = 'tests'
    id = db.Column(db.Integer, primary_key=True)
    hr_id = db.Column(db.Integer, db.ForeignKey('HR.id'), nullable=False)  # Добавляем ForeignKey
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255))
    student_access = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    
    # Добавляем связь с HR
    hr = db.relationship('HR', back_populates='tests')
    
    # Добавляем связь с вопросами
    questions = db.relationship('TestQuestion', backref='test', cascade='all, delete-orphan')

class Candidate(db.Model):
    __tablename__ = 'candidates'
    id = db.Column(db.Integer, primary_key=True)
    hr_id = db.Column(db.Integer, db.ForeignKey('HR.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('Users.id'), unique=True)
    status = db.Column(db.String(50))
    application_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Добавляем отношения
    hr = db.relationship('HR', back_populates='candidates')
    user = db.relationship('User', backref=db.backref('candidate_profile', uselist=False))

    test_assignments = db.relationship('TestAssignment', 
                                     back_populates='candidate',
                                     cascade='all, delete-orphan')

class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.id'), unique=True)
    position = db.Column(db.String(255))
    hire_date = db.Column(db.DateTime, default=datetime.utcnow)
    additional_info = db.Column(db.Text)  # Здесь будут храниться оценки HR
    # Добавляем связь с User
    user = db.relationship('User', backref=db.backref('employee', uselist=False))
class TestQuestion(db.Model):
    __tablename__ = 'test_questions'
    id = db.Column(db.Integer, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey('tests.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), nullable=False)  # 'text', 'single', 'multiple'
    options = db.Column(db.JSON)  # Для вопросов с вариантами ответов
    correct_answer = db.Column(db.JSON)  # Правильный ответ
    points = db.Column(db.Integer, default=1)
    order_num = db.Column(db.Integer)

class TestAssignment(db.Model):
    __tablename__ = 'test_assignments'
    id = db.Column(db.Integer, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey('tests.id'), nullable=False)
    candidate_id = db.Column(db.Integer, db.ForeignKey('candidates.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('HR.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    completed = db.Column(db.Boolean, default=False)
    
    # Связи
    test = db.relationship('Test')
    candidate = db.relationship('Candidate', back_populates='test_assignments')
    assigned_by_hr = db.relationship('HR', back_populates='assigned_tests')
    test_results = db.relationship('TestResult', back_populates='assignment')
    results = db.relationship('TestResult', back_populates='assignment', uselist=False)  # Добавьте это

class TestResult(db.Model):
    __tablename__ = 'test_results'
    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey('test_assignments.id'))
    test_id = db.Column(db.Integer, db.ForeignKey('tests.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('Users.id'))
    answers = db.Column(db.JSON)
    score = db.Column(db.Integer)
    max_score = db.Column(db.Integer)
    completed_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    detailed_results = db.Column(db.JSON, default=list)  # Убедимся, что по умолчанию это список
    
    # Связи
    assignment = db.relationship('TestAssignment', back_populates='results')
    test = db.relationship('Test')
    user = db.relationship('User')

    def get_question_score(self, question_id):
        if not self.detailed_results:  # Проверка на None или пустой список
            return 0
        for dr in self.detailed_results:
            if dr['question_id'] == question_id:
                return dr['score']
        return 0
    
class Report(db.Model):
    __tablename__ = 'reports'
    id = db.Column(db.Integer, primary_key=True)
    hr_id = db.Column(db.Integer, db.ForeignKey('HR.id'))
    name = db.Column(db.String(255))
    text = db.Column(db.Text)  # Рекомендую изменить на Text для хранения HTML
    created_at = db.Column(db.DateTime, default=datetime.utcnow)  # Добавьте это поле
    
    hr = db.relationship('HR', backref=db.backref('reports', lazy=True))

# Функция для создания администратора
def create_admin():
    with app.app_context():
        # Сначала создаем таблицы
        db.create_all()
        
        # Затем создаем администратора
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

# Инициализация базы данных
with app.app_context():
    db.create_all()
    create_admin()

# Функции валидации
def is_valid_email(email):
    return re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email) is not None

def is_valid_phone(phone):
    return re.match(r'^\+?\d{10,15}$', phone) is not None

def save_uploaded_file(file):
    if file and file.filename != '':
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return filename
    return None

# Получение информации о HR
def get_hr_info(hr_id):
    if not hr_id:
        return None
    
    hr_user = User.query.filter_by(id=hr_id, role='hr').first()
    if not hr_user:
        return None
    
    return {
        'name': f"{hr_user.surname} {hr_user.name}",
        'email': hr_user.mail,
        'phone': hr_user.phone
    }

# Маршруты приложения
@app.route('/')
def entry():
    return render_template('entry.html')

@app.route('/admin')
def admin():
    if 'user_id' not in session or session.get('user_role') != 'admin':
        flash('Доступ запрещен. Требуются права администратора', 'error')
        return redirect(url_for('login'))
    
    users = User.query.all()
    candidates = User.query.filter_by(role='candidate').all()
    hr_users = User.query.filter_by(role='hr').all()
    
    return render_template('admin.html',
                         current_user={
                             'name': session.get('user_name', 'Администратор'),
                             'role': 'admin'
                         },
                         users=users,
                         candidates=candidates,
                         hr_list=hr_users,
                         current_year=datetime.now().year)
@app.route('/hire_candidate/<int:candidate_id>', methods=['POST'])
def hire_candidate(candidate_id):
    if 'user_id' not in session or session.get('user_role') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        evaluation_data = request.get_json()
        
        # Получаем кандидата
        candidate = Candidate.query.filter_by(user_id=candidate_id).first()
        if not candidate:
            return jsonify({'error': 'Candidate not found'}), 404
        
        # Получаем пользователя
        user = User.query.get(candidate_id)
        if not user or user.role != 'candidate':
            return jsonify({'error': 'User not found or not a candidate'}), 404
        
        # Формируем текст с оценками
        evaluation_text = (
            f"Должность: {evaluation_data['position']}\n"
            f"Креативность: {evaluation_data['creativity']}/10\n"
            f"Технические навыки: {evaluation_data['tech_skills']}/10\n"
            f"Коммуникация: {evaluation_data['communication']}/10\n"
            f"Тайм-менеджмент: {evaluation_data['time_management']}/10\n"
            f"Работа в команде: {evaluation_data['teamwork']}/10"
        )
        
        # Меняем роль на сотрудника
        user.role = 'employee'
        
        # Создаем запись в employees
        new_employee = Employee(
            user_id=user.id,
            position=evaluation_data['position'],
            additional_info=evaluation_text,
            hire_date=datetime.now(timezone.utc)
        )
        db.session.add(new_employee)
        
        # Удаляем кандидата (каскадное удаление позаботится о test_assignments)
        db.session.delete(candidate)
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        print(f"Error hiring candidate: {str(e)}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/create_test', methods=['GET', 'POST'])
def create_test():
    if 'user_id' not in session or session.get('user_role') != 'hr':
        flash('Доступ запрещен', 'error')
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        num_questions = int(request.form.get('num_questions', 1))
        # Создаем временный тест с пустыми вопросами
        test = Test(
            hr_id=HR.query.filter_by(user_id=session['user_id']).first().id,
            name="Новый тест",
            description=""
        )
        db.session.add(test)
        db.session.flush()  # Получаем ID
        
        # Создаем указанное количество пустых вопросов
        for i in range(1, num_questions + 1):
            db.session.add(TestQuestion(
                test_id=test.id,
                question_text=f"Вопрос {i}",
                question_type='text',
                points=1,
                order_num=i
            ))
        
        db.session.commit()
        return redirect(url_for('edit_test', test_id=test.id))
    
    return render_template('create_test.html')

@app.route('/hr/test_results/<int:result_id>', methods=['GET', 'POST'])
def hr_test_result(result_id):
    if 'user_id' not in session or session.get('user_role') != 'hr':
        flash('Доступ запрещен', 'error')
        return redirect(url_for('login'))
    
    result = TestResult.query.get_or_404(result_id)
    test = Test.query.get_or_404(result.test_id)
    
    # Инициализируем detailed_results, если они None
    if result.detailed_results is None:
        result.detailed_results = []
        db.session.commit()
    
    if request.method == 'POST':
        try:
            new_scores = request.get_json()
            total_score = 0
            detailed_results = []
            
            for question in test.questions:
                question_score = new_scores.get(str(question.id), 0)
                total_score += min(question_score, question.points)
                detailed_results.append({
                    'question_id': question.id,
                    'score': question_score,
                    'max_score': question.points
                })
            
            result.score = total_score
            result.detailed_results = detailed_results
            db.session.commit()
            
            return jsonify({'success': True})
        
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    return render_template('hr_test_result.html',
                         result=result,
                         test=test,
                         current_user={
                             'name': session.get('user_name')
                         })


@app.route('/edit_test', methods=['GET', 'POST'])
def edit_test():
    if 'user_id' not in session or session.get('user_role') != 'hr':
        flash('Доступ запрещен', 'error')
        return redirect(url_for('login'))
    
    hr_record = HR.query.filter_by(user_id=session['user_id']).first()
    if not hr_record:
        flash('HR запись не найдена', 'error')
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        try:
            test_data = request.get_json()
            test = Test.query.get(test_data['test_id'])
            
            if not test or test.hr_id != hr_record.id:
                return jsonify({'error': 'Тест не найден или нет прав на редактирование'}), 403
            
            # Обновляем основную информацию о тесте
            test.name = test_data['test_name']
            test.description = test_data.get('test_description', '')
            
            # Удаляем старые вопросы
            TestQuestion.query.filter_by(test_id=test.id).delete()
            
            # Добавляем новые вопросы
            for i, question in enumerate(test_data['questions'], start=1):
                new_question = TestQuestion(
                    test_id=test.id,
                    question_text=question['text'],
                    question_type=question['type'],
                    options=question.get('options'),
                    correct_answer=question.get('correct_answer'),
                    points=question.get('points', 1),
                    order_num=i
                )
                db.session.add(new_question)
            
            db.session.commit()
            return jsonify({'success': True, 'test_id': test.id})
        
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
    
    # GET запрос - отображаем форму редактирования
    test_id = request.args.get('test_id')
    if not test_id:
        return redirect(url_for('create_test'))
    
    test = Test.query.get(test_id)
    if not test or test.hr_id != hr_record.id:
        flash('Тест не найден или нет прав доступа', 'error')
        return redirect(url_for('hr'))
    
    questions = TestQuestion.query.filter_by(test_id=test.id).order_by(TestQuestion.order_num).all()
    
    return render_template('edit_test.html', 
                         test=test,
                         questions=questions)


@app.route('/assign_test', methods=['POST'])
def assign_test():
    if 'user_id' not in session or session.get('user_role') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    hr_user = User.query.get(session['user_id'])
    hr_record = HR.query.filter_by(user_id=hr_user.id).first()
    
    # Проверяем, что кандидат принадлежит этому HR
    candidate = Candidate.query.filter_by(
        id=data['candidate_id'],
        hr_id=hr_record.id
    ).first()
    
    if not candidate:
        return jsonify({'error': 'Кандидат не найден'}), 404
    
    # Создаем назначение теста
    assignment = TestAssignment(
        test_id=data['test_id'],
        candidate_id=data['candidate_id'],
        assigned_by=hr_record.id
    )
    db.session.add(assignment)
    db.session.commit()
    
    return jsonify({'success': True})
            
@app.route('/reject_candidate/<int:candidate_id>', methods=['POST'])
def reject_candidate(candidate_id):
    if 'user_id' not in session or session.get('user_role') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        # Получаем кандидата
        candidate = Candidate.query.filter_by(user_id=candidate_id).first()
        if not candidate:
            return jsonify({'error': 'Candidate not found'}), 404
        
        # Удаляем кандидата (каскадное удаление позаботится о test_assignments)
        db.session.delete(candidate)
        
        # Также удаляем пользователя, если нужно
        user = User.query.get(candidate_id)
        if user and user.role == 'candidate':
            db.session.delete(user)
        
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

    
@app.route('/candidate')
def candidate():
    if 'user_id' not in session or session.get('user_role') != 'candidate':
        flash('Доступ запрещен', 'error')
        return redirect(url_for('login'))
    
    user = db.session.get(User, session['user_id'])
    if not user:
        flash('Пользователь не найден', 'error')
        return redirect(url_for('login'))
    
    candidate_record = Candidate.query.filter_by(user_id=user.id).first()
    if not candidate_record:
        flash('Запись кандидата не найдена', 'error')
        return redirect(url_for('login'))
    
    assigned_tests = TestAssignment.query.filter_by(
        candidate_id=candidate_record.id
    ).options(
        db.joinedload(TestAssignment.test),
        db.joinedload(TestAssignment.results)
    ).all()

    hr_contact = None
    if candidate_record.hr_id:
        hr_user = User.query.get(candidate_record.hr.user_id)
        if hr_user:
            hr_contact = {
                'name': f"{hr_user.surname} {hr_user.name}",
                'email': hr_user.mail,
                'phone': hr_user.phone
            }

    return render_template('candidate.html',
                         current_user={
                             'name': f"{user.surname} {user.name}",
                             'role': 'candidate'
                         },
                         hr_contact=hr_contact,
                         assigned_tests=assigned_tests,
                         current_year=datetime.now().year)


@app.route('/hr')
def hr():
    if 'user_id' not in session or session.get('user_role') != 'hr':
        flash('Доступ запрещен', 'error')
        return redirect(url_for('login'))
    
    user = db.session.get(User, session['user_id'])
    hr_record = HR.query.filter_by(user_id=user.id).first()
    
    if not hr_record:
        flash('HR запись не найдена', 'error')
        return redirect(url_for('login'))
    
    # Получаем кандидатов, тесты и результаты
    candidates = Candidate.query.filter_by(hr_id=hr_record.id).options(
        db.joinedload(Candidate.user)
    ).all()
    
    tests = Test.query.filter_by(hr_id=hr_record.id).all()
    
    # Получаем все назначенные тесты с результатами
    assignments = TestAssignment.query.filter(
        TestAssignment.assigned_by == hr_record.id
    ).options(
        db.joinedload(TestAssignment.test),
        db.joinedload(TestAssignment.candidate).joinedload(Candidate.user),
        db.joinedload(TestAssignment.results)
    ).all()
    
    # Получаем отчеты (без сортировки по created_at, пока его нет в БД)
    reports = Report.query.filter_by(hr_id=hr_record.id)\
               .options(db.joinedload(Report.hr).joinedload(HR.user))\
               .all()
    
    return render_template('hr.html',
                         current_user={
                             'name': f"{user.surname} {user.name}",
                             'role': 'hr'
                         },
                         candidates=candidates,
                         tests=tests,
                         assignments=assignments,
                         reports=reports,
                         current_year=datetime.now().year)

@app.route('/hr/test_results')
def hr_test_results():
    if 'user_id' not in session or session.get('user_role') != 'hr':
        flash('Доступ запрещен', 'error')
        return redirect(url_for('login'))
    
    hr_user = User.query.get(session['user_id'])
    hr_record = HR.query.filter_by(user_id=hr_user.id).first()
    
    # Получаем все назначенные тесты с результатами
    assignments = TestAssignment.query.filter_by(
        assigned_by=hr_record.id
    ).options(
        db.joinedload(TestAssignment.test),
        db.joinedload(TestAssignment.candidate).joinedload(Candidate.user),
        db.joinedload(TestAssignment.results)
    ).all()
    
    return render_template('hr_test_results.html',
                         assignments=assignments,
                         current_user={
                             'name': hr_user.name
                         })

@app.route('/hr/edit_test_result/<int:result_id>', methods=['GET', 'POST'])
def edit_test_result(result_id):
    if 'user_id' not in session or session.get('user_role') != 'hr':
        flash('Доступ запрещен', 'error')
        return redirect(url_for('login'))
    
    result = TestResult.query.get_or_404(result_id)
    test = Test.query.get_or_404(result.test_id)
    
    if request.method == 'POST':
        new_scores = request.get_json()
        total_score = 0
        
        for question in test.questions:
            question_score = new_scores.get(str(question.id), 0)
            total_score += min(question_score, question.points)
            
            # Обновляем детализированные результаты
            for dr in result.detailed_results:
                if dr['question_id'] == question.id:
                    dr['score'] = question_score
        
        result.score = total_score
        db.session.commit()
        
        return jsonify({'success': True})
    
    return render_template('edit_test_result.html',
                         result=result,
                         test=test,
                         current_user={
                             'name': session.get('user_name')
                         })

# Просмотр всех карт
@app.route('/maps', methods=['GET'])
def maps():
    if 'user_id' not in session:
        flash('Требуется авторизация', 'error')
        return redirect(url_for('login'))
    
    user = db.session.get(User, session['user_id'])
    
    if session.get('user_role') == 'hr':
        hr = HR.query.filter_by(user_id=user.id).first()
        maps = OfficeMap.query.filter_by(hr_id=hr.id).all() if hr else []
    else:
        maps = OfficeMap.query.join(MapAccess).filter(
            MapAccess.user_id == user.id
        ).all()
    
    users = User.query.all() if session.get('user_role') == 'hr' else []
    
    return render_template('maps.html',
                        current_user={
                            'name': f"{user.surname} {user.name}",
                            'role': session.get('user_role')
                        },
                        maps=maps,
                        users=users)

# Создание новой карты
@app.route('/create_map', methods=['GET', 'POST'])
def create_map():
    if 'user_id' not in session or session.get('user_role') != 'hr':
        flash('Доступ запрещен. Требуются права HR', 'error')
        return redirect(url_for('login'))
    
    if request.method == 'GET':
        return render_template('map-editor.html', map=None)
    
    # Обработка POST запроса
    data = request.get_json()
    if not data or not data.get('name') or not data.get('image_data'):
        return jsonify({'error': 'Необходимо указать название и изображение'}), 400
    
    hr = HR.query.filter_by(user_id=session['user_id']).first()
    if not hr:
        return jsonify({'error': 'HR не найден'}), 404
    
    try:
        new_map = OfficeMap(
            hr_id=hr.id,
            name=data['name'],
            image_data=data['image_data']
        )
        db.session.add(new_map)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'map_id': new_map.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

# Редактирование карты
@app.route('/edit_map/<int:map_id>', methods=['GET', 'POST'])
def edit_map(map_id):
    if 'user_id' not in session or session.get('user_role') != 'hr':
        flash('Доступ запрещен. Требуются права HR', 'error')
        return redirect(url_for('login'))
    
    hr = HR.query.filter_by(user_id=session['user_id']).first()
    map_data = OfficeMap.query.get_or_404(map_id)
    
    if not hr or map_data.hr_id != hr.id:
        flash('Нет прав на редактирование этой карты', 'error')
        return redirect(url_for('maps'))
    
    if request.method == 'POST':
        map_data.name = request.form.get('name', map_data.name)
        image = request.files.get('image')
        
        if image and image.filename != '':
            map_data.image_data = f"data:{image.mimetype};base64,{base64.b64encode(image.read()).decode('utf-8')}"
        
        db.session.commit()
        flash('Карта успешно обновлена', 'success')
        return redirect(url_for('maps'))
    
    return render_template('map-editor.html', map=map_data)
@app.route('/delete_map/<int:map_id>', methods=['POST'])
def delete_map(map_id):
    if 'user_id' not in session or session.get('user_role') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 403
    
    hr = HR.query.filter_by(user_id=session['user_id']).first()
    map_data = OfficeMap.query.get_or_404(map_id)
    
    if not hr or map_data.hr_id != hr.id:
        return jsonify({'error': 'Forbidden'}), 403
    
    try:
        # Удаляем все связанные записи о доступах
        MapAccess.query.filter_by(map_id=map_id).delete()
        # Удаляем саму карту
        db.session.delete(map_data)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/map_access/<int:map_id>', methods=['GET', 'POST'])
def map_access(map_id):
    if 'user_id' not in session or session.get('user_role') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 403
    
    if request.method == 'GET':
        # Получаем всех сотрудников (employees) с их пользовательскими данными
        employees = db.session.query(Employee, User).join(
            User, Employee.user_id == User.id
        ).all()
        
        # Получаем текущие доступы к этой карте
        current_access = MapAccess.query.filter_by(map_id=map_id).all()
        current_user_ids = [access.user_id for access in current_access]
        
        return jsonify({
            'employees': [
                {
                    'id': user.id,
                    'name': f"{user.surname} {user.name}",
                    'position': employee.position,
                    'has_access': user.id in current_user_ids
                } for employee, user in employees
            ]
        })
    
    if request.method == 'POST':
        try:
            data = request.get_json()
            # Удаляем старые доступы
            MapAccess.query.filter_by(map_id=map_id).delete()
            
            # Добавляем новые доступы
            for user_id in data.get('users', []):
                access = MapAccess(map_id=map_id, user_id=user_id)
                db.session.add(access)
            
            db.session.commit()
            return jsonify({'success': True})
        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500
        
@app.route('/get_map_access/<int:map_id>')
def get_map_access(map_id):
    if 'user_id' not in session or session.get('user_role') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Получаем текущие доступы к этой карте
    current_access = MapAccess.query.filter_by(map_id=map_id).all()
    return jsonify({'user_ids': [access.user_id for access in current_access]})      
        
@app.route('/view_map/<int:map_id>')
def view_map(map_id):
    if 'user_id' not in session:
        flash('Требуется авторизация', 'error')
        return redirect(url_for('login'))
    
    map_data = OfficeMap.query.get_or_404(map_id)
    user = db.session.get(User, session['user_id'])
    
    # Проверка доступа (HR может просматривать свои карты, другие - если есть доступ)
    if session.get('user_role') != 'hr' or map_data.hr_id != user.id:
        access = MapAccess.query.filter_by(
            map_id=map_id,
            user_id=user.id
        ).first()
        if not access:
            flash('Нет доступа к этой карте', 'error')
            return redirect(url_for('maps'))
    
    return render_template('view-map.html', map=map_data)

@app.route('/update_map/<int:map_id>', methods=['POST'])  # Изменено с PUT на POST
def update_map(map_id):
    if 'user_id' not in session or session.get('user_role') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.get_json()
    if not data or not data.get('name') or not data.get('image_data'):
        return jsonify({'error': 'Необходимо указать название и изображение'}), 400
    
    hr = HR.query.filter_by(user_id=session['user_id']).first()
    map_data = OfficeMap.query.get_or_404(map_id)
    
    if not hr or map_data.hr_id != hr.id:
        return jsonify({'error': 'Нет прав на редактирование этой карты'}), 403
    
    try:
        map_data.name = data['name']
        map_data.image_data = data['image_data']
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@app.route('/get_maps')
def get_maps():
    if 'user_id' not in session or session.get('user_role') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 401
    
    hr = HR.query.filter_by(user_id=session['user_id']).first()
    if not hr:
        return jsonify({'error': 'HR not found'}), 404
    
    maps = OfficeMap.query.filter_by(hr_id=hr.id).all()
    return jsonify({
        'maps': [{
            'id': map.id,
            'name': map.name,
            'image_data': map.image_data,
            'created_at': map.created_at.isoformat()
        } for map in maps]
    })


@app.route('/employee')
def employee():
    if 'user_id' not in session or session.get('user_role') != 'employee':
        flash('Доступ запрещен. Требуется авторизация как сотрудник', 'error')
        return redirect(url_for('login'))
    
    user = db.session.get(User, session['user_id'])
    employee_info = Employee.query.filter_by(user_id=user.id).first()
    
    # Получаем карты, доступные сотруднику
    maps = OfficeMap.query.join(MapAccess).filter(
        MapAccess.user_id == user.id
    ).all()
    
    return render_template('employee.html',
                         current_user=user,
                         employee_info=employee_info,
                         maps=maps,
                         current_year=datetime.now().year)

@app.route('/get_employees')
def get_employees():
    if 'user_id' not in session or session.get('user_role') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Получаем всех сотрудников с их пользовательскими данными
    employees = db.session.query(Employee, User).join(
        User, Employee.user_id == User.id
    ).all()
    
    return jsonify({
        'employees': [
            {
                'id': user.id,
                'name': f"{user.surname} {user.name}",
                'position': employee.position
            } for employee, user in employees
        ]
    })


@app.route('/take_test/<int:assignment_id>', methods=['GET', 'POST'])
def take_test(assignment_id):
    if 'user_id' not in session or session.get('user_role') != 'candidate':
        return jsonify({'error': 'Unauthorized'}), 401

    # Получаем данные пользователя
    user = db.session.get(User, session['user_id'])
    if not user:
        flash('Пользователь не найден', 'error')
        return redirect(url_for('login'))

    assignment = TestAssignment.query.get_or_404(assignment_id)
    test = Test.query.get_or_404(assignment.test_id)

    if request.method == 'POST':
        try:
            answers = request.get_json()
            if not answers:
                return jsonify({'error': 'No answers provided'}), 400

            # Подсчёт баллов
            score = 0
            max_score = sum(q.points for q in test.questions)
            detailed_results = []

            for question in test.questions:
                user_answer = answers.get(str(question.id))
                question_score = 0
                
                if question.question_type == 'text':
                    question_score = question.points
                elif user_answer and question.correct_answer:
                    if question.question_type == 'single':
                        if user_answer in question.correct_answer:
                            question_score = question.points
                    elif question.question_type == 'multiple':
                        if set(user_answer) == set(question.correct_answer):
                            question_score = question.points
                
                score += question_score
                detailed_results.append({
                    'question_id': question.id,
                    'score': question_score,
                    'max_score': question.points
                })

            # Сохранение результатов
            result = TestResult(
                assignment_id=assignment.id,
                test_id=test.id,
                user_id=session['user_id'],
                answers=answers,
                score=score,
                max_score=max_score,
                detailed_results=detailed_results
            )
            
            assignment.completed = True
            db.session.add(result)
            db.session.commit()

            return jsonify({
                'success': True,
                'result_id': result.id,
                'redirect_url': url_for('test_result', result_id=result.id)
            })

        except Exception as e:
            db.session.rollback()
            return jsonify({'error': str(e)}), 500

    return render_template('take_test.html', 
                         test=test,
                         assignment=assignment,
                         current_user={
                             'name': f"{user.surname} {user.name}",
                             'role': 'candidate'
                         })

@app.route('/test_result/<int:result_id>')
def test_result(result_id):
    if 'user_id' not in session or session.get('user_role') != 'candidate':
        flash('Доступ запрещен', 'error')
        return redirect(url_for('login'))
    
    user = db.session.get(User, session['user_id'])
    if not user:
        flash('Пользователь не найден', 'error')
        return redirect(url_for('login'))

    result = TestResult.query.get_or_404(result_id)
    if result.user_id != session['user_id']:
        flash('Доступ запрещен', 'error')
        return redirect(url_for('candidate'))
    
    return render_template('test_result.html',
                         result=result,
                         current_user={
                             'name': f"{user.surname} {user.name}",
                             'role': 'candidate'
                         })

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        user_type = request.form.get('user_type')
        surname = request.form.get('surname')
        name = request.form.get('name')
        patronymic = request.form.get('patronymic', '')
        email = request.form.get('email')
        phone = request.form.get('phone')
        password = request.form.get('password')
        photo = request.files.get('photo')
        
        errors = []
        
        # Валидация
        if not all([surname, name, email, phone, password]):
            errors.append('Все обязательные поля должны быть заполнены')
        if not is_valid_email(email):
            errors.append('Некорректный формат email')
        if not is_valid_phone(phone):
            errors.append('Некорректный номер телефона')
        if len(password) < 6:
            errors.append('Пароль должен содержать минимум 6 символов')
        if User.query.filter_by(mail=email).first():
            errors.append('Пользователь с таким email уже существует')

        if errors:
            for error in errors:
                flash(error, 'error')
            return redirect(url_for('register'))

        # Обработка фото
        photo_filename = save_uploaded_file(photo)

        try:
            # Создаем пользователя
            new_user = User(
                role=user_type,
                surname=surname,
                name=name,
                patronymic=patronymic,
                mail=email,
                phone=phone,
                password=generate_password_hash(password),
                image=photo_filename
            )
            db.session.add(new_user)
            db.session.flush()  # Получаем ID нового пользователя

            # Для HR создаем запись в таблице HR
            if user_type == 'hr':
                new_hr = HR(
                    user_id=new_user.id,
                    department='Default Department'  # Можно сделать поле в форме
                )
                db.session.add(new_hr)

            # Для кандидатов
            elif user_type == 'candidate':
                hr_phone = request.form.get('hr_phone')
                # Ищем пользователя HR
                hr_user = User.query.filter_by(phone=hr_phone, role='hr').first()
                
                if not hr_user:
                    flash('HR с указанным номером телефона не найден', 'error')
                    return redirect(url_for('register'))
                
                # Ищем запись HR для этого пользователя
                hr_record = HR.query.filter_by(user_id=hr_user.id).first()
                if not hr_record:
                    hr_record = HR(
                    user_id=hr_user.id,
                    department='Default Department'
                    )
                    db.session.add(hr_record)
                    db.session.flush()  # Получаем ID новой записи
                
                
                # Создаем кандидата с правильным hr_id (из таблицы HR)
                candidate = Candidate(
                    user_id=new_user.id,
                    hr_id=hr_record.id,  # Используем id из таблицы HR
                    status='new'
                )
                db.session.add(candidate)

            db.session.commit()
            flash('Регистрация прошла успешно! Теперь вы можете войти.', 'success')
            return redirect(url_for('entry'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Ошибка при регистрации: {str(e)}', 'error')
            app.logger.error(f'Registration error: {str(e)}')

    # Для GET-запроса
    hr_users = User.query.filter_by(role='hr').all()
    # Фильтруем только тех HR, у которых есть запись в таблице HR
    valid_hrs = [u for u in hr_users if HR.query.filter_by(user_id=u.id).first()]
    return render_template('register.html', hr_users=valid_hrs)

@app.route('/hr/report_editor')
def report_editor():
    if 'user_id' not in session or session.get('user_role') != 'hr':
        flash('Доступ запрещен', 'error')
        return redirect(url_for('login'))
    return render_template('report_editor.html')
@app.route('/reports/<int:report_id>')
def view_report(report_id):
    if 'user_id' not in session or session.get('user_role') != 'hr':
        flash('Доступ запрещен', 'error')
        return redirect(url_for('login'))
    
    report = Report.query.get_or_404(report_id)
    # Проверка, что отчет принадлежит текущему HR
    if report.hr.user_id != session['user_id']:
        flash('Нет прав доступа к этому отчету', 'error')
        return redirect(url_for('hr'))
    
    return render_template('view_report.html', report=report)

@app.route('/reports/<int:report_id>/download/<format>')
def download_report(report_id, format):
    if 'user_id' not in session or session.get('user_role') != 'hr':
        flash('Доступ запрещен', 'error')
        return redirect(url_for('login'))
    
    report = Report.query.get_or_404(report_id)
    # Проверка, что отчет принадлежит текущему HR
    if report.hr.user_id != session['user_id']:
        flash('Нет прав доступа к этому отчету', 'error')
        return redirect(url_for('hr'))
    
    if format == 'pdf':
        # Генерация PDF (используйте ваш код экспорта в PDF)
        return "PDF generation would be here"
    elif format == 'word':
        # Генерация Word (используйте ваш код экспорта в Word)
        return "Word generation would be here"
    else:
        flash('Неверный формат', 'error')
        return redirect(url_for('view_report', report_id=report_id))
    
@app.route('/api/hr_candidates')
def get_hr_candidates():
    if 'user_id' not in session or session.get('user_role') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 401
    
    hr = HR.query.filter_by(user_id=session['user_id']).first()
    if not hr:
        return jsonify({'error': 'HR not found'}), 404
    
    candidates = Candidate.query.filter_by(hr_id=hr.id).options(
        db.joinedload(Candidate.user)
    ).all()
    
    return jsonify([
        {
            'id': cand.id,
            'name': f"{cand.user.surname} {cand.user.name}",
            'email': cand.user.mail,
            'phone': cand.user.phone,
            'status': cand.status
        } for cand in candidates
    ])

@app.route('/api/save_report', methods=['POST'])
def save_report():
    if 'user_id' not in session or session.get('user_role') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    hr = HR.query.filter_by(user_id=session['user_id']).first()
    
    try:
        new_report = Report(
            hr_id=hr.id,
            name=data['title'],
            text=data['content']
        )
        db.session.add(new_report)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/hr/delete_test/<int:test_id>', methods=['POST'])
def delete_test(test_id):
    if 'user_id' not in session or session.get('user_role') != 'hr':
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        test = Test.query.get_or_404(test_id)
        db.session.delete(test)
        db.session.commit()
        return jsonify({'success': True})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
    
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = User.query.filter_by(mail=email).first()
        
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['user_role'] = user.role
            session['user_name'] = f"{user.surname} {user.name}"
            session['user_fullname'] = f"{user.surname} {user.name}"  # Дополнительное поле для удобства
            
            flash(f'Добро пожаловать, {user.surname}!', 'success')
            
            if user.role == 'admin':
                return redirect(url_for('admin'))
            elif user.role == 'hr':
                return redirect(url_for('hr'))
            elif user.role == 'employee':
                return redirect(url_for('employee'))
            elif user.role == 'candidate':
                return redirect(url_for('candidate'))
            else:
                return redirect(url_for('entry'))
        else:
            flash('Неверный email или пароль', 'error')
    
    return render_template('entry.html')

@app.route('/logout')
def logout():
    session.clear()
    flash('Вы успешно вышли из системы', 'success')
    return redirect(url_for('entry'))

if __name__ == '__main__':
  app.run(host='0.0.0.0', port=5000, debug=True)