function Pool() {
  this.content = $("#content");
  this.displayCanvas = $("#canvas")[0];
  this.manipCanvas = $("#manip")[0];
  this.displayContext = this.displayCanvas.getContext("2d");
  this.manipContext = this.manipCanvas.getContext("2d");

  this.ratio = 10;
  this.setImageWithSrc("img/test.png");

  this.colorClickStack = [];

  var that = this;
  $(".image-button").click(function() {
    var imageName = $(this).children()[0];
    that.setImageWithSrc(imageName.src);
  });

  $("#merge").click(function() {
    that.mergeColors();
  });

  $("#toggle").click(function() {
    that.toggleChange();
  });
}

Pool.prototype.addClick = function(colorEl) {
  var r = colorEl.getAttribute("r"),
      g = colorEl.getAttribute("g"),
      b = colorEl.getAttribute("b"),
      a = colorEl.getAttribute("a");

  this.colorClickStack.push(this.colors[r][g][b]);
  console.log("clicked: ", r, g, b);
}

Pool.prototype.setImageWithSrc = function(imageSrc) {
  this.content.empty();
  var image = new Image();
  var pool = this;
  image.onload = function() {
    pool.drawImageOnLoad(this);
  }
  image.src = imageSrc;
};

Pool.prototype.getColor = function(r, g, b) {
  return this.colors[r][g][b];
}

Pool.prototype.setColors = function(colors) {
  this.colors = colors;
}

Pool.prototype.setOriginalImageDimensions = function(width, height) {
  this.imgWidth = width;
  this.imgHeight = height;
}

Pool.prototype.drawImageOnLoad = function(image) {
  this.setOriginalImageDimensions(image.width, image.height);
  this.manipCanvas.width = image.width;
  this.manipCanvas.height = image.height;
  this.displayCanvas.width = image.width * this.ratio;
  this.displayCanvas.height = image.height * this.ratio;

  this.manipContext.imageSmoothingEnabled = false;
  this.manipContext.drawImage(image, 0, 0);

  colors = {};

  var manipData = this.manipContext.getImageData(0, 0, image.width, image.height).data;
  for (var i = 0; i < manipData.length; i += 4) {

    var r = manipData[i],
        g = manipData[i + 1],
        b = manipData[i + 2],
        a = manipData[i + 3];

    if (a != "0") {
      if (!(r in colors)) {
        colors[r] = {}
      }
      if (!(g in colors[r])) {
        colors[r][g] = {}
      }
      if (!(b in colors[r][g])) {
        var colorEl = document.createElement("div");
        colorEl.className = "color " + r + "-" + g + "-" + b;
        colorEl.setAttribute("r", r);
        colorEl.setAttribute("g", g);
        colorEl.setAttribute("b", b);
        colorEl.setAttribute("a", a / 255);
        colorEl.style.backgroundColor = "rgba(" + r + ", " + g + ", " + b + ", " + (a / 255).toString() + ")";
        this.content.append(colorEl);

        colors[r][g][b] = new Color(colorEl, r, g, b, a);
      }

      var y = Math.floor(i / (image.width * 4));
      var x = (i - (y * image.width * 4)) / 4;
      colors[r][g][b].addLocation(x, y);
    }
  }

  this.setColors(colors);
  var pool = this;
  $(".color").click(function() {
    pool.addClick(this);
  });

  this.displayContext.imageSmoothingEnabled = false;
  this.displayContext.scale(this.ratio, this.ratio);
  this.displayContext.drawImage(this.manipCanvas, 0, 0);
};

Pool.prototype.mergeColors = function() {
  stackHeight = this.colorClickStack.length;
  if (stackHeight >= 2) {
    var mergeFrom = this.colorClickStack[stackHeight - 1];
    var mergeTo = this.colorClickStack[stackHeight - 2];

    var imageData = this.manipContext.getImageData(0, 0, this.imgWidth, this.imgHeight);
    var data = imageData.data;

    for (var i = 0; i < mergeFrom.locations.length; i++) {
      var x = mergeFrom.locations[i][0],
          y = mergeFrom.locations[i][1];

      var calcIndex = (x * 4) + (4 * this.imgWidth * y);

      data[calcIndex] = mergeTo.r;
      data[calcIndex + 1] = mergeTo.g;
      data[calcIndex + 2] = mergeTo.b;

      // console.log(x, y, calcIndex);
      mergeTo.addLocation(x, y);
    }
    this.colors[mergeFrom.r][mergeFrom.g][mergeFrom.b] = undefined;
    var target = "." + mergeFrom.r + "-" + mergeFrom.g + "-" + mergeFrom.b;
    var el = $(target).remove()[0];
    el.className +=  " merged";
    this.content.append(el);
    
    this.manipContext.imageSmoothingEnabled = false;
    this.manipContext.putImageData(imageData, 0, 0);

    this.displayContext.imageSmoothingEnabled = false;
    this.displayContext.drawImage(this.manipCanvas, 0, 0);

  } else {
    console.log("not enough colors clicked");
  }
}

Pool.prototype.toggleChange = function() {
  
}
    
window.onload = function() {
  pool = new Pool();
}

/* for (var key in colors) {
  if (colors.hasOwnProperty(key)) {
    console.log(key + " -> " + colors[key]);
  }
} */