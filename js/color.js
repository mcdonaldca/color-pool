function Color(el, r, g, b, a) {
  this.el = el;
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
  this.locations = [];
}

Color.prototype.addLocation = function(x, y) {
  this.locations.push([x, y]);
};