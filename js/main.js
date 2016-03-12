window.onload = initializePool;

function initializePool() {
  content = document.getElementById("content");
  canvas = document.getElementById("canvas");
  context = canvas.getContext('2d');

  ratio = 8;

  var image = new Image();
  image.onload = drawImage;
  image.src = "img/mercury.png";

  function drawImage() {
    width = image.width * ratio
    height = image.height * ratio
    canvas.width = width;
    canvas.height = height;
    context.imageSmoothingEnabled = false;
    context.drawImage(image, 0, 0, width, height);

    colors = {}

    for (var x = 0; x < image.width; x++) {
      for (var y = 0; y < image.height; y++) {
        var colorData = context.getImageData(x * ratio, y * ratio, 1, 1).data;
        var r = colorData[0],
            g = colorData[1],
            b = colorData[2],
            a = colorData[3];

        if (a) {
          if (!(r in colors)) {
            colors[r] = {}
          }
          if (!(g in colors[r])) {
            colors[r][g] = {}
          }
          if (!(b in colors[r][g])) {
            colors[r][g][b] = []

            var colorEl = document.createElement("div");
            colorEl.className = "color";
            colorEl.style.backgroundColor = 
              "rgba(" + r.toString() + ", " + 
                        g.toString() + ", " +
                        b.toString() + ", " + 
                        (a / 255).toString() + ")";
            content.appendChild(colorEl);
          }

          colors[r][g][b].push([x, y]);
        }
      }
    }

    /* for (var key in colors) {
      if (colors.hasOwnProperty(key)) {
        console.log(key + " -> " + colors[key]);
      }
    } */
  }
}
