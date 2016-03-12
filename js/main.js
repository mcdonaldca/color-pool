function Pool() {
  this.content = document.getElementById("content");
  this.canvas = document.getElementById("canvas");
  this.context = canvas.getContext("2d");

  this.ratio = 8;

  this.setImage("img/mercury.png");
}

Pool.prototype.setImage = function(imageSrc) {
  var image = new Image();
  image.onload = this.drawImageOnLoad();
  image.src = imageSrc;
};

Pool.prototype.setColors = function(colors) {
  this.colors = colors;
}

Pool.prototype.drawImageOnLoad = function() {
  var pool = this;

  return function() {
    var image = this;
    var width = image.width * pool.ratio
    var height = image.height * pool.ratio

    pool.canvas.width = width;
    pool.canvas.height = height;
    pool.context.imageSmoothingEnabled = false;
    pool.context.drawImage(image, 0, 0, width, height);

    colors = {};

    for (var x = 0; x < image.width; x++) {
      for (var y = 0; y < image.height; y++) {
        var colorData = 
          pool.context.getImageData(x * pool.ratio, y * pool.ratio, 1, 1).data;
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
            pool.content.appendChild(colorEl);
          }

          colors[r][g][b].push([x, y]);
        }
      }
    }

    pool.setColors(colors);
  };
};
    
window.onload = function() {
  var pool = new Pool();
}

/* for (var key in colors) {
  if (colors.hasOwnProperty(key)) {
    console.log(key + " -> " + colors[key]);
  }
} */