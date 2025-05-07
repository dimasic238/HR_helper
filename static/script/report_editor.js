document.addEventListener('DOMContentLoaded', function() {
    // Элементы интерфейса
    const editor = document.getElementById('editor');
    const reportTitle = document.getElementById('reportTitle');
    const boldBtn = document.getElementById('boldBtn');
    const italicBtn = document.getElementById('italicBtn');
    const underlineBtn = document.getElementById('underlineBtn');
    const fontSizeSelect = document.getElementById('fontSize');
    const insertTableBtn = document.getElementById('insertTableBtn');
    const compareCandidatesBtn = document.getElementById('compareCandidatesBtn');
    const saveReportBtn = document.getElementById('saveReportBtn');
    const exportWord = document.getElementById('exportWord');
    const exportPdf = document.getElementById('exportPdf');
    const addCriteriaBtn = document.getElementById('addCriteriaBtn');
    
    // Модальные окна
    const tableModal = document.getElementById('tableModal');
    const compareModal = document.getElementById('compareModal');
    const closeButtons = document.querySelectorAll('.close');
    
    // Текущая секция сравнения
    let currentComparisonSection = null;
    
    // Обновление состояния кнопок форматирования
    function updateButtonStates() {
        boldBtn.classList.toggle('active', document.queryCommandState('bold'));
        italicBtn.classList.toggle('active', document.queryCommandState('italic'));
        underlineBtn.classList.toggle('active', document.queryCommandState('underline'));
    }
    
    // Форматирование текста
    boldBtn.addEventListener('click', () => {
        document.execCommand('bold', false, null);
        updateButtonStates();
    });
    
    italicBtn.addEventListener('click', () => {
        document.execCommand('italic', false, null);
        updateButtonStates();
    });
    
    underlineBtn.addEventListener('click', () => {
        document.execCommand('underline', false, null);
        updateButtonStates();
    });
    
    // Размер шрифта (исправленная версия)
    fontSizeSelect.addEventListener('change', function() {
        const size = this.value;
        if (size) {
            const selection = window.getSelection();
            if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const span = document.createElement('span');
                span.style.fontSize = size;
                
                // Если есть выделение, применяем к нему
                if (!range.collapsed) {
                    range.surroundContents(span);
                } else {
                    // Если нет выделения, создаем новый span для следующего ввода
                    span.innerHTML = '&nbsp;';
                    range.insertNode(span);
                    range.setStartAfter(span);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        }
    });
    
    // Отслеживаем изменения выделения для обновления кнопок
    document.addEventListener('selectionchange', updateButtonStates);
    
    // Открытие/закрытие модальных окон
    insertTableBtn.addEventListener('click', () => tableModal.style.display = 'block');
    compareCandidatesBtn.addEventListener('click', () => {
        loadCandidates();
        compareModal.style.display = 'block';
    });
    
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Закрытие модальных окон при клике вне их
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
    
    // Вставка таблицы
    document.getElementById('insertTableConfirm').addEventListener('click', function() {
        const rows = parseInt(document.getElementById('rows').value);
        const cols = parseInt(document.getElementById('cols').value);
        
        let tableHtml = '<table><tbody>';
        for (let i = 0; i < rows; i++) {
            tableHtml += '<tr>';
            for (let j = 0; j < cols; j++) {
                tableHtml += '<td contenteditable="true">Ячейка</td>';
            }
            tableHtml += '</tr>';
        }
        tableHtml += '</tbody></table>';
        
        insertHtmlAtCursor(tableHtml);
        tableModal.style.display = 'none';
    });
    
    // Добавление критериев в модальном окне
    document.getElementById('addCriteriaModalBtn').addEventListener('click', function() {
        const criteriaContainer = document.getElementById('criteriaContainer');
        const newItem = document.createElement('div');
        newItem.className = 'criteria-item';
        newItem.innerHTML = `
            <input type="text" class="criteria-input" placeholder="Название критерия">
            <span class="remove-criteria">✕</span>
        `;
        criteriaContainer.appendChild(newItem);
        
        // Добавляем обработчик удаления
        newItem.querySelector('.remove-criteria').addEventListener('click', function() {
            if (criteriaContainer.children.length > 1) {
                criteriaContainer.removeChild(newItem);
            }
        });
    });
    
    // Удаление критериев в модальном окне
    document.querySelectorAll('.remove-criteria').forEach(btn => {
        btn.addEventListener('click', function() {
            if (document.getElementById('criteriaContainer').children.length > 1) {
                this.parentNode.remove();
            }
        });
    });
    
    // Сравнение кандидатов
    document.getElementById('compareConfirm').addEventListener('click', function() {
        // Получаем выбранных кандидатов
        const selectedCandidates = Array.from(document.querySelectorAll('.candidate-item.selected'))
            .map(el => ({
                id: el.dataset.id,
                name: el.dataset.name,
                email: el.dataset.email,
                phone: el.dataset.phone,
                status: el.dataset.status
            }));
        
        // Получаем критерии
        const criteria = Array.from(document.querySelectorAll('.criteria-input'))
            .map(input => input.value.trim())
            .filter(c => c);
        
        // Проверки
        if (selectedCandidates.length < 2) {
            alert('Выберите хотя бы двух кандидатов для сравнения');
            return;
        }
        
        if (criteria.length === 0) {
            alert('Укажите хотя бы один критерий для сравнения');
            return;
        }
        
        // Создаем HTML для таблицы сравнения
        const comparisonHtml = generateComparisonTable(selectedCandidates, criteria);
        
        // Вставляем HTML в основной редактор
        insertHtmlAtCursor(comparisonHtml);
        
        // Очищаем модальное окно
        document.querySelectorAll('.candidate-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Закрываем модальное окно
        compareModal.style.display = 'none';
        
        // Показываем кнопку "Добавить критерий" в основном тулбаре
        addCriteriaBtn.style.display = 'inline-block';
        currentComparisonSection = document.querySelector('.comparison-section:last-child');
    });

    // Функция генерации таблицы сравнения
    function generateComparisonTable(candidates, criteria) {
        let html = `
            <div class="comparison-section">
                <h3>Сравнение кандидатов</h3>
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>Критерий</th>
        `;
        
        // Добавляем заголовки с именами кандидатов
        candidates.forEach(cand => {
            html += `<th>${cand.name}</th>`;
        });
        
        html += `</tr><tr><td>Контактные данные</td>`;
        
        // Добавляем контактные данные
        candidates.forEach(cand => {
            html += `<td>Телефон: ${cand.phone}<br>Email: ${cand.email}<br>Статус: ${cand.status}</td>`;
        });
        
        html += `</tr></thead><tbody>`;
        
        // Добавляем строки с критериями
        criteria.forEach(criterion => {
            html += `<tr><td>${criterion}</td>`;
            candidates.forEach(() => {
                html += `<td contenteditable="true">-</td>`;
            });
            html += `</tr>`;
        });
        
        html += `
                    </tbody>
                </table>
                <div class="conclusion" contenteditable="true">Вывод после сравнения кандидатов:</div>
            </div>
            <p><br></p>
        `;
        
        return html;
    }
    
    // Добавление критерия через кнопку в тулбаре
    addCriteriaBtn.addEventListener('click', function() {
        const comparisonSection = document.querySelector('.comparison-section:last-child');
        if (!comparisonSection) {
            alert('Нет таблицы сравнения для добавления критерия');
            return;
        }
        
        const table = comparisonSection.querySelector('table tbody');
        const candidatesCount = comparisonSection.querySelector('thead tr').cells.length - 1;
        
        const newRow = document.createElement('tr');
        newRow.innerHTML = '<td contenteditable="true">Новый критерий</td>';
        
        for (let i = 0; i < candidatesCount; i++) {
            newRow.innerHTML += '<td contenteditable="true">-</td>';
        }
        
        table.appendChild(newRow);
    });
    
    // Сохранение отчета
    saveReportBtn.addEventListener('click', function() {
        const title = reportTitle.value.trim();
        const content = editor.innerHTML;
        
        if (!title) {
            alert('Введите название отчета');
            return;
        }
        
        // Отправка данных на сервер
        fetch('/api/save_report', {
            method: 'POST',
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
                alert('Отчет успешно сохранен');
            } else {
                alert('Ошибка при сохранении отчета: ' + (data.error || 'Неизвестная ошибка'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Произошла ошибка при сохранении отчета');
        });
    });
    
    // Экспорт в Word
    exportWord.addEventListener('click', function() {
        const title = reportTitle.value.trim() || 'Отчет';
        const content = editor.innerHTML;
        
        // Создаем HTML документ
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { border-collapse: collapse; width: 100%; }
                    table, th, td { border: 1px solid #ddd; }
                    th, td { padding: 8px; text-align: left; }
                    .comparison-section { margin-bottom: 20px; }
                    .conclusion { margin-top: 15px; padding: 10px; border-top: 1px solid #ddd; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                ${content}
            </body>
            </html>
        `;
        
        // Создаем Blob и скачиваем
        const blob = new Blob([html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
    
    // Экспорт в PDF
    exportPdf.addEventListener('click', function() {
        const title = reportTitle.value.trim() || 'Отчет';
        // Используем html2pdf.js для более качественного PDF
        const opt = {
            margin: 10,
            filename: `${title}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // Создаем копию содержимого
        const content = document.createElement('div');
        content.innerHTML = `
            <h1>${title}</h1>
            ${editor.innerHTML}
        `;
        
        // Удаляем атрибуты contenteditable
        content.querySelectorAll('[contenteditable]').forEach(el => {
            el.removeAttribute('contenteditable');
        });
        
        // Используем html2pdf.js если доступен
        if (typeof html2pdf !== 'undefined') {
            html2pdf().from(content).set(opt).save();
        } else {
            alert('Библиотека html2pdf не загружена. PDF может быть неполным.');
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            doc.text(content.innerText, 10, 10);
            doc.save(`${title}.pdf`);
        }
    });
    
    // Загрузка списка кандидатов с сервера
    function loadCandidates() {
        const candidateList = document.getElementById('candidateList');
        candidateList.innerHTML = '<div class="loading">Загрузка кандидатов...</div>';
        
        // AJAX запрос к серверу для получения кандидатов текущего HR
        fetch('/api/hr_candidates')
            .then(response => response.json())
            .then(candidates => {
                candidateList.innerHTML = '';
                
                if (candidates.length === 0) {
                    candidateList.innerHTML = '<div class="no-candidates">Нет доступных кандидатов</div>';
                    return;
                }
                
                candidates.forEach(cand => {
                    const item = document.createElement('div');
                    item.className = 'candidate-item';
                    item.dataset.id = cand.id;
                    item.dataset.name = cand.name;
                    item.dataset.email = cand.email;
                    item.dataset.phone = cand.phone;
                    item.dataset.status = cand.status;
                    item.textContent = cand.name;
                    
                    item.addEventListener('click', function() {
                        this.classList.toggle('selected');
                    });
                    
                    candidateList.appendChild(item);
                });
            })
            .catch(error => {
                console.error('Ошибка загрузки кандидатов:', error);
                candidateList.innerHTML = '<div class="error">Ошибка загрузки кандидатов</div>';
            });
    }
    
    // Вспомогательная функция для вставки HTML в текущую позицию курсора
    function insertHtmlAtCursor(html) {
        const selection = window.getSelection();
        
        // Если есть выделение, вставляем в позицию курсора
        if (selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            
            const div = document.createElement('div');
            div.innerHTML = html;
            
            const frag = document.createDocumentFragment();
            while (div.firstChild) {
                frag.appendChild(div.firstChild);
            }
            
            range.insertNode(frag);
            
            // Устанавливаем курсор после вставленного содержимого
            const newRange = document.createRange();
            newRange.setStartAfter(frag.lastChild);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
        } else {
            // Если нет выделения, добавляем в конец редактора
            editor.insertAdjacentHTML('beforeend', html);
            
            // Прокручиваем к новому содержимому
            editor.scrollTop = editor.scrollHeight;
        }
        
        // Фокусируем редактор
        editor.focus();
    }
});
