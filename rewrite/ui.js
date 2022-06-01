const cnv = document.querySelector(".game .board canvas");
const ctx = cnv.getContext("2d");

const sizeCanvas = () => {
  // Hiding and Unhiding the canvas prevents it from mangling the clientHeight value
  cnv.style.display = "none";
  const d = cnv.parentNode.clientHeight;
  cnv.style.display = "";
  cnv.width = cnv.height = d;
};

window.onresize = sizeCanvas;
sizeCanvas();