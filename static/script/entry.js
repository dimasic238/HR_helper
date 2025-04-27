document.getElementById("forgot-password-btn").addEventListener("click", function(event) {
    event.preventDefault(); // Предотвращаем действие по умолчанию
    const hint = document.getElementById("password-hint");
    hint.style.display = hint.style.display === "block" ? "none" : "block";
});

// Закрытие подсказки при клике вне её
document.addEventListener("click", function(event) {
    const hint = document.getElementById("password-hint");
    const forgotButton = document.getElementById("forgot-password-btn");
    if (!forgotButton.contains(event.target) && !hint.contains(event.target)) {
        hint.style.display = "none";
    }
});