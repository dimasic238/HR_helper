 // Получаем данные оценок из текста
 function parseSkills(text) {
    const skills = {
        'Креативность': 5,
        'Технические навыки': 5,
        'Коммуникация': 5,
        'Тайм-менеджмент': 5,
        'Работа в команде': 5
    };
    
    if (!text) return skills;
    
    const lines = text.split('\n');
    lines.forEach(line => {
        for (const skill in skills) {
            if (line.includes(skill)) {
                const match = line.match(/(\d+)\/10/);
                if (match) {
                    skills[skill] = parseInt(match[1]);
                }
            }
        }
    });
    
    return skills;
}

// Создание диаграммы
document.addEventListener('DOMContentLoaded', function() {
    const skillsText = `{{ employee_info.additional_info if employee_info else '' }}`;
    const skillsData = parseSkills(skillsText);
    
    const ctx = document.getElementById('skillsChart').getContext('2d');
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Креативность', 'Технические навыки', 'Коммуникация', 'Тайм-менеджмент', 'Работа в команде'],
            datasets: [{
                label: 'Мои навыки',
                data: Object.values(skillsData),
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { display: true },
                    suggestedMin: 0,
                    suggestedMax: 10
                }
            }
        }
    });
});