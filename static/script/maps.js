document.addEventListener("DOMContentLoaded", function() {
    // Элементы интерфейса
    const canvas = document.getElementById("guide-canvas");
    const ctx = canvas.getContext("2d");
    const editorModal = document.getElementById("guide-editor-modal");
    const createGuideBtn = document.getElementById("create-guide");
    const editGuideBtns = document.querySelectorAll(".edit-guide");
    const saveGuideBtn = document.getElementById("save-guide");
    const cancelGuideBtn = document.getElementById("cancel-guide");
    const clearCanvasBtn = document.getElementById("clear-canvas");
    const guideNameInput = document.getElementById("guide-name");
    const drawToolBtn = document.getElementById("draw-tool");
    const rectToolBtn = document.getElementById("rect-tool");
    const textToolBtn = document.getElementById("text-tool");
    const eraserBtn = document.getElementById("eraser");
    const drawColorInput = document.getElementById("draw-color");
    const lineWidthInput = document.getElementById("line-width");
    const closeBtn = document.querySelector(".close");
    
    // Переменные состояния
    let isDrawing = false;
    let currentTool = "draw";
    let currentColor = "#000000";
    let lineWidth = 3;
    let startX, startY;
    let currentMapId = null;
    let savedMaps = [];

    // Настройка canvas
    function setupCanvas() {
        canvas.width = 800;
        canvas.height = 600;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Инициализация
    setupCanvas();

    // Открытие модального окна для создания нового путеводителя
    createGuideBtn.addEventListener("click", function() {
        currentMapId = null;
        guideNameInput.value = "";
        setupCanvas();
        document.getElementById("editor-title").textContent = "Создание путеводителя";
        editorModal.style.display = "block";
    });

    // Открытие модального окна для редактирования существующего путеводителя
    editGuideBtns.forEach(btn => {
        btn.addEventListener("click", function() {
            const guideItem = this.closest(".guide-item");
            currentMapId = guideItem.dataset.mapId;
            const map = savedMaps.find(m => m.id == currentMapId);
            
            if (map) {
                guideNameInput.value = map.name;
                loadCanvasFromImage(map.image_data);
                document.getElementById("editor-title").textContent = "Редактирование путеводителя";
                editorModal.style.display = "block";
            }
        });
    });

    // Загрузка изображения на canvas
    function loadCanvasFromImage(imageData) {
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = imageData;
    }

    // Обработчики инструментов
    drawToolBtn.addEventListener("click", function() {
        currentTool = "draw";
        updateToolButtons();
    });

    rectToolBtn.addEventListener("click", function() {
        currentTool = "rect";
        updateToolButtons();
    });

    textToolBtn.addEventListener("click", function() {
        currentTool = "text";
        updateToolButtons();
    });

    eraserBtn.addEventListener("click", function() {
        currentTool = "eraser";
        updateToolButtons();
    });

    function updateToolButtons() {
        [drawToolBtn, rectToolBtn, textToolBtn, eraserBtn].forEach(btn => {
            btn.classList.remove("active");
        });
        
        switch(currentTool) {
            case "draw": drawToolBtn.classList.add("active"); break;
            case "rect": rectToolBtn.classList.add("active"); break;
            case "text": textToolBtn.classList.add("active"); break;
            case "eraser": eraserBtn.classList.add("active"); break;
        }
    }

    // Обработчики событий canvas
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);

    drawColorInput.addEventListener("input", function() {
        currentColor = this.value;
    });

    lineWidthInput.addEventListener("input", function() {
        lineWidth = this.value;
    });

    function startDrawing(e) {
        isDrawing = true;
        startX = e.offsetX;
        startY = e.offsetY;
        
        if (currentTool === "text") {
            const text = prompt("Введите текст:", "");
            if (text) {
                ctx.font = `${lineWidth * 5}px Arial`;
                ctx.fillStyle = currentTool === "eraser" ? "#ffffff" : currentColor;
                ctx.fillText(text, startX, startY);
            }
            isDrawing = false;
        } else {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.strokeStyle = currentTool === "eraser" ? "#ffffff" : currentColor;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        }
    }

    function draw(e) {
        if (!isDrawing) return;
        
        if (currentTool === "draw" || currentTool === "eraser") {
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(e.offsetX, e.offsetY);
        } else if (currentTool === "rect") {
            redrawCanvas();
            ctx.beginPath();
            ctx.rect(startX, startY, e.offsetX - startX, e.offsetY - startY);
            ctx.fillStyle = currentColor;
            ctx.fill();
            ctx.stroke();
        }
    }

    function stopDrawing() {
        isDrawing = false;
    }

    function redrawCanvas() {
        // В реальном приложении здесь будет перерисовка сохраненных элементов
    }

    // Очистка canvas
    clearCanvasBtn.addEventListener("click", function() {
        if (confirm("Очистить холст? Все изменения будут потеряны.")) {
            setupCanvas();
        }
    });

    // Сохранение путеводителя
    saveGuideBtn.addEventListener("click", function() {
        const name = guideNameInput.value.trim();
        if (!name) {
            alert("Введите название путеводителя");
            return;
        }
        
        const imageData = canvas.toDataURL("image/png");
        
        // Отправка данных на сервер
        fetch(currentMapId ? `/update_map/${currentMapId}` : "/create_map", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: name,
                image_data: imageData
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                location.reload(); // Перезагружаем страницу для обновления списка
            } else {
                alert("Ошибка при сохранении: " + (data.error || "Неизвестная ошибка"));
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Ошибка при сохранении");
        });
    });

    // Закрытие модального окна
    cancelGuideBtn.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);
    window.addEventListener("click", function(e) {
        if (e.target === editorModal) {
            closeModal();
        }
    });

    function closeModal() {
        editorModal.style.display = "none";
    }

    // Загрузка существующих карт при загрузке страницы
    fetch("/get_maps")
        .then(response => response.json())
        .then(data => {
            savedMaps = data.maps || [];
        });
});