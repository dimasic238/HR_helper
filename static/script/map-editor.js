const canvas = document.querySelector("canvas"),
    toolBtns = document.querySelectorAll(".tool"),
    fillColor = document.querySelector("#fill-color"),
    sizeSlider = document.querySelector("#size-slider"),
    colorBtns = document.querySelectorAll(".colors .option"),
    colorPicker = document.querySelector("#color-picker"),
    clearCanvas = document.querySelector(".clear-canvas"),
    saveMapBtn = document.querySelector(".save-map"),
    mapNameInput = document.querySelector("#map-name"),
    ctx = canvas.getContext("2d");

let prevMouseX, prevMouseY, snapshot,
    isDrawing = false,
    selectedTool = "brush",
    brushWidth = 5,
    selectedColor = "#000",
    currentMapId = (`{{ map.id if map else 'null' }}`);

// Установка фона холста
const setCanvasBackground = () => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = selectedColor;
}

// Загрузка существующего изображения
const loadImage = (imageData) => {
    const img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageData;
}

// Инициализация холста
const initCanvas = () => {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    setCanvasBackground();
    
    if (currentMapId && '{{ map.image_data if map else "" }}') {
        loadImage('{{ map.image_data if map else "" }}');
    }
}

// Функции для рисования форм
const drawRect = (e) => {
    if (!fillColor.checked) {
        return ctx.strokeRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
    }
    ctx.fillRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
}

const drawCircle = (e) => {
    ctx.beginPath();
    let radius = Math.sqrt(Math.pow((prevMouseX - e.offsetX), 2) + Math.pow((prevMouseY - e.offsetY), 2));
    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
    fillColor.checked ? ctx.fill() : ctx.stroke();
}

const drawTriangle = (e) => {
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.lineTo(prevMouseX * 2 - e.offsetX, e.offsetY);
    ctx.closePath();
    fillColor.checked ? ctx.fill() : ctx.stroke();
}

// Обработчики инструментов
toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".options .active").classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;
    });
});

// Изменение размера кисти
sizeSlider.addEventListener("input", () => brushWidth = sizeSlider.value);

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
    
    const url = currentMapId ? `/update_map/${currentMapId}` : '/create_map';
    const method = currentMapId ? 'PUT' : 'POST';

    fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: name,
            image_data: imageData
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
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
        alert('Ошибка при сохранении: ' + (error.message || 'Проверьте консоль для деталей'));
    });
});

// Рисование на холсте
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

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", () => isDrawing = false);

// Инициализация
window.addEventListener("load", initCanvas);