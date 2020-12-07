import P5 from 'p5';

let baseColorImage;
let normalMapImage;
let specularMapImage;

const lightColors = [255, 255, 255];
let lightIntensity = 150;

let onlyDifuse = false;
let onlySpecular = false;

function lightColorWithIntensity() {
  return [
    (lightColors[0] / 255) * (lightIntensity / 255),
    (lightColors[1] / 255) * (lightIntensity / 255),
    (lightColors[2] / 255) * (lightIntensity / 255),
  ];
}

const sketch = (p5: P5) => {
  let baseColorImg;
  let normalMapImg;
  let specularMapImg;

  const baseColorArray = [];
  const normalMapArray = [];
  const specularMapArray = [];

  let lightVector;

  let generatedImg = [];

  function defineRGBfromTextures() {
    baseColorImg.loadPixels();
    normalMapImg.loadPixels();
    specularMapImg.loadPixels();

    for (let y = 0; y < p5.height; y++) {
      for (let x = 0; x < p5.width; x++) {
        const index = (x + y * p5.width) * 4;
        const rB = baseColorImg.pixels[index + 0] / 255;
        const gB = baseColorImg.pixels[index + 1] / 255;
        const bB = baseColorImg.pixels[index + 2] / 255;
        const rN = normalMapImg.pixels[index + 0];
        const gN = normalMapImg.pixels[index + 1];
        const bN = normalMapImg.pixels[index + 2];
        const rS = specularMapImg.pixels[index + 0] / 255;
        const gS = specularMapImg.pixels[index + 1] / 255;
        const bS = specularMapImg.pixels[index + 2] / 255;
        baseColorArray.push([rB, gB, bB]);
        normalMapArray.push(p5.createVector(rN, gN, bN));
        specularMapArray.push([rS, gS, bS]);
      }
    }
  }

  function phong() {
    generatedImg = [];
    for (let x = 0; x < p5.height * p5.width; x++) {
      const canvasY = Math.floor(x / p5.width);
      const canvasX = x - canvasY * p5.width;
      const ambient = [0, 0, 0];
      const ndotL = Math.max(
        0,
        P5.Vector.dot(normalMapArray[x].normalize(), lightVector.normalize()),
      );
      const difuse = [
        baseColorArray[x][0] * ndotL,
        baseColorArray[x][1] * ndotL,
        baseColorArray[x][2] * ndotL,
      ];
      const r = P5.Vector.sub(
        lightVector.normalize(),
        P5.Vector.mult(normalMapArray[x].normalize(), 2 * ndotL),
      );
      const specularDot = Math.max(
        0,
        Math.pow(
          P5.Vector.dot(
            r.normalize(),
            P5.Vector.sub(
              p5.createVector(0, 0, 1).normalize(),
              p5.createVector(canvasX, canvasY, 1).normalize(),
            ),
          ),
          2,
        ),
      );
      const specular = [
        specularMapArray[x][0] * specularDot,
        specularMapArray[x][1] * specularDot,
        specularMapArray[x][2] * specularDot,
      ];
      let difuseSpec;
      if (onlyDifuse) {
        difuseSpec = [difuse[0], difuse[1], difuse[2]];
      } else if (onlySpecular) {
        difuseSpec = [specular[0], specular[1], specular[2]];
      } else {
        difuseSpec = [
          difuse[0] + specular[0],
          difuse[1] + specular[1],
          difuse[2] + specular[2],
        ];
      }
      const difuseSpecLight = [
        lightColorWithIntensity()[0] * difuseSpec[0],
        lightColorWithIntensity()[1] * difuseSpec[1],
        lightColorWithIntensity()[2] * difuseSpec[2],
      ];
      generatedImg.push(
        Math.min(255, (ambient[0] + difuseSpecLight[0]) * 255),
        Math.min(255, (ambient[1] + difuseSpecLight[1]) * 255),
        Math.min(255, (ambient[2] + difuseSpecLight[2]) * 255),
        255,
      );
    }
  }

  let update = false;

  p5.preload = () => {
    baseColorImg = p5.loadImage(baseColorImage);
    normalMapImg = p5.loadImage(normalMapImage);
    specularMapImg = p5.loadImage(specularMapImage);
    lightVector = p5.createVector(0, 0);
  };
  p5.setup = () => {
    const canvas = p5.createCanvas(baseColorImg.width, baseColorImg.height);
    canvas.parent('canvas-container');
    p5.pixelDensity(1);
    defineRGBfromTextures();
    p5.loadPixels();
    phong();
  };
  p5.draw = () => {
    if (update) {
      phong();
      for (let x = 0; x < p5.width * p5.height * 4; x++) {
        p5.pixels[x + 0] = generatedImg[x + 0];
        p5.pixels[x + 1] = generatedImg[x + 1];
        p5.pixels[x + 2] = generatedImg[x + 2];
        p5.pixels[x + 3] = generatedImg[x + 3];
      }
      p5.updatePixels();
      update = false;
    }
  };
  p5.mouseMoved = () => {
    lightVector = p5.createVector(p5.mouseX, p5.mouseY);
    update = true;
  };
};

document.addEventListener('DOMContentLoaded', () => {
  const baseColorInput = <HTMLInputElement>(
    document.getElementById('base-color')
  );
  baseColorInput.onchange = () => {
    const selectedFile = baseColorInput.files[0];
    baseColorImage = URL.createObjectURL(selectedFile);
  };

  const normalMapInput = <HTMLInputElement>(
    document.getElementById('normal-map')
  );
  normalMapInput.onchange = () => {
    const selectedFile = normalMapInput.files[0];
    normalMapImage = URL.createObjectURL(selectedFile);
  };

  const specularMapInput = <HTMLInputElement>(
    document.getElementById('specular-map')
  );
  specularMapInput.onchange = () => {
    const selectedFile = specularMapInput.files[0];
    specularMapImage = URL.createObjectURL(selectedFile);
  };

  const generateImageButton = document.getElementById('generate-image-button');
  generateImageButton.addEventListener('click', () => {
    new P5(sketch);
  });

  const onlyDifuseInput = <HTMLInputElement>(
    document.getElementById('only-difuse')
  );
  const onlySpecularInput = <HTMLInputElement>(
    document.getElementById('only-specular')
  );
  onlyDifuseInput.onchange = () => {
    onlyDifuse = !onlyDifuse;
    onlySpecular = false;
    onlySpecularInput.checked = false;
  };
  onlySpecularInput.onchange = () => {
    onlySpecular = !onlySpecular;
    onlyDifuse = false;
    onlyDifuseInput.checked = false;
  };

  const redLightColorInput = <HTMLInputElement>(
    document.getElementById('red-light-color')
  );
  redLightColorInput.onchange = () => {
    lightColors[0] = parseInt(redLightColorInput.value);
  };
  const greenLightColorInput = <HTMLInputElement>(
    document.getElementById('green-light-color')
  );
  greenLightColorInput.onchange = () => {
    lightColors[1] = parseInt(greenLightColorInput.value);
  };
  const blueLightColorInput = <HTMLInputElement>(
    document.getElementById('blue-light-color')
  );
  blueLightColorInput.onchange = () => {
    lightColors[2] = parseInt(blueLightColorInput.value);
  };

  const lightIntensityColorInput = <HTMLInputElement>(
    document.getElementById('light-intensity-color')
  );
  lightIntensityColorInput.onchange = () => {
    lightIntensity = parseInt(lightIntensityColorInput.value);
  };
});
