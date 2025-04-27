document.addEventListener("DOMContentLoaded", function () {
    const candidateForm = document.getElementById("candidate-form");
    const hrForm = document.getElementById("hr-form");
    const userTypeRadios = document.querySelectorAll('input[name="user-type"]');

    // Переключение между формами
    userTypeRadios.forEach(radio => {
        radio.addEventListener("change", function () {
            if (this.value === "candidate") {
                candidateForm.style.display = "block";
                hrForm.style.display = "none";
            } else {
                candidateForm.style.display = "none";
                hrForm.style.display = "block";
            }
        });
    });

    // Обработка отправки формы кандидата
    candidateForm.addEventListener("submit", function (event) {
        event.preventDefault();
        // Здесь можно добавить логику отправки данных
        window.location.href = "candidate.html"; // Перенаправление
    });

    // Обработка отправки формы HR
    hrForm.addEventListener("submit", function (event) {
        event.preventDefault();
        // Здесь можно добавить логику отправки данных
        window.location.href = "hr.html"; // Перенаправление
    });
});