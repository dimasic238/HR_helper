    // Автоматическое увеличение высоты textarea при вводе текста
    document.querySelectorAll('textarea').forEach(textarea => {
        // Устанавливаем начальную высоту
        textarea.style.height = textarea.scrollHeight + 'px';
        
        // Обработчик ввода текста
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    });
            document.addEventListener('DOMContentLoaded', function() {
                const testForm = document.getElementById('testForm');
                
                testForm.addEventListener('submit', function(e) {
                    e.preventDefault();
                    
                    const answers = {};
                    
                    // Собираем все ответы
                    document.querySelectorAll('.question').forEach(question => {
                        const questionId = question.dataset.questionId;
                        const questionType = question.dataset.questionType;
                        
                        if (questionType === 'text') {
                            answers[questionId] = question.querySelector('textarea').value;
                        } else if (questionType === 'single') {
                            const selected = question.querySelector('input[type="radio"]:checked');
                            answers[questionId] = selected ? selected.value : null;
                        } else if (questionType === 'multiple') {
                            const selected = [];
                            question.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                                selected.push(cb.value);
                            });
                            answers[questionId] = selected;
                        }
                    });
    
                    // Отправка на сервер
                    fetch(window.location.href, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(answers)
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            window.location.href = data.redirect_url;
                        } else {
                            alert('Ошибка при сохранении результатов: ' + (data.error || 'Неизвестная ошибка'));
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Произошла ошибка при отправке теста');
                    });
                });
            });