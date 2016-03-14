// Color object to manage color information
function Color(r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;

  // Build HTML element to represent color
  this.buildElement();

  this.merged = false;
  this.mergedTo = undefined;
  this.locations = {};
}



// Called to add a new location
Color.prototype.addLocation = function(x, y) {
  if (!(x in this.locations)) {
    this.locations[x] = {};
  }
  this.locations[x][y] = 1;
};



// Called to add a new location
Color.prototype.addLocations = function(newLocations) {
  for (var i = 0; i < newLocations.length; i++) {
    this.addLocation(newLocations[i][0], newLocations[i][1]);
  }
};



// Used to remove locations
Color.prototype.removeLocations = function(locations) {
  for (var i = 0; i < locations.length; i++) {
    var x = locations[i][0],
        y = locations[i][1];

    if (this.locations[x] != undefined) {
      if (this.locations[x][y] != undefined) {
        delete this.locations[x][y];
        if (Object.keys(this.locations[x]).length == 0) {
          delete this.locations[x];
        }
      }
    }
  }
}



// Returns locations in list form
Color.prototype.locationList = function() {
  var list = [];
  for (var x in this.locations) {
    if (this.locations.hasOwnProperty(x)) {
      for (var y in this.locations[x]) {
        if (this.locations[x].hasOwnProperty(y)) {
          list.push([x, y]);
        }
      }
    }
  }
  return list;
}



// Called when a color is set as the source in a selection
Color.prototype.setSourceSelection = function() {
  $(this.el).addClass("selected-source");
  $(this.colorContentEl).html("source");
}



// Called when a color has been merged
Color.prototype.setMerged = function(sourceColor) {
  this.merged = true;
  this.mergedTo = sourceColor;
  $(this.el).addClass("merged");
  $(this.colorContentEl).html("merged");
};



// Called when a color has been merged
Color.prototype.setUnmerged = function() {
  this.mergedTo.removeLocations(this.locationList());

  this.merged = false;
  this.mergedTo = undefined;
  $(this.el).removeClass("merged");
  $(this.colorContentEl).html("");
};



// Called to build the HTML element structure
Color.prototype.buildElement = function() {
  this.el = document.createElement("div");
  this.innerEl = document.createElement("div");
  this.colorContentEl = document.createElement("div");

  this.el.className = "color-container";
  this.el.setAttribute("r", this.r);
  this.el.setAttribute("g", this.g);
  this.el.setAttribute("b", this.b);
  this.el.setAttribute("a", this.a / 255);
  this.el.style.backgroundColor = 
    "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + (this.a / 255).toString() + ")";

  this.innerEl.className = "color";

  this.colorContentEl.className = "color-content";

  this.innerEl.appendChild(this.colorContentEl);
  this.el.appendChild(this.innerEl);
}