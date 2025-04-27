// document.addEventListener('DOMContentLoaded', function() {
//     // Элементы интерфейса
//     const editor = document.getElementById('editor');
//     const boldBtn = document.getElementById('boldBtn');
//     const italicBtn = document.getElementById('italicBtn');
//     const underlineBtn = document.getElementById('underlineBtn');
//     const insertTableBtn = document.getElementById('insertTableBtn');
//     const addCandidateBtn = document.getElementById('addCandidateBtn');
//     const compareBtn = document.getElementById('compareBtn');
//     const exportWord = document.getElementById('exportWord');
//     const exportPdf = document.getElementById('exportPdf');
    
//     // Модальные окна
//     const tableModal = document.getElementById('tableModal');
//     const candidateModal = document.getElementById('candidateModal');
//     const closeButtons = document.querySelectorAll('.close');
    
//     // Форматирование текста
//     boldBtn.addEventListener('click', () => document.execCommand('bold', false, null));
//     italicBtn.addEventListener('click', () => document.execCommand('italic', false, null));
//     underlineBtn.addEventListener('click', () => document.execCommand('underline', false, null));
    
//     // Открытие/закрытие модальных окон
//     insertTableBtn.addEventListener('click', () => tableModal.style.display = 'block');
//     addCandidateBtn.addEventListener('click', () => candidateModal.style.display = 'block');
//     closeButtons.forEach(btn => {
//         btn.addEventListener('click', function() {
//             this.closest('.modal').style.display = 'none';
//         });
//     });
    
//     // Вставка таблицы
//     document.getElementById('insertTableConfirm').addEventListener('click', function() {
//         const rows = parseInt(document.getElementById('rows').value);
//         const cols = parseInt(document.getElementById('cols').value);
        
//         let tableHtml = '<table><tbody>';
//         for (let i = 0; i < rows; i++) {
//             tableHtml += '<tr>';
//             for (let j = 0; j < cols; j++) {
//                 tableHtml += '<td contenteditable="true">Ячейка</td>';
//             }
//             tableHtml += '</tr>';
//         }
//         tableHtml += '</tbody></table>';
        
//         insertHtmlAtCursor(tableHtml);
//         tableModal.style.display = 'none';
//     });
    
//     // Добавление кандидата
//     document.getElementById('addCandidateConfirm').addEventListener('click', function() {
//         const name = document.getElementById('candidateName').value;
//         const results = document.getElementById('candidateResults').value;
        
//         if (name) {
//             const candidateHtml = `
//                 <div class="candidate-section">
//                     <h3>Кандидат: ${name}</h3>
//                     <p>${results}</p>
//                 </div>
//             `;
//             insertHtmlAtCursor(candidateHtml);
//             candidateModal.style.display = 'none';
            
//             // Очищаем поля
//             document.getElementById('candidateName').value = '';
//             document.getElementById('candidateResults').value = '';
//         }
//     });
    
//     // Сравнение кандидатов
//     compareBtn.addEventListener('click', function() {
//         const candidates = document.querySelectorAll('.candidate-section');
//         if (candidates.length < 2) {
//             alert('Добавьте хотя бы двух кандидатов для сравнения');
//             return;
//         }
        
//         let comparisonHtml = '<table class="comparison-table"><thead><tr><th>Критерий</th>';
//         const criteria = [];
        
//         candidates.forEach(cand => {
//             const name = cand.querySelector('h3').textContent.replace('Кандидат: ', '');
//             comparisonHtml += `<th class="comparison-header">${name}</th>`;
            
//             // Извлекаем критерии из текста
//             const text = cand.querySelector('p').textContent;
//             text.split('\n').forEach(line => {
//                 if (line.includes(':')) {
//                     const [criterion] = line.split(':');
//                     if (!criteria.includes(criterion.trim())) {
//                         criteria.push(criterion.trim());
//                     }
//                 }
//             });
//         });
        
//         comparisonHtml += '</tr></thead><tbody>';
        
//         criteria.forEach(criterion => {
//             comparisonHtml += `<tr><td>${criterion}</td>`;
//             candidates.forEach(cand => {
//                 const text = cand.querySelector('p').textContent;
//                 const lines = text.split('\n');
//                 let value = '-';
                
//                 for (const line of lines) {
//                     if (line.includes(criterion + ':')) {
//                         value = line.split(':')[1].trim();
//                         break;
//                     }
//                 }
                
//                 comparisonHtml += `<td>${value}</td>`;
//             });
//             comparisonHtml += '</tr>';
//         });
        
//         comparisonHtml += '</tbody></table>';
//         insertHtmlAtCursor(comparisonHtml);
//     });
    
//     // Экспорт в Word
//     exportWord.addEventListener('click', function() {
//         const { jsPDF } = window.jspdf;
//         const content = editor.innerHTML;
        
//         // Создаем временный элемент для обработки HTML
//         const tempDiv = document.createElement('div');
//         tempDiv.innerHTML = content;
        
//         // Удаляем атрибуты contenteditable
//         tempDiv.querySelectorAll('[contenteditable]').forEach(el => {
//             el.removeAttribute('contenteditable');
//         });
        
//         // Формируем HTML для экспорта
//         const exportHtml = `
//             <!DOCTYPE html>
//             <html>
//             <head>
//                 <meta charset="UTF-8">
//                 <style>
//                     body { font-family: Arial, sans-serif; }
//                     table { border-collapse: collapse; width: 100%; }
//                     table, th, td { border: 1px solid #ddd; }
//                     th, td { padding: 8px; text-align: left; }
//                 </style>
//             </head>
//             <body>
//                 ${tempDiv.innerHTML}
//             </body>
//             </html>
//         `;
        
//         // Создаем Blob и скачиваем
//         const blob = new Blob([exportHtml], { type: 'application/msword' });
//         const url = URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = 'report.doc';
//         document.body.appendChild(a);
//         a.click();
//         document.body.removeChild(a);
//         URL.revokeObjectURL(url);
//     });
    
//     // Экспорт в PDF
//     exportPdf.addEventListener('click', function() {
//         const { jsPDF } = window.jspdf;
//         const doc = new jsPDF();
        
//         // Получаем текст из редактора (без HTML тегов)
//         const content = editor.innerText || editor.textContent;
        
//         // Разбиваем текст на страницы
//         const lines = doc.splitTextToSize(content, 180);
//         let y = 20;
        
//         lines.forEach(line => {
//             if (y > 280) { // Новая страница если достигнут низ
//                 doc.addPage();
//                 y = 20;
//             }
//             doc.text(line, 15, y);
//             y += 7;
//         });
        
//         doc.save('report.pdf');
//     });
    
//     // Вспомогательная функция для вставки HTML в текущую позицию курсора
//     function insertHtmlAtCursor(html) {
//         const selection = window.getSelection();
//         if (selection.rangeCount) {
//             const range = selection.getRangeAt(0);
//             range.deleteContents();
            
//             const div = document.createElement('div');
//             div.innerHTML = html;
//             const frag = document.createDocumentFragment();
            
//             while (div.firstChild) {
//                 frag.appendChild(div.firstChild);
//             }
            
//             range.insertNode(frag);
//             // Помещаем курсор после вставленного контента
//             range.setStartAfter(frag.lastChild);
//             range.collapse(true);
//             selection.removeAllRanges();
//             selection.addRange(range);
//         } else {
//             editor.innerHTML += html;
//         }
//     }
// });