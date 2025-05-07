document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('resultsForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const scores = {};
        document.querySelectorAll('.score-input').forEach(input => {
            scores[input.name] = parseInt(input.value) || 0;
        });
        
        fetch(window.location.href, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scores)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Изменения сохранены успешно!');
                // Обновляем общий балл
                const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
                document.getElementById('total-score').textContent = totalScore;
            } else {
                alert('Ошибка при сохранении: ' + (data.error || 'Неизвестная ошибка'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Произошла ошибка при сохранении изменений');
        });
    });
});