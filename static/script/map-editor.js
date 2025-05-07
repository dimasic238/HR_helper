document.addEventListener("DOMContentLoaded", function() {
    const canvas = document.getElementById("drawing-canvas");
    const ctx = canvas.getContext("2d");
    const toolBtns = document.querySelectorAll(".tool");
    const fillColor = document.getElementById("fill-color");
    const sizeSlider = document.getElementById("size-slider");
    const colorBtns = document.querySelectorAll(".colors .option");
    const colorPicker = document.getElementById("color-picker");
    const clearCanvas = document.querySelector(".clear-canvas");
    const saveMapBtn = document.querySelector(".save-map");
    const mapNameInput = document.getElementById("map-name");
    const editorTitle = document.getElementById("editor-title");
    
    // Параметры рисования
    let prevMouseX, prevMouseY, snapshot,
        isDrawing = false,
        selectedTool = "brush",
        brushWidth = 5,
        selectedColor = "#000";
    
    // Установка белого фона
    const setCanvasBackground = () => {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = selectedColor;
    }
    
    // Инициализация холста
    const initCanvas = () => {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        setCanvasBackground();
        
        // Если есть карта для редактирования, загружаем её
        const mapData = "{{ map.image_data if map else '' }}";
        if (mapData) {
            const img = new Image();
            img.onload = function() {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = mapData;
            editorTitle.textContent = `Редактирование карты: {{ map.name }}`;
            mapNameInput.value = "{{ map.name }}";
        }
    }
    
    // Рисование прямоугольника
    const drawRect = (e) => {
        if (!fillColor.checked) {
            return ctx.strokeRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
        }
        ctx.fillRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
    }
    
    // Рисование круга
    const drawCircle = (e) => {
        ctx.beginPath();
        let radius = Math.sqrt(Math.pow((prevMouseX - e.offsetX), 2) + Math.pow((prevMouseY - e.offsetY), 2));
        ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
        fillColor.checked ? ctx.fill() : ctx.stroke();
    }
    
    // Рисование треугольника
    const drawTriangle = (e) => {
        ctx.beginPath();
        ctx.moveTo(prevMouseX, prevMouseY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.lineTo(prevMouseX * 2 - e.offsetX, e.offsetY);
        ctx.closePath();
        fillColor.checked ? ctx.fill() : ctx.stroke();
    }
    
    // Выбор инструмента
    toolBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelector(".options .active").classList.remove("active");
            btn.classList.add("active");
            selectedTool = btn.id;
        });
    });
    
    // Изменение размера кисти
    sizeSlider.addEventListener("input", () => {
        brushWidth = sizeSlider.value;
    });
    
    // Выбор цвета
    colorBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelector(".options .selected").classList.remove("selected");
            btn.classList.add("selected");
            selectedColor = window.getComputedStyle(btn).getPropertyValue("background-color");
        });
    });
    
    colorPicker.addEventListener("change", () => {
        colorPicker.parentElement.style.background = colorPicker.value;
        colorPicker.parentElement.click();
    });
    
    // Очистка холста
    clearCanvas.addEventListener("click", () => {
        if (confirm("Вы уверены, что хотите очистить холст?")) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            setCanvasBackground();
        }
    });
    
  // Сохранение карты
saveMapBtn.addEventListener("click", () => {
const name = mapNameInput.value.trim();
if (!name) {
alert("Введите название карты");
return;
}

const imageData = canvas.toDataURL("image/png");
const mapId = "{{ map.id if map else '' }}";

// Определяем URL и метод в зависимости от того, редактируем или создаем
const url = mapId ? `/update_map/${mapId}` : '/create_map';
const method = 'POST'; // Всегда используем POST

fetch(url, {
method: method,
headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // Добавляем заголовок для Flask
},
body: JSON.stringify({
    name: name,
    image_data: imageData
})
})
.then(response => {
if (!response.ok) {
    return response.text().then(text => { throw new Error(text) });
}
return response.json();
})
.then(data => {
if (data.success) {
    window.location.href = "{{ url_for('maps') }}";
} else {
    alert('Ошибка при сохранении: ' + (data.error || 'Неизвестная ошибка'));
}
})
.catch(error => {
console.error('Error:', error);
alert('Ошибка при сохранении. Проверьте консоль для деталей.');
});
});

    
    // Начало рисования
    const startDraw = (e) => {
        isDrawing = true;
        prevMouseX = e.offsetX;
        prevMouseY = e.offsetY;
        ctx.beginPath();
        ctx.lineWidth = brushWidth;
        ctx.strokeStyle = selectedColor;
        ctx.fillStyle = selectedColor;
        snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    }
    
    // Процесс рисования
    const drawing = (e) => {
        if (!isDrawing) return;
        ctx.putImageData(snapshot, 0, 0);
        
        if (selectedTool === "brush" || selectedTool === "eraser") {
            ctx.strokeStyle = selectedTool === "eraser" ? "#fff" : selectedColor;
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
        } else if (selectedTool === "rectangle") {
            drawRect(e);
        } else if (selectedTool === "circle") {
            drawCircle(e);
        } else if (selectedTool === "triangle") {
            drawTriangle(e);
        }
    }
    
    // Окончание рисования
    const endDrawing = () => {
        isDrawing = false;
    }
    
    // Назначение обработчиков событий
    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", drawing);
    canvas.addEventListener("mouseup", endDrawing);
    canvas.addEventListener("mouseout", endDrawing);
    
    // Инициализация при загрузке
    window.addEventListener("load", initCanvas);
});