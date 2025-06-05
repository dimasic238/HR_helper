// Экспорт в PDF через html2pdf.js
exportPdf.addEventListener('click', function() {
    const opt = {
        margin: 10,
        filename: `${title}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    const content = document.createElement('div');
    content.innerHTML = `<h1>${title}</h1>${editor.innerHTML}`;
    
    html2pdf().from(content).set(opt).save();
});

// Экспорт в Word через Blob API
exportWord.addEventListener('click', function() {
    const html = `<!DOCTYPE html><html>...</html>`;
    const blob = new Blob([html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}.doc`;
    document.body.appendChild(a);
    a.click();
});

// Сохранение в базу данных через Fetch API
fetch('/api/save_report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: title, content: editor.innerHTML })
})
