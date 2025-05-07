        // Функционал заметок
        document.addEventListener('DOMContentLoaded', function() {
            const notesContainer = document.getElementById('notesContainer');
            const addNoteBtn = document.getElementById('addNoteBtn');
            const noteModal = document.getElementById('noteModal');
            const closeModalBtn = document.querySelector('.close-modal');
            const cancelNoteBtn = document.getElementById('cancelNoteBtn');
            const noteForm = document.getElementById('noteForm');
            const noteIdInput = document.getElementById('noteId');
            const noteTitleInput = document.getElementById('noteTitleInput');
            const noteContentInput = document.getElementById('noteContentInput');
            const modalTitle = document.getElementById('modalTitle');
            
            // Загружаем заметки при загрузке страницы
            loadNotes();
            
            // Открываем модальное окно для создания новой заметки
            addNoteBtn.addEventListener('click', () => openModal());
            
            // Закрываем модальное окно
            closeModalBtn.addEventListener('click', closeModal);
            cancelNoteBtn.addEventListener('click', closeModal);
            window.addEventListener('click', (e) => {
                if (e.target === noteModal) closeModal();
            });
            
            // Обработка отправки формы
            noteForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveNote();
            });
            
            // Функция загрузки заметок
            function loadNotes() {
                fetch('/hr/notes')
                    .then(response => response.json())
                    .then(data => {
                        if (data.notes && data.notes.length > 0) {
                            renderNotes(data.notes);
                        } else {
                            notesContainer.innerHTML = '<p>У вас пока нет заметок</p>';
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка загрузки заметок:', error);
                        notesContainer.innerHTML = '<p class="error">Ошибка загрузки заметок</p>';
                    });
            }
            
            // Функция отображения заметок
            function renderNotes(notes) {
                notesContainer.innerHTML = notes.map(note => `
                    <div class="note-card" data-id="${note.id}">
                        <h4>${note.title}</h4>
                        <div class="note-content">${note.content}</div>
                        <div class="note-date">${new Date(note.created_at).toLocaleString()}</div>
                        <div class="note-actions">
                            <button class="button secondary edit-btn">Редактировать</button>
                            <button class="button danger delete-btn">Удалить</button>
                        </div>
                    </div>
                `).join('');
                
                // Добавляем обработчики для кнопок редактирования и удаления
                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const noteCard = this.closest('.note-card');
                        const noteId = noteCard.dataset.id;
                        editNote(noteId);
                    });
                });
                
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const noteCard = this.closest('.note-card');
                        const noteId = noteCard.dataset.id;
                        deleteNote(noteId);
                    });
                });
            }
            
            // Функция открытия модального окна
            function openModal(note = null) {
                if (note) {
                    modalTitle.textContent = 'Редактировать заметку';
                    noteIdInput.value = note.id;
                    noteTitleInput.value = note.title;
                    noteContentInput.value = note.content;
                } else {
                    modalTitle.textContent = 'Новая заметка';
                    noteIdInput.value = '';
                    noteTitleInput.value = '';
                    noteContentInput.value = '';
                }
                noteModal.style.display = 'block';
            }
            
            // Функция закрытия модального окна
            function closeModal() {
                noteModal.style.display = 'none';
            }
            
            // Функция сохранения заметки
            function saveNote() {
                const noteId = noteIdInput.value;
                const title = noteTitleInput.value.trim();
                const content = noteContentInput.value.trim();
                
                if (!title || !content) {
                    alert('Заполните все поля');
                    return;
                }
                
                const url = noteId ? `/hr/notes/${noteId}` : '/hr/notes';
                const method = noteId ? 'PUT' : 'POST';
                
                fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: title,
                        content: content
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        closeModal();
                        loadNotes();
                    } else {
                        alert(data.error || 'Ошибка при сохранении заметки');
                    }
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    alert('Произошла ошибка при сохранении заметки');
                });
            }
            
            // Функция редактирования заметки
            function editNote(noteId) {
                fetch('/hr/notes')
                    .then(response => response.json())
                    .then(data => {
                        const note = data.notes.find(n => n.id == noteId);
                        if (note) openModal(note);
                    })
                    .catch(error => {
                        console.error('Ошибка:', error);
                        alert('Не удалось загрузить заметку для редактирования');
                    });
            }
            
            // Функция удаления заметки
            function deleteNote(noteId) {
                if (confirm('Вы уверены, что хотите удалить эту заметку?')) {
                    fetch(`/hr/notes/${noteId}`, {
                        method: 'DELETE'
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            loadNotes();
                        } else {
                            alert(data.error || 'Ошибка при удалении заметки');
                        }
                    })
                    .catch(error => {
                        console.error('Ошибка:', error);
                        alert('Произошла ошибка при удалении заметки');
                    });
                }
            }
        });
                 // Функция для назначения теста "Резюме"
                 function assignResumeTest(testId, candidateId) {
                    fetch("{{ url_for('assign_test') }}", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            test_id: testId,
                            candidate_id: candidateId
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Тест "Резюме" успешно назначен кандидату!');
                            location.reload();
                        } else {
                            alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Произошла ошибка при назначении теста');
                    });
                }
        
                // Заглушка для функции сравнения кандидатов
                function compareCandidates() {
                    alert('Функция сравнения кандидатов будет реализована в ближайшее время');
                    // Здесь будет реализация сравнения кандидатов
                }
                
                // Модальное окно
                const modal = document.getElementById("evaluationModal");
                const span = document.getElementsByClassName("close")[0];
                const evaluationForm = document.getElementById("evaluationForm");
        
                // Функция для открытия модального окна
                async function hireCandidate(candidateId) {
                    document.getElementById("candidateId").value = candidateId;
                    modal.style.display = "block";
                    evaluationForm.reset();
                }
        
                // Функция для закрытия модального окна
                function closeModal() {
                    modal.style.display = "none";
                }
        
                // Закрытие при клике на крестик
                span.onclick = closeModal;
        
                // Закрытие при клике вне окна
                window.onclick = function(event) {
                    if (event.target == modal) {
                        closeModal();
                    }
                }
        
                // Обработка отправки формы оценки
                evaluationForm.onsubmit = async function(e) {
                    e.preventDefault();
                    
                    const candidateId = document.getElementById("candidateId").value;
                    const position = document.getElementById("position").value;
                    const creativity = document.getElementById("creativity").value;
                    const tech_skills = document.getElementById("tech_skills").value;
                    const communication = document.getElementById("communication").value;
                    const time_management = document.getElementById("time_management").value;
                    const teamwork = document.getElementById("teamwork").value;
                    
                    if (!creativity || !tech_skills || !communication || !time_management || !teamwork || !position) {
                        alert("Пожалуйста, заполните все поля!");
                        return;
                    }
                    
                    const evaluationData = {
                        position: position,
                        creativity: creativity,
                        tech_skills: tech_skills,
                        communication: communication,
                        time_management: time_management,
                        teamwork: teamwork
                    };
                    
                    try {
                        const response = await fetch(`/hire_candidate/${candidateId}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(evaluationData)
                        });
                        
                        const result = await response.json();
                        
                        if (response.ok) {
                            alert('Кандидат успешно принят в штат!');
                            closeModal();
                            location.reload();
                        } else {
                            alert(`Ошибка: ${result.error || 'Неизвестная ошибка'}`);
                        }
                    } catch (error) {
                        console.error('Network error:', error);
                        alert('Произошла ошибка соединения с сервером');
                    }
                };
        
                // Функция для отклонения кандидата
                async function rejectCandidate(candidateId) {
                    if (confirm('Вы уверены, что хотите отклонить этого кандидата?')) {
                        try {
                            const response = await fetch(`/reject_candidate/${candidateId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                }
                            });
                            
                            if (response.ok) {
                                alert('Кандидат отклонен');
                                location.reload();
                            } else {
                                alert('Ошибка при отклонении кандидата');
                            }
                        } catch (error) {
                            console.error('Error:', error);
                            alert('Произошла ошибка');
                        }
                    }
                }
        
                // Функция для назначения теста
                function assignTest(testId) {
                    const candidateId = document.getElementById(`candidate_${testId}`).value;
                    
                    fetch("{{ url_for('assign_test') }}", {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            test_id: testId,
                            candidate_id: candidateId
                        })
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            alert('Тест успешно назначен!');
                            location.reload();
                        } else {
                            alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('Произошла ошибка');
                    });
                }
        
                // Функция для удаления теста
                function deleteTest(testId) {
                    if (confirm('Вы уверены, что хотите удалить этот тест? Все связанные вопросы и результаты также будут удалены.')) {
                        fetch(`/hr/delete_test/${testId}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            }
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                alert('Тест успешно удален');
                                location.reload();
                            } else {
                                alert('Ошибка: ' + (data.error || 'Неизвестная ошибка'));
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Произошла ошибка при удалении теста');
                        });
                    }
                }
                //Функция для Мониторинга поиска работы сотрудниками
        
                document.addEventListener('DOMContentLoaded', async () => {
                    const searchCandidatesBtn = document.getElementById('searchCandidatesBtn');
                    const vacancySearchInput = document.getElementById('vacancySearch');
                    const candidatesResults = document.getElementById('candidatesResults');
        
                    // Функция для получения данных через CORS-прокси
                    async function fetchWithProxy(url) {
                        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
                        try {
                            const response = await fetch(proxyUrl + url, {
                                headers: {
                                    'X-Requested-With': 'XMLHttpRequest'
                                }
                            });
                            return await response.json();
                        } catch (error) {
                            console.error('Ошибка при запросе:', error);
                            throw error;
                        }
                    }
        
                    // Парсинг результатов поиска HH.ru
                    function parseHHResults(html) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const items = doc.querySelectorAll('.resume-search-item');
                        
                        return Array.from(items).slice(0, 5).map(item => {
                            const title = item.querySelector('.resume-search-item__name a')?.textContent.trim() || 'Не указано';
                            const url = item.querySelector('.resume-search-item__name a')?.href || '#';
                            const age = item.querySelector('.resume-search-item__age')?.textContent.trim().replace('Возраст: ', '') || 'Не указан';
                            const salary = item.querySelector('.resume-search-item__compensation')?.textContent.trim() || 'Не указана';
                            const experience = item.querySelector('.resume-search-item__description-content')?.textContent.trim() || 'Не указан';
                            const skills = Array.from(item.querySelectorAll('.bloko-tag__section_text')).map(el => el.textContent.trim()).join(', ') || 'Не указаны';
                            
                            return {
                                title,
                                url: url.startsWith('http') ? url : `https://hh.ru${url}`,
                                age,
                                salary,
                                experience,
                                skills
                            };
                        });
                    }
        
                    searchCandidatesBtn.addEventListener('click', async () => {
                        const vacancyText = vacancySearchInput.value.trim();
                        
                        if (!vacancyText) {
                            candidatesResults.innerHTML = '<p class="error">Введите название вакансии</p>';
                            return;
                        }
        
                        candidatesResults.innerHTML = '<p>Ищем лучших кандидатов на HH.ru...</p>';
        
                        try {
                            // Формируем URL для поиска на HH.ru
                            const searchUrl = `https://hh.ru/search/resume?text=${encodeURIComponent(vacancyText)}&area=1&order_by=relevance`;
                            
                            // Получаем HTML страницы через прокси
                            const response = await fetchWithProxy(searchUrl);
                            const html = response.contents; // Получаем HTML содержимое
                            
                            // Парсим результаты
                            const candidates = parseHHResults(html);
                            
                            if (candidates.length === 0) {
                                candidatesResults.innerHTML = '<p class="error">Не найдено подходящих резюме. Попробуйте изменить параметры поиска.</p>';
                                return;
                            }
        
                            // Отображаем кандидатов
                            displayCandidates(candidates);
                            
                        } catch (error) {
                            candidatesResults.innerHTML = `
                                <p class="error">Ошибка при поиске кандидатов: ${error.message}</p>
                                <p>Попробуйте выполнить поиск напрямую на <a href="https://hh.ru/search/resume?text=${encodeURIComponent(vacancyText)}" target="_blank">HH.ru</a></p>
                            `;
                            console.error(error);
                        }
                    });
        
                    function displayCandidates(candidates) {
                        let html = '<h3>Топ-5 кандидатов:</h3><div class="candidates-list">';
                        
                        candidates.forEach(candidate => {
                            html += `
                                <div class="candidate-card">
                                    <h3>${candidate.title}</h3>
                                    <div class="candidate-info">
                                        <p><strong>Возраст:</strong> ${candidate.age}</p>
                                        <p><strong>Зарплатные ожидания:</strong> ${candidate.salary}</p>
                                        <p><strong>Опыт:</strong> ${candidate.experience}</p>
                                        <p><strong>Навыки:</strong> ${candidate.skills}</p>
                                    </div>
                                    <div class="candidate-actions">
                                        <a href="${candidate.url}" target="_blank" class="contact-button view-resume">Резюме</a>
                                        <a href="https://hh.ru/employer/vacancy_response?resumeHash=${candidate.url.split('/').pop()}" 
                                           target="_blank" 
                                           class="contact-button">Пригласить</a>
                                    </div>
                                </div>
                            `;
                        });
                        
                        html += '</div>';
                        candidatesResults.innerHTML = html;
                    }
                });
        
        //функция поиска сотрудников
        document.addEventListener('DOMContentLoaded', async () => {
            const CLIENT_ID = 'RV5EKQCQ9TKN9BKAHHHL34IRT89M5F1ONKOSHVR0B81JC470HS4T3T8PMKI75830';
            const CLIENT_SECRET = 'IUEACOR6PMO2P3U398C1GTS6FRN3LVA20JMJAL1E3FM0FNNHFD85MDM9Q4LUOS5T';
            let ACCESS_TOKEN = await getAccessToken();
        
            // Поиск кандидатов
            const searchCandidatesBtn = document.getElementById('searchCandidatesBtn');
            const vacancySearchInput = document.getElementById('vacancySearch');
            const candidatesResults = document.getElementById('candidatesResults');
        
            async function getAccessToken() {
                const response = await fetch('https://hh.ru/oauth/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams({
                        grant_type: 'client_credentials',
                        client_id: CLIENT_ID,
                        client_secret: CLIENT_SECRET
                    })
                });
                
                if (!response.ok) {
                    throw new Error('Ошибка авторизации в HH API');
                }
                
                return (await response.json()).access_token;
            }
        
            searchCandidatesBtn.addEventListener('click', async () => {
                const vacancyText = vacancySearchInput.value.trim();
                
                if (!vacancyText) {
                    candidatesResults.innerHTML = '<p class="error">Введите название вакансии</p>';
                    return;
                }
        
                candidatesResults.innerHTML = '<p>Ищем лучших кандидатов...</p>';
        
                try {
                    // Обновляем токен если нужно
                    if (!ACCESS_TOKEN) {
                        ACCESS_TOKEN = await getAccessToken();
                    }
        
                    // Ищем вакансии чтобы получить профессиональную область
                    const vacancies = await searchVacancies(vacancyText);
                    if (vacancies.length === 0) {
                        candidatesResults.innerHTML = '<p class="error">Не найдено вакансий по вашему запросу</p>';
                        return;
                    }
        
                    // Берем профессиональную область из первой вакансии
                    const professionalRole = vacancies[0].professional_roles[0].id;
                    
                    // Ищем резюме по профессиональной области
                    const resumes = await searchResumesByRole(professionalRole);
                    
                    if (resumes.length === 0) {
                        candidatesResults.innerHTML = '<p class="error">Не найдено подходящих резюме</p>';
                        return;
                    }
        
                    // Отображаем топ-5 кандидатов
                    displayCandidates(resumes.slice(0, 5));
                    
                } catch (error) {
                    candidatesResults.innerHTML = `<p class="error">Ошибка: ${error.message}</p>`;
                    console.error(error);
                }
            });
        
            async function searchVacancies(text) {
                const url = `https://api.hh.ru/vacancies?text=${encodeURIComponent(text)}&per_page=1`;
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        'User-Agent': 'MyHRApp/1.0'
                    }
                });
        
                if (!response.ok) {
                    throw new Error(`Ошибка поиска вакансий: ${response.status}`);
                }
        
                return (await response.json()).items;
            }
        
            async function searchResumesByRole(roleId) {
                const url = `https://api.hh.ru/resumes?professional_role=${roleId}&per_page=50&order_by=publication_time`;
                const response = await fetch(url, {
                    headers: {
                        'Authorization': `Bearer ${ACCESS_TOKEN}`,
                        'User-Agent': 'MyHRApp/1.0'
                    }
                });
        
                if (!response.ok) {
                    throw new Error(`Ошибка поиска резюме: ${response.status}`);
                }
        
                const data = await response.json();
                return data.items.map(item => ({
                    id: item.id,
                    name: item.title,
                    age: item.age,
                    salary: item.salary ? `${item.salary.amount} ${item.salary.currency}` : 'Не указана',
                    experience: getTotalExperience(item.experience),
                    skills: item.skills.map(skill => skill.name).join(', '),
                    url: `https://hh.ru/resume/${item.id}`
                }));
            }
        
            function getTotalExperience(experience) {
                if (!experience || experience.length === 0) return 'Нет опыта';
                
                const totalMonths = experience.reduce((sum, exp) => {
                    const start = new Date(exp.start_date);
                    const end = exp.end_date ? new Date(exp.end_date) : new Date();
                    return sum + (end.getMonth() - start.getMonth() + 
                          (end.getFullYear() - start.getFullYear()) * 12);
                }, 0);
                
                const years = Math.floor(totalMonths / 12);
                const months = totalMonths % 12;
                
                return `${years} г. ${months} мес.`;
            }
        
            function displayCandidates(candidates) {
                let html = '<div class="candidates-list">';
                
                candidates.forEach(candidate => {
                    html += `
                        <div class="candidate-card">
                            <h3>${candidate.name}</h3>
                            <p>Возраст: ${candidate.age || 'Не указан'}</p>
                            <p>Опыт работы: ${candidate.experience}</p>
                            <p>Зарплатные ожидания: ${candidate.salary}</p>
                            <p>Ключевые навыки: ${candidate.skills || 'Не указаны'}</p>
                            <a href="${candidate.url}" target="_blank" class="button">Посмотреть резюме</a>
                            <button class="contact-button" onclick="contactCandidate('${candidate.id}')">Связаться</button>
                        </div>
                    `;
                });
                
                html += '</div>';
                candidatesResults.innerHTML = html;
            }
        
            window.contactCandidate = function(resumeId) {
                alert(`Функция связи с кандидатом ${resumeId} будет реализована позже`);
            };
        });