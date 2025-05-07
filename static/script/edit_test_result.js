// Обновление типа вопроса
function updateQuestionType(select) {
    const container = $(select).closest('.question-card').find('.options-container');
    if (select.value === 'text') {
        container.hide().empty();
    } else {
        container.show().html(`
            <label>Варианты ответов (каждый с новой строки):</label>
            <textarea class="question-options"></textarea>
            <div class="options-preview"></div>
        `);
    }
}

// Отправка формы
$('#testForm').submit(function(e) {
    e.preventDefault();
    
    const testData = {
        test_id: $('#testId').val(),
        test_name: $('#testName').val(),
        test_description: $('#testDescription').val(),
        questions: []
    };
    
    // Собираем данные вопросов
    $('.question-card').each(function() {
        const type = $(this).find('.question-type').val();
        const question = {
            text: $(this).find('.question-text').val(),
            type: type,
            points: parseInt($(this).find('.question-points').val())
        };
        
        if (type !== 'text') {
            const optionsText = $(this).find('.question-options').val();
            question.options = optionsText.split('\n').filter(opt => opt.trim() !== '');
            
            if (type === 'single') {
                question.correct_answer = [$(this).find('.correct-answer').val()];
            } else if (type === 'multiple') {
                const correct = [];
                $(this).find('.correct-answers input:checked').each(function() {
                    correct.push($(this).next().text().trim());
                });
                question.correct_answer = correct;
            }
        }
        
        testData.questions.push(question);
    });
    
    // Отправка на сервер
    $.ajax({
        url: "{{ url_for('edit_test') }}",
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(testData),
        success: function(data) {
            if (data.success) {
                alert('Тест успешно сохранен!');
                window.location.href = "{{ url_for('hr') }}";
            } else {
                alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
            }
        },
        error: function(xhr) {
            alert('Произошла ошибка при сохранении теста');
            console.error(xhr.responseText);
        }
    });
});