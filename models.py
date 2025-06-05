from config import db
from datetime import datetime, timezone
from sqlalchemy import or_
import re
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import base64

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
    
    hr = db.relationship('HR', backref='maps')

class HRNote(db.Model):
    __tablename__ = 'hr_notes'
    id = db.Column(db.Integer, primary_key=True)
    hr_id = db.Column(db.Integer, db.ForeignKey('HR.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    
    hr = db.relationship('HR', backref=db.backref('notes', lazy=True, cascade='all, delete-orphan'))

class HR(db.Model):
    __tablename__ = 'HR'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('Users.id'), unique=True, nullable=False)
    department = db.Column(db.String(255))
    note_title = db.Column(db.String(255))
    note_content = db.Column(db.Text)

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
    
    user = db.relationship('User', backref='map_accesses')
    map = db.relationship('OfficeMap')
    
    __table_args__ = (
        db.UniqueConstraint('map_id', 'user_id', name='_map_user_uc'),
    )

class Test(db.Model):
    __tablename__ = 'tests'
    id = db.Column(db.Integer, primary_key=True)
    hr_id = db.Column(db.Integer, db.ForeignKey('HR.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255))
    student_access = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    
    hr = db.relationship('HR', back_populates='tests')
    questions = db.relationship('TestQuestion', backref='test', cascade='all, delete-orphan')

class Candidate(db.Model):
    __tablename__ = 'candidates'
    id = db.Column(db.Integer, primary_key=True)
    hr_id = db.Column(db.Integer, db.ForeignKey('HR.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('Users.id'), unique=True)
    status = db.Column(db.String(50))
    application_date = db.Column(db.DateTime, default=datetime.utcnow)
    resume_file = db.Column(db.LargeBinary)
    resume_filename = db.Column(db.String(255))
    resume_content_type = db.Column(db.String(100))
    
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
    additional_info = db.Column(db.Text)
    
    user = db.relationship('User', backref=db.backref('employee', uselist=False))

class TestQuestion(db.Model):
    __tablename__ = 'test_questions'
    id = db.Column(db.Integer, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey('tests.id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    question_type = db.Column(db.String(50), nullable=False)
    options = db.Column(db.JSON)
    correct_answer = db.Column(db.JSON)
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
    
    test = db.relationship('Test')
    candidate = db.relationship('Candidate', back_populates='test_assignments')
    assigned_by_hr = db.relationship('HR', back_populates='assigned_tests')
    test_results = db.relationship('TestResult', back_populates='assignment')
    results = db.relationship('TestResult', back_populates='assignment', uselist=False)

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
    detailed_results = db.Column(db.JSON, default=list)
    
    assignment = db.relationship('TestAssignment', back_populates='results')
    test = db.relationship('Test')
    user = db.relationship('User')

    def get_question_score(self, question_id):
        if not self.detailed_results:
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
    text = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_html = db.Column(db.Boolean, default=False)
    is_binary = db.Column(db.Boolean, default=False)
    file_type = db.Column(db.String(255))
    binary_data = db.Column(db.LargeBinary)
    
    hr = db.relationship('HR', backref=db.backref('reports', lazy=True))

def is_valid_email(email):
    return re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email) is not None

def is_valid_phone(phone):
    return re.match(r'^\+?\d{10,15}$', phone) is not None

from werkzeug.utils import secure_filename
import os

def save_uploaded_file(file, upload_folder):
    """Сохраняет загруженный файл в указанную папку"""
    if file and file.filename != '':
        filename = secure_filename(file.filename)
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        return filename
    return None

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