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

    for (var x = 0; x < image.width; x++) {
      for (var y = 0; y < image.height; y++) {
        console.log(context.getImageData(x * ratio, y * ratio, 1, 1).data);
      }
    }
  }
}
