 // Функция для показа/скрытия формы загрузки
 function toggleUploadForm() {
    const form = document.getElementById('uploadForm');
    form.classList.toggle('active');
}

// Обработка отправки формы резюме
document.getElementById('resumeForm').addEventListener('submit', function(e) {
e.preventDefault();

const formData = new FormData();
const fileInput = document.getElementById('resumeFile');

if (fileInput.files.length === 0) {
alert('Пожалуйста, выберите файл');
return;
}

formData.append('resume', fileInput.files[0]);

fetch('/candidates/{{ current_user.candidate_profile.id }}/upload_resume', {
method: 'POST',
body: formData
})
.then(response => {
if (!response.ok) {
    return response.json().then(err => { throw new Error(err.error || 'Ошибка загрузки файла') });
}
return response.json();
})
.then(data => {
if (data.success) {
    alert('Резюме успешно загружено!');
    location.reload();
}
})
.catch(error => {
console.error('Error:', error);
alert('Произошла ошибка при загрузке файла: ' + error.message);
});
});