import re
import os
from werkzeug.utils import secure_filename

def is_valid_email(email):
    return re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email) is not None

def is_valid_phone(phone):
    return re.match(r'^\+?\d{10,15}$', phone) is not None

def save_uploaded_file(file, upload_folder):
    if file and file.filename != '':
        filename = secure_filename(file.filename)
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)
        return filename
    return None