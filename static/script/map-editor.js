const canvas = document.getElementById("drawing-canvas");
const ctx = canvas.getContext("2d");
let isDrawing = false, brushWidth = 5, snapshot;

canvas.addEventListener("mousedown", (e) => {
  isDrawing = true;
  ctx.beginPath();
  ctx.lineWidth = brushWidth;
  snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing) return;
  ctx.putImageData(snapshot, 0, 0);
  // Логика рисования выбранного инструмента
});

canvas.addEventListener("mouseup", () => isDrawing = false);
