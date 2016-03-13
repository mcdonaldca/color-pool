function Color(r, g, b, a) {
  this.el = document.createElement("div");
  this.innerEl = document.createElement("div");
  this.colorContentEl = document.createElement("div");

  this.el.className = "color-container";
  this.el.setAttribute("r", r);
  this.el.setAttribute("g", g);
  this.el.setAttribute("b", b);
  this.el.setAttribute("a", a / 255);
  this.el.style.backgroundColor = "rgba(" + r + ", " + g + ", " + b + ", " + (a / 255).toString() + ")";

  this.innerEl.className = "color";

  this.colorContentEl.className = "color-content";

  this.innerEl.appendChild(this.colorContentEl);
  this.el.appendChild(this.innerEl);

  this.merged = false;

  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
  this.locations = [];
}

Color.prototype.addLocation = function(x, y) {
  this.locations.push([x, y]);
};

Color.prototype.setMerged = function() {
  this.merged = true;
  this.el.className +=  " merged";
  this.colorContentEl.innerHTML = "merged";
};