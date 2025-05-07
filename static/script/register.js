document.addEventListener("DOMContentLoaded", function () {
    const candidateForm = document.getElementById("candidate-form");
    const hrForm = document.getElementById("hr-form");
    const userTypeRadios = document.querySelectorAll('input[name="user-type"]');

    // Переключение между формами
    userTypeRadios.forEach(radio => {
        radio.addEventListener("change", function () {
            if (this.value === "candidate") {
                candidateForm.style.display = "block";
                hrForm.style.display = "none";
            } else {
                candidateForm.style.display = "none";
                hrForm.style.display = "block";
            }
        });
    });

    // Обработка отправки формы кандидата
    candidateForm.addEventListener("submit", function (event) {
        event.preventDefault();
        // Здесь можно добавить логику отправки данных
        window.location.href = "candidate.html"; // Перенаправление
    });

    // Обработка отправки формы HR
    hrForm.addEventListener("submit", function (event) {
        event.preventDefault();
        // Здесь можно добавить логику отправки данных
        window.location.href = "hr.html"; // Перенаправление
    });
});

// Обновляем скрытые поля при изменении выбора
document.querySelectorAll('input[name="user_type"]').forEach(radio => {
    radio.addEventListener('change', function() {
        toggleFields();
    });
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', toggleFields);

function toggleFields() {
    const userType = document.querySelector('input[name="user_type"]:checked').value;
    const hrPhoneField = document.getElementById('hr-phone-field');
    const vacancyField = document.getElementById('vacancy-field');
    
    if (userType === 'hr') {
        hrPhoneField.style.display = 'none';
        vacancyField.style.display = 'none';
    } else {
        hrPhoneField.style.display = 'block';
        vacancyField.style.display = 'block';
    }
}

function validateForm() {
    const userType = document.querySelector('input[name="user_type"]:checked').value;
    const surname = document.getElementById('surname').value;
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const hrPhone = document.getElementById('hr-phone')?.value;
    const vacancy = document.getElementById('vacancy')?.value;
    
    if (!surname || !name) {
        alert('Фамилия и имя обязательны для заполнения');
        return false;
    }
    
    if (!email.includes('@')) {
        alert('Введите корректный email');
        return false;
    }
    
    if (phone.length < 10) {
        alert('Номер телефона слишком короткий');
        return false;
    }
    
    if (password.length < 6) {
        alert('Пароль должен содержать минимум 6 символов');
        return false;
    }
    
    if (userType === 'candidate') {
        if (!hrPhone || hrPhone.length < 10) {
            alert('Введите корректный номер телефона HR');
            return false;
        }
        if (!vacancy) {
            alert('Введите название вакансии');
            return false;
        }
    }
    
    return true;
}