// Color object to manage color information
function Color(r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;

  // Build HTML element to represent color
  this.buildElement();

  this.merged = false;
  this.locations = [];
}

// Called to add a new location
Color.prototype.addLocation = function(x, y) {
  this.locations.push([x, y]);
};

// Called when a color has been merged
Color.prototype.setMerged = function() {
  this.merged = true;
  this.el.className +=  " merged";
  this.colorContentEl.innerHTML = "merged";
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