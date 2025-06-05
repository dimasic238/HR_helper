document.addEventListener('DOMContentLoaded', function() {
    // Инициализация элементов интерфейса
    const notesContainer = document.getElementById('notesContainer');
    const addNoteBtn = document.getElementById('addNoteBtn');
    
    // Загрузка данных при старте
    loadNotes();
    
    // Назначение обработчиков событий
    addNoteBtn.addEventListener('click', openModal);
});
