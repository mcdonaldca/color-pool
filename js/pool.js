// Pool object to manage appliation
function Pool() {
  // Set up access to various canvases & contexts
  this.display = $("#display");
  this.content = $("#content");
  this.displayCanvas = $("#canvas")[0];
  this.displayContext = this.displayCanvas.getContext("2d");
  this.manipCanvas = $("#manip")[0];
  this.manipContext = this.manipCanvas.getContext("2d");

  // Set the initial display ratio (can be adjusted via UI)
  this.ratio = 1;
  // Default max to 1
  this.maxRatio = 1;

  // Tracks if we're in toggle mode
  this.toggleMode = false;

  // Display initial image
  this.setImageWithSrc("img/venus.png");

  // Tracks the order of items clicked in the stack
  this.colorClickStack = [];
  // Tracks the last colors merged & changes made
  this.changeStack = [];

  // Set various click and key interactions
  this.initializeClickEvents();
}



// Called whenever a color swatch is clicked
Pool.prototype.addClick = function(colorEl) {
  var r = colorEl.getAttribute("r"),
      g = colorEl.getAttribute("g"),
      b = colorEl.getAttribute("b"),
      a = colorEl.getAttribute("a");

  // Add color to stack
  // TODO: react differently if color is already in stack
  this.colorClickStack.push(this.colors[r][g][b]);
  // Left in for debugging purposes
  console.log("clicked: ", r, g, b);
}



// Called whenever we're starting with an image from a source
Pool.prototype.setImageWithSrc = function(imageSrc) {
  // Removing existing colors in the content section
  this.content.empty();

  // Create a new image, set its onload function, and set the source
  var image = new Image();
  var pool = this;
  image.onload = function() {
    pool.drawImageOnLoad(this);
  }
  image.src = imageSrc;
};



// Called when the image to draw has been loaded.
Pool.prototype.drawImageOnLoad = function(image) {
  // Set the manipulation canvas to the image height and width
  // This canvas will always be the size of the original image
  this.manipCanvas.width = image.width;
  this.manipCanvas.height = image.height;

  // Draw original image on manipulation canvas
  // Turn off image smoothing so pixels render exactly
  this.manipContext.imageSmoothingEnabled = false;
  this.manipContext.drawImage(image, 0, 0);

  // Initialize our data structure to track the exisiting colors
  // and their locations
  colors = {};

  // Get pixel by pixel image data
  // This is a large array of all rgba values
  var manipData = this.manipContext.getImageData(0, 0, image.width, image.height).data;
  for (var i = 0; i < manipData.length; i += 4) {
    var r = manipData[i],
        g = manipData[i + 1],
        b = manipData[i + 2],
        a = manipData[i + 3];

    // Ignore the current pixel if it is 100% transparent
    if (a != "0") {
      // Check for the r key
      if (!(r in colors)) {
        colors[r] = {}
      }
      // Check for the g key
      if (!(g in colors[r])) {
        colors[r][g] = {}
      }
      // Check for the b key
      if (!(b in colors[r][g])) {
        // If no b key exists, this is the first instance of the color
        // Create a new color object, add it to our collection, and display 
        // the new element in our content.
        var color = new Color(r, g, b, a);
        colors[r][g][b] = color;
        this.content.append(color.el);
      }

      // Calculate the x + y coordinate from location in data
      var y = Math.floor(i / (image.width * 4));
      var x = (i - (y * image.width * 4)) / 4;
      // Color object tracks its various locations
      colors[r][g][b].addLocation(x, y);
    }
  }

  // Save the colors collection to Pool object
  this.colors = colors;
  // Now that we have generated our color elements, set a click function
  var pool = this;
  $(".color-container").click(function() {
    pool.addClick(this);
  });

  // Find largest ratio image can fit without cropping
  this.maxRatio = this.calculateMaxRatio();
  this.ratio = Math.floor(this.maxRatio / 2);

  // Draw the scaled image on the display
  this.setRatio(this.ratio);
};



// Called whenever the color merge action is fired
Pool.prototype.mergeColors = function() {
  stackHeight = this.colorClickStack.length;
  if (stackHeight >= 2) {
    var mergeFrom = this.colorClickStack[stackHeight - 1];
    var mergeTo = this.colorClickStack[stackHeight - 2];

    var imageWidth = this.manipCanvas.width;
    var imageHeight = this.manipCanvas.height;
    var imageData = this.manipContext.getImageData(0, 0, imageWidth, imageHeight);
    var data = imageData.data;

    for (var i = 0; i < mergeFrom.locations.length; i++) {
      var x = mergeFrom.locations[i][0],
          y = mergeFrom.locations[i][1];

      var calcIndex = (x * 4) + (4 * imageWidth * y);

      data[calcIndex] = mergeTo.r;
      data[calcIndex + 1] = mergeTo.g;
      data[calcIndex + 2] = mergeTo.b;

      // console.log(x, y, calcIndex);
      mergeTo.addLocation(x, y);
    }
    this.colors[mergeFrom.r][mergeFrom.g][mergeFrom.b] = undefined;
    mergeFrom.setMerged();
    $(mergeFrom.el).remove()[0];
    this.content.append(mergeFrom.el);
    
    this.manipContext.imageSmoothingEnabled = false;
    this.manipContext.putImageData(imageData, 0, 0);

    this.displayContext.imageSmoothingEnabled = false;
    this.displayContext.drawImage(this.manipCanvas, 0, 0);

    this.colorClickStack = [];

  } else {
    console.log("not enough colors clicked");
  }
};



// Called whenever the toggle history action is fired.
Pool.prototype.toggleToggleMode = function() {
  this.toggleMode = !this.toggleMode;
  console.log(this.toggleMode);
  this.display.toggleClass("toggle-mode");
  this.content.toggleClass("toggle-mode");
};



// Called when the "max ratio" button is clicked
Pool.prototype.setMaxRatio = function() {
  if (this.ratio != this.maxRatio) {
    this.setRatio(this.maxRatio);
  }
};



// Called when the "ratio up" button is clicked
Pool.prototype.incRatio = function() {
  if (this.ratio < this.maxRatio) {
    this.setRatio(this.ratio + 1);
  }
};



// Called when the "ratio down" button is clicked
Pool.prototype.decRatio = function() {
  if (this.ratio > 1) {
    this.setRatio(this.ratio - 1);
  }
};



// Called when the "min ratio" button is clicked
Pool.prototype.setMinRatio = function() {
  if (this.ratio != 1) {
    this.setRatio(1);
  }
};



// Called upon intialization, finds max ratio
Pool.prototype.calculateMaxRatio = function() {
  // Find height of entire display area
  var displayHeight = this.display.height();
  // Find height of image
  var imageHeight = this.manipCanvas.height;

  // Return the largest size (leaving ~7px of padding)
  return Math.floor((displayHeight - 15) / imageHeight);
}



// Called when a new ratio is set
Pool.prototype.setRatio = function(ratio) {
  this.ratio = ratio;

  // Set the display canvas to the scaled proportions
  // This canvas will change size with the display ratio
  this.displayCanvas.width = this.manipCanvas.width * this.ratio;
  this.displayCanvas.height = this.manipCanvas.height * this.ratio;

  // Scale the display canvas & draw the manipulation canvas content
  this.displayContext.imageSmoothingEnabled = false;
  this.displayContext.scale(this.ratio, this.ratio);
  this.displayContext.drawImage(this.manipCanvas, 0, 0);
}



// Called with toggle mode is active and we're toggling between changes
Pool.prototype.toggleChange = function() {
  console.log('toggle');
}



// Called upon intialization, sets up click handlers
Pool.prototype.initializeClickEvents = function() {
  var pool = this;
  $(".image-button").click(function() {
    var imageName = $(this).children()[0];
    pool.setImageWithSrc(imageName.src);
  });

  $("#merge").click(function() {
    pool.mergeColors();
  });

  document.onkeydown = function(e) {
    // When "m" is pressed, merge colors
    if (e.which == "77" && !pool.toggleMode) { 
      pool.mergeColors();
    } else if (e.which == "84" && pool.toggleMode) {
      pool.toggleChange();
    }
  }

  $("#toggle").click(function() {
    pool.toggleToggleMode();
  });

  $("#ratio-max").click(function() {
    pool.setMaxRatio();
  })

  $("#ratio-up").click(function() {
    pool.incRatio();
  })

  $("#ratio-down").click(function() {
    pool.decRatio();
  })

  $("#ratio-min").click(function() {
    pool.setMinRatio();
  })
}



// Start application when window loads.   
window.onload = function() {
  // Declaerd globally for debugging purposes
  pool = new Pool();
}

/* for (var key in colors) {
  if (colors.hasOwnProperty(key)) {
    console.log(key + " -> " + colors[key]);
  }
} */