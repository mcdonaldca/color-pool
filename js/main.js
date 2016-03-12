window.onload = function() {
  var canvas = document.getElementById("canvas");
  var context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false; /// future

  ratio = 4;

  var image = new Image();
  image.onload = drawImage;
  image.src = "img/venus.png";

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
          }

          colors[r][g][b].push([x, y]);
        }
      }
    }

    console.log(colors);
  }
}
