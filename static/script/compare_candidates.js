document.addEventListener('DOMContentLoaded', function() {
    const candidateCards = document.querySelectorAll('.candidate-card');
    const startComparisonBtn = document.getElementById('startComparison');
    const comparisonSection = document.getElementById('comparison-section');
    let selectedCandidates = [];
    
    // Выбор кандидатов
    candidateCards.forEach(card => {
        card.addEventListener('click', function() {
            const candidateId = this.dataset.candidateId;
            const index = selectedCandidates.indexOf(candidateId);
            
            if (index === -1) {
                if (selectedCandidates.length < 10) {
                    selectedCandidates.push(candidateId);
                    this.classList.add('selected');
                }
            } else {
                selectedCandidates.splice(index, 1);
                this.classList.remove('selected');
            }
            
            // Активируем кнопку если выбрано от 2 до 4 кандидатов
            startComparisonBtn.disabled = selectedCandidates.length < 2 || selectedCandidates.length > 10;
        });
    });
    
    // Начало сравнения
    startComparisonBtn.addEventListener('click', function() {
        if (selectedCandidates.length < 2 || selectedCandidates.length > 10) return;
        
        // Показываем секцию сравнения
        comparisonSection.style.display = 'block';
        
        // Загружаем данные для сравнения
        fetchComparisonData(selectedCandidates);
    });
    
    // Функция загрузки данных для сравнения
    function fetchComparisonData(candidateIds) {
fetch(`/hr/compare_candidates_data?candidate_ids=${candidateIds.join(',')}`)
.then(response => {
    if (!response.ok) {
        throw new Error('Ошибка загрузки данных');
    }
    return response.json();
})
.then(data => {
    if (data.error) {
        throw new Error(data.error);
    }
    // Фильтруем кандидатов, оставляем только выбранных
    data.candidates = data.candidates.filter(candidate => 
        candidateIds.includes(candidate.id.toString())
    );
    renderComparisonTable(data);
})
.catch(error => {
    console.error('Error:', error);
    alert(`Ошибка загрузки данных для сравнения: ${error.message}`);
});
}
    
    // Функция отрисовки таблицы сравнения
    function renderComparisonTable(data) {
const tbody = document.querySelector('#comparisonTable tbody');
tbody.innerHTML = '';

// Очищаем заголовки таблицы
const thead = document.querySelector('#comparisonTable thead');
thead.innerHTML = `
<tr>
    <th>Вопрос</th>
    ${selectedCandidates.map(candId => {
        const candidate = data.candidates.find(c => c.id == candId);
        if (!candidate) return '';
        return `
            <th class="candidate-header" data-candidate-id="${candidate.id}">
                ${candidate.name}<br>
                <small>${candidate.vacancy}</small>
            </th>
        `;
    }).join('')}
    <th>Цена вопроса</th>
</tr>
`;

data.questions.forEach((question, qIndex) => {
const row = document.createElement('tr');

// Вопрос
const questionCell = document.createElement('td');
questionCell.innerHTML = `
    <strong>Вопрос ${qIndex + 1}</strong><br>
    ${question.text}
    <div class="correct-answer">
        Правильный ответ: ${formatCorrectAnswer(question.correct_answer, question.type)}
    </div>
`;
row.appendChild(questionCell);

// Ответы только выбранных кандидатов
selectedCandidates.forEach(candId => {
    const candidate = data.candidates.find(c => c.id == candId);
    if (!candidate) return;
    
    const answerCell = document.createElement('td');
    const answer = candidate.answers[question.id] || 'Нет ответа';
    const points = candidate.question_scores[question.id] || 0;
    const isCorrect = checkAnswerCorrectness(
        answer, 
        question.correct_answer, 
        question.type
    );
    
    answerCell.innerHTML = `
        <div class="user-answer ${isCorrect ? 'correct' : 'incorrect'}">
            ${formatAnswer(answer)}<br>
            <strong>Баллы: ${points}/${question.points}</strong>
        </div>
    `;
    answerCell.dataset.points = points;
    answerCell.dataset.candidateId = candidate.id;
    answerCell.dataset.questionId = question.id;
    
    answerCell.addEventListener('click', function() {
        this.classList.toggle('optimal-cell');
    });
    
    row.appendChild(answerCell);
});

// Цена вопроса
const pointsCell = document.createElement('td');
pointsCell.textContent = question.points;
row.appendChild(pointsCell);

tbody.appendChild(row);
});

// Прокручиваем к таблице сравнения
document.getElementById('comparison-section').scrollIntoView({ behavior: 'smooth' });
}
    
    // Проверка правильности ответа
    function checkAnswerCorrectness(answer, correctAnswer, questionType) {
        if (!correctAnswer) return true;
        if (answer === 'Нет ответа') return false;
        
        if (questionType === 'single') {
            return answer === correctAnswer[0];
        } else if (questionType === 'multiple') {
            if (!Array.isArray(answer)) return false;
            return answer.length === correctAnswer.length && 
                   answer.every(item => correctAnswer.includes(item));
        }
        return true; // Для текстовых вопросов считаем правильным
    }
    
    // Форматирование ответа для отображения
    function formatAnswer(answer) {
        if (Array.isArray(answer)) {
            return answer.join(', ');
        }
        return answer;
    }
    
    // Форматирование правильного ответа
    function formatCorrectAnswer(answer, questionType) {
        if (!answer) return 'Не указан';
        if (questionType === 'single') {
            return answer[0] || 'Не указан';
        } else if (questionType === 'multiple') {
            return answer.join(', ');
        }
        return 'Текстовый ответ';
    }
    
    // Определение оптимального кандидата
    document.getElementById('findOptimal').addEventListener('click', function() {
        const optimalCells = document.querySelectorAll('.optimal-cell');
        const selectedAnswers = [];
        
        optimalCells.forEach(cell => {
            selectedAnswers.push({
                candidate_id: cell.dataset.candidateId,
                question_id: cell.dataset.questionId,
                points: parseInt(cell.dataset.points)
            });
        });
        
        if (selectedAnswers.length === 0) {
            alert('Выберите оптимальные ответы для сравнения!');
            return;
        }
        
        // Отправляем данные на сервер для расчета
        fetch('/hr/compare_candidates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                selected_answers: selectedAnswers
            })
        })
        .then(response => response.json())
        .then(data => {
            displayOptimalCandidates(data);
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Ошибка при определении оптимального кандидата');
        });
    });
    
    // Отображение результатов сравнения
    function displayOptimalCandidates(data) {
        const resultsContainer = document.getElementById('bestCandidatesList');
        resultsContainer.innerHTML = '';
        
        if (!data.best_candidates || data.best_candidates.length === 0) {
            resultsContainer.innerHTML = '<p>Не удалось определить оптимального кандидата</p>';
            return;
        }
        
        // Находим имена кандидатов
        const bestCandidateNames = data.best_candidates.map(candId => {
            const card = document.querySelector(`.candidate-card[data-candidate-id="${candId}"] h3`);
            return card ? card.textContent : `Кандидат ${candId}`;
        });
        
        // Отображаем лучших кандидатов
        if (bestCandidateNames.length === 1) {
            resultsContainer.innerHTML = `
                <p class="best-candidate">Оптимальный кандидат: ${bestCandidateNames[0]}</p>
                <p>Набранный балл: ${data.scores[data.best_candidates[0]]}</p>
            `;
        } else {
            resultsContainer.innerHTML = `
                <p class="best-candidate">Несколько оптимальных кандидатов:</p>
                <ul>
                    ${bestCandidateNames.map(name => `<li>${name}</li>`).join('')}
                </ul>
                <p>Набранный балл: ${data.scores[data.best_candidates[0]]}</p>
            `;
        }
        
        document.getElementById('optimalResults').style.display = 'block';
    }
});