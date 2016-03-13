// Pool object to manage appliation
function Pool() {
  // Set up access to various canvases & contexts
  this.display = $("#display");
  this.content = $("#content");
  this.displayCanvas = $("#canvas")[0];
  this.displayContext = this.displayCanvas.getContext("2d");
  this.manipCanvas = document.createElement("canvas");
  this.manipContext = this.manipCanvas.getContext("2d");

  this.toggleCanvas = $("#canvas-toggle")[0];
  this.toggleContext = this.toggleCanvas.getContext("2d");
  this.toggleManipCanvas = document.createElement("canvas");
  this.toggleManipContext = this.toggleManipCanvas.getContext("2d");

  this.comparison = $("#comparison");

  // Set up various buttons to control disabled state
  this.mergeButton = $("#merge");
  this.toggleButton = $("#toggle");
  this.ratioUpButton = $("#ratio-up");
  this.ratioDownButton = $("#ratio-down");
  this.compareButton = $("#compare");

  // Set the initial display ratio (can be adjusted via UI)
  this.ratio = 1;
  // Default max to 1
  this.maxRatio = 1;

  // Tracks if we're in toggle mode
  this.toggleMode = false;

  // Tracks if we're in comparison mode
  this.compareMode = false;

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
Pool.prototype.colorClick = function(colorEl) {
  var r = colorEl.getAttribute("r"),
      g = colorEl.getAttribute("g"),
      b = colorEl.getAttribute("b"),
      a = colorEl.getAttribute("a");

  var isSource = $(colorEl).hasClass("selected-source");
  var isSelected = $(colorEl).hasClass("selected");

  if (isSource) {
    this.clearColorClickStack();
  } else {
    if (isSelected) {
      $(colorEl).removeClass("selected");
      var clickedColor = this.colors[r][g][b];

      // Remove color from stack
      var i = this.colorClickStack.indexOf(clickedColor);
      if (i != -1) {
        this.colorClickStack.splice(i, 1);

        // Check if removing this color makes merging invalid
        if (this.colorClickStack.length < 2) {
          this.mergeButton.addClass("disabled");
          this.toggleButton.addClass("disabled");
        }
      }
    } else {
      // Get clicked color
      var clickedColor = this.colors[r][g][b];

      // If it's the first item clicked, it should be the source
      if (this.colorClickStack.length == 0) {
        clickedColor.setSourceSelection();
      // Otherwise, it's a merger
      } else {
        clickedColor.el.className += " selected";
      }
      
      // Add color to stack
      this.colorClickStack.push(clickedColor);

      // Check if merging is valid
      if (this.colorClickStack.length == 2) {
        this.mergeButton.removeClass("disabled");
        this.toggleButton.removeClass("disabled");
      }
    }

    if (this.compareMode) {
      this.updateComparisonChart();
    }
  }
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
  this.clearColorClickStack();
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
    pool.colorClick(this);
  });

  // Find largest ratio image can fit without cropping
  this.maxRatio = this.calculateMaxRatio();
  this.ratio = Math.floor(this.maxRatio / 2);
  // If an image is used that won't fit, just let it overflow
  if (this.ratio == 0) {
    this.ratio = 1;
  }

  // Disabled "up" and "down" buttons is at limits
  if (this.ratio == 1) {
    this.ratioDownButton.addClass("disabled");
  } else if (this.ratio == this.maxRatio) {
    this.ratioUpButton.addClass("disabled");
  }

  // Draw the scaled image on the display
  this.drawDisplay(this.manipCanvas, this.displayCanvas, this.displayContext);
};



// Called whenever the color merge action is fired
Pool.prototype.mergeColors = function() {
  stackHeight = this.colorClickStack.length;

  // Check that at least two colors have been selected
  if (stackHeight >= 2) {
    var imageData = this.generateNewImageData(this.colorClickStack, true);
    
    // Draw new image data to the manipulation canvas
    this.manipContext.imageSmoothingEnabled = false;
    this.manipContext.putImageData(imageData, 0, 0);

    // Draw the updated display
    this.drawDisplay(this.manipCanvas, this.displayCanvas, this.displayContext);

    // Clear the color click stack
    this.clearColorClickStack();
  }
};



// Uses stack of colors to generate new imageData
// @param changeData: only alter color values if true
Pool.prototype.generateNewImageData = function(colorStack, changeData) {
  stackHeight = colorStack.length;

  // Find the colors we'll be going to -> from
  var source = colorStack[0];
  var colorsToMerge = colorStack.splice(1, stackHeight -1 );

  // Find original image dimensions
  var imageWidth = this.manipCanvas.width;
  var imageHeight = this.manipCanvas.height;
  // Get our current image data
  var imageData = this.manipContext.getImageData(0, 0, imageWidth, imageHeight);
  var data = imageData.data;

  for(var n = 0; n < colorsToMerge.length; n++) {
    var mergeFrom = colorsToMerge[n];

    // Iterate through all locations of departing color
    for (var i = 0; i < mergeFrom.locations.length; i++) {
      var x = mergeFrom.locations[i][0],
          y = mergeFrom.locations[i][1];

      // Calculate the beginning of our values in the data array
      var calcIndex = (x * 4) + (4 * imageWidth * y);

      data[calcIndex] = source.r;
      data[calcIndex + 1] = source.g;
      data[calcIndex + 2] = source.b;

      if (changeData) {
        // Add the location to the new source color
        source.addLocation(x, y);
      }
    }

    if (changeData) {
      // Remove the merged color from our color collection
      this.colors[mergeFrom.r][mergeFrom.g][mergeFrom.b] = undefined;
      // Let the color set up for merged state
      mergeFrom.setMerged();
      // Remove color element from where it is in the flow and add it to the end
      $(mergeFrom.el).remove()[0];
      this.content.append(mergeFrom.el);
    }
  }
  return imageData;
}



// Called whenever the toggle history action is fired.
Pool.prototype.toggleToggleMode = function() {
  if (this.colorClickStack.length > 1) {
    this.toggleMode = !this.toggleMode;
    this.display.toggleClass("toggle-mode");
    this.content.toggleClass("toggle-mode");

    if (this.toggleMode) {
      this.setUpToggleDisplay();
    } else {
      this.cleanUpToggleDisplay();
    }
  }
};



// Called when toggle mode is active and we're toggling between changes.
Pool.prototype.toggleChange = function() {
  var z = $(this.toggleCanvas).css("z-index");

  if (z == "0") {
    $(this.toggleCanvas).css("z-index", "2");
  } else {
    $(this.toggleCanvas).css("z-index", "0");
  }
};



// Called when a toggle canvas should be initiated.
Pool.prototype.setUpToggleDisplay = function() {
  // Set up the toggle's manipulation canvas.
  this.toggleManipCanvas.width = this.manipCanvas.width;
  this.toggleManipCanvas.height = this.manipCanvas.height;

  // Make a copy of the selected colors array.
  var selectedColors = this.colorClickStack.slice(0);
  // Use this array (the suggested merge) to generate imageData.
  // IMPORTANT: pass false so that our suggested merge isn't permanent.
  var imageData = this.generateNewImageData(selectedColors, false);

  // Draw new image data to the toggle's manipulation canvas.
  this.toggleManipContext.imageSmoothingEnabled = false;
  this.toggleManipContext.putImageData(imageData, 0, 0);

  // Draw the image on the toggle's display canvas.
  this.drawDisplay(this.toggleManipCanvas, this.toggleCanvas, this.toggleContext);

  // If we're in compare mode, temporarily hide the panel.
  if (this.compareMode) {
    this.comparison.toggleClass("visible");
    this.display.toggleClass("comparison-visible");
  }
  // Prevents compare toggling
  this.compareButton.addClass("disabled");

  // Set the toggle display to be not the default.
  $(this.toggleCanvas).css("z-index", "0");
  $(this.toggleCanvas).addClass("visible");

  // Show the text prompt.
  $(this.display.children()[0]).css("opacity", "1");
};



// Called when a toggle canvas should be cleaned up.
Pool.prototype.cleanUpToggleDisplay = function() {
  $(this.toggleCanvas).removeClass("visible");

  // Hide the text prompt
  $(this.display.children()[0]).css("opacity", "0");

  // If we're in compare mode, re-show the panel.
  if (this.compareMode) {
    this.comparison.toggleClass("visible");
    this.display.toggleClass("comparison-visible");
  }
  // Allow compare toggling again
  this.compareButton.removeClass("disabled");
};



// Called when the "max ratio" button is clicked
Pool.prototype.setMaxRatio = function() {
  if (this.ratio != this.maxRatio) {
    this.ratio = this.maxRatio;
    // We've hit the max, disable up button
    this.ratioUpButton.addClass("disabled");
    // If we're not also at the minumum, un-disable down
    // Covers the case where you click min, then click max
    if (this.ratio != 1) {
      this.ratioDownButton.removeClass("disabled");
    }

    this.drawDisplay(this.manipCanvas, this.displayCanvas, this.displayContext);
    if (this.toggleMode) {
      this.drawDisplay(this.toggleManipCanvas, this.toggleCanvas, this.toggleContext);
    }
  }
};



// Called when the "ratio up" button is clicked
Pool.prototype.incRatio = function() {
  if (this.ratio < this.maxRatio) {
    this.ratio += 1

    // Check if the down button should be re-enabled
    if (this.ratio == 2) {
      this.ratioDownButton.removeClass("disabled");
    }

    this.drawDisplay(this.manipCanvas, this.displayCanvas, this.displayContext);
    if (this.toggleMode) {
      this.drawDisplay(this.toggleManipCanvas, this.toggleCanvas, this.toggleContext);
    }
  }
};



// Called when the "ratio down" button is clicked
Pool.prototype.decRatio = function() {
  if (this.ratio > 1) {
    this.ratio -= 1;

    // Check if the up button should be re-enabled
    if (this.ratio == this.maxRatio - 1) {
      this.ratioUpButton.removeClass("disabled");
    }

    this.drawDisplay(this.manipCanvas, this.displayCanvas, this.displayContext);
    if (this.toggleMode) {
      this.drawDisplay(this.toggleManipCanvas, this.toggleCanvas, this.toggleContext);
    }
  }
};



// Called when the "min ratio" button is clicked
Pool.prototype.setMinRatio = function() {
  if (this.ratio != 1) {
    this.ratio = 1;
    // We've hit the min, disabled the down button
    this.ratioDownButton.addClass("disabled");
    // If we're not also at the maximum, un-disable up
    // Covers the case where you click max, then click min
    if (this.ratio != this.maxRatio) {
      this.ratioUpButton.removeClass("disabled");
    }
    this.drawDisplay(this.manipCanvas, this.displayCanvas, this.displayContext);
    if (this.toggleMode) {
      this.drawDisplay(this.toggleManipCanvas, this.toggleCanvas, this.toggleContext);
    }
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



// Called anytime the display should be redrawn
Pool.prototype.drawDisplay = function(manipCanvas, displayCanvas, displayContext) {
  // Set the display canvas to the scaled proportions
  // This canvas will change size with the display ratio
  displayCanvas.width = manipCanvas.width * this.ratio;
  displayCanvas.height = manipCanvas.height * this.ratio;

  // Scale the display canvas & draw the manipulation canvas content
  displayContext.imageSmoothingEnabled = false;
  displayContext.scale(this.ratio, this.ratio);
  displayContext.drawImage(manipCanvas, 0, 0);
}



// Called whenever the comparison chart should be updated
Pool.prototype.updateComparisonChart = function() {
  var colorNum = this.colorClickStack.length;
  var canvas = $("#comparison").children()[0];
  var instructions = $("#comparison").children()[1];
  var context = canvas.getContext("2d");

  if (colorNum > 0) {
    $(instructions).hide();

    var centerX = Math.floor(canvas.width / 2);
    var centerY = Math.floor(canvas.height / 2);

    var sourceColorRadius = Math.floor(canvas.width / 4);
    var mergeColorRadius = Math.floor(canvas.width / 2);

    var startingAngle = 0;
    var arcSize = (2 * Math.PI) / (colorNum - 1);

    var drawColors = this.colorClickStack.slice(0).reverse();

    context.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < colorNum; i++) {
      var startingAngle = 0;
      var endingAngle = 0;
      if (i == colorNum - 1) {
        endingAngle = 2 * Math.PI;
      } else {
        startingAngle = arcSize * (i - 1);
        endingAngle = startingAngle + arcSize;
      }

      var radius = mergeColorRadius;
      if (i == colorNum - 1) {
        radius = sourceColorRadius;
      }

      context.beginPath();
      context.moveTo(centerX, centerY);
      context.arc(centerX, centerY, radius, startingAngle, endingAngle, false);
      context.closePath();

      var r = drawColors[i].r;
      var g = drawColors[i].g;
      var b = drawColors[i].b;
      context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      context.fill();
    }
  } else {
    context.clearRect(0, 0, canvas.width, canvas.height);
    $(instructions).show();
  }
}



// Called whenever the toggle history action is fired.
Pool.prototype.toggleCompareMode = function() {
  if (!this.toggleMode) {
    this.compareMode = !this.compareMode;

    this.comparison.toggleClass("visible");
    this.display.toggleClass("comparison-visible");

    if (this.compareMode) {
      this.updateComparisonChart();
    }
  }
}



// Called when colorClickStack should be cleared 
Pool.prototype.clearColorClickStack = function() {
 this.colorClickStack = [];

  // Remove all tagged colors
  $(".selected").removeClass("selected");
  $(".selected-source .color-content").empty();
  $(".selected-source").removeClass("selected-source");

  // Disable actions that require selected colors
  this.mergeButton.addClass("disabled");
  this.toggleButton.addClass("disabled");

  if (this.compareMode) {
    this.updateComparisonChart();
  }
}



// Called upon intialization, sets up click handlers
Pool.prototype.initializeClickEvents = function() {
  var pool = this;
  $(".image-button").click(function() {
    var imageName = $(this).children()[0];
    pool.setImageWithSrc(imageName.src);
  });

  document.onkeydown = function(e) {
    // When "m" is pressed, merge colors
    if (e.which == "77" && !pool.toggleMode) { 
      pool.mergeColors();
    } else if (e.which == "84") {
      pool.toggleToggleMode();
    } else if (e.which == "32" && pool.toggleMode) {
      pool.toggleChange();
    } else if (e.which == "27") {
      if (pool.toggleMode) {
        pool.toggleToggleMode();
      } else {
        pool.clearColorClickStack();
      }
    } else if (e.which == "67") {
      pool.toggleCompareMode();
    }
  }

  $("#merge").click(function() {
    pool.mergeColors();
  });

  $("#toggle").click(function() {
    pool.toggleToggleMode();
  });

  $("#compare").click(function() {
    pool.toggleCompareMode();
  });

  $("#ratio-max").click(function() {
    pool.setMaxRatio();
  });

  $("#ratio-up").click(function() {
    pool.incRatio();
  });

  $("#ratio-down").click(function() {
    pool.decRatio();
  });

  $("#ratio-min").click(function() {
    pool.setMinRatio();
  });

  $("#settings").click(function() {
    $(".overlay").slideDown(350);
  });

  $("#close").click(function() {
    $(".overlay").slideUp(200);
  });
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