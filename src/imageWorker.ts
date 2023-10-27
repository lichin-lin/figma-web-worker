// WEB WORKER - Heavy loading image data calculation task
// @ts-nocheck
export default () => {
  self.onmessage = async (message) => {
    function applyGrayFilter(image) {
      for (var i = 0; i <= image.data.length; i += 4) {
        image.data[i] =
          image.data[i + 1] =
          image.data[i + 2] =
            parseInt(
              image.data[i] * 0.21 +
                image.data[i + 1] * 0.71 +
                image.data[i + 2] * 0.07,
              10
            );
      }
      return image;
    }

    function greyscale_average(image) {
      for (var i = 0; i <= image.data.length; i += 4) {
        image.data[i] =
          image.data[i + 1] =
          image.data[i + 2] =
            parseInt(
              (image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3,
              10
            );
      }
      return image;
    }

    function dither_atkinson(image, imageWidth, drawColour) {
      skipPixels = 4;

      if (!drawColour) drawColour = false;

      if (drawColour == true) skipPixels = 1;

      imageLength = image.data.length;

      for (
        currentPixel = 0;
        currentPixel <= imageLength;
        currentPixel += skipPixels
      ) {
        if (image.data[currentPixel] <= 128) {
          newPixelColour = 0;
        } else {
          newPixelColour = 255;
        }

        err = parseInt((image.data[currentPixel] - newPixelColour) / 8, 10);
        image.data[currentPixel] = newPixelColour;

        image.data[currentPixel + 4] += err;
        image.data[currentPixel + 8] += err;
        image.data[currentPixel + 4 * imageWidth - 4] += err;
        image.data[currentPixel + 4 * imageWidth] += err;
        image.data[currentPixel + 4 * imageWidth + 4] += err;
        image.data[currentPixel + 8 * imageWidth] += err;

        if (drawColour == false)
          image.data[currentPixel + 1] = image.data[currentPixel + 2] =
            image.data[currentPixel];
      }

      return image.data;
    }

    function dither_threshold(image, threshold_value) {
      for (var i = 0; i <= image.data.length; i += 4) {
        image.data[i] = image.data[i] > threshold_value ? 255 : 0;
        image.data[i + 1] = image.data[i + 1] > threshold_value ? 255 : 0;
        image.data[i + 2] = image.data[i + 2] > threshold_value ? 255 : 0;
      }
    }

    function replace_colours(image, black, white) {
      for (var i = 0; i <= image.data.length; i += 4) {
        image.data[i] = image.data[i] < 127 ? black.r : white.r;
        image.data[i + 1] = image.data[i + 1] < 127 ? black.g : white.g;
        image.data[i + 2] = image.data[i + 2] < 127 ? black.b : white.b;
        image.data[i + 3] =
          (image.data[i] + image.data[i + 1] + image.data[i + 2]) / 3 < 127
            ? black.a
            : white.a;
      }
    }

    function applyWarmFilter(imageData) {
      for (let i = 0; i < imageData.data.length; i += 4) {
        const red = imageData.data[i];
        const green = imageData.data[i + 1];
        const blue = imageData.data[i + 2];

        // Increase red and green channels to create a warm effect
        imageData.data[i] = Math.min(255, red + 30);
        imageData.data[i + 1] = Math.min(255, green + 10);
        // Blue channel remains unchanged to preserve cool colors

        // Adjust the overall brightness
        const brightness = (red + green + blue) / 3;
        imageData.data[i] = Math.min(
          255,
          imageData.data[i] + (brightness / 128) * 20
        );
        imageData.data[i + 1] = Math.min(
          255,
          imageData.data[i + 1] + (brightness / 128) * 10
        );
        imageData.data[i + 2] = Math.min(
          255,
          imageData.data[i + 2] + (brightness / 128) * 5
        );
      }
    }
    function applyCoolFilter(imageData) {
      for (let i = 0; i < imageData.data.length; i += 4) {
        const red = imageData.data[i];
        const green = imageData.data[i + 1];
        const blue = imageData.data[i + 2];

        // Decrease red and green channels to create a cool effect
        imageData.data[i] = Math.max(0, red - 10);
        imageData.data[i + 1] = Math.max(0, green - 10);
        // Blue channel remains unchanged to preserve cool colors

        // Adjust the overall brightness
        const brightness = (red + green + blue) / 3;
        imageData.data[i] = Math.max(
          0,
          imageData.data[i] - (brightness / 128) * 20
        );
        imageData.data[i + 1] = Math.max(
          0,
          imageData.data[i + 1] - (brightness / 128) * 10
        );
        imageData.data[i + 2] = Math.max(
          0,
          imageData.data[i + 2] - (brightness / 128) * 5
        );
      }
    }

    function applyCozyFilter(imageData) {
      const brightness = 1; // Adjust the overall brightness
      const saturation = 0.8; // Adjust the saturation
      const contrast = 0.8; // Adjust the contrast

      for (let i = 0; i < imageData.data.length; i += 4) {
        // Apply brightness adjustment
        imageData.data[i] *= brightness;
        imageData.data[i + 1] *= brightness;
        imageData.data[i + 2] *= brightness;

        // Apply saturation adjustment
        const grayValue =
          (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) /
          3;
        imageData.data[i] =
          imageData.data[i] * saturation + grayValue * (1 - saturation);
        imageData.data[i + 1] =
          imageData.data[i + 1] * saturation + grayValue * (1 - saturation);
        imageData.data[i + 2] =
          imageData.data[i + 2] * saturation + grayValue * (1 - saturation);

        // Apply contrast adjustment
        imageData.data[i] = (imageData.data[i] - 128) * contrast + 128;
        imageData.data[i + 1] = (imageData.data[i + 1] - 128) * contrast + 128;
        imageData.data[i + 2] = (imageData.data[i + 2] - 128) * contrast + 128;
      }

      return imageData;
    }

    function fuzzFilter(imageData, width, height, amount) {
      const data = imageData.data;
      const fuzzyPixels = 2; // pixels
      const modC = 4 * fuzzyPixels; // channels * pixels
      const modW = 4 * width * 1;

      for (let i = 0; i < data.length; i += 4) {
        const f = modC + modW;
        const grainAmount = Math.random() * 2 * amount - amount;
        // fuzzify
        if (data[i + f]) {
          data[i] = Math.round((data[i] + data[i + f]) / 2);
          data[i + 1] = Math.round((data[i + 1] + data[i + f + 1]) / 2);
          data[i + 2] = Math.round((data[i + 2] + data[i + f + 2]) / 2);
        }
        // granulate
        data[i] += grainAmount; // Red channel
        data[i + 1] += grainAmount; // Green channel
        data[i + 2] += grainAmount; // Blue channel
      }
    }

    // DITHER
    async function dither(data) {
      switch (data.processing.option) {
        case "Warm":
          applyWarmFilter(data.image.data);
          break;
        case "Cool":
          applyCoolFilter(data.image.data);
          break;
        case "Cozy":
          applyCozyFilter(data.image.data);
          break;
        case "B&W":
          applyGrayFilter(data.image.data);
          break;
      }
      fuzzFilter(data.image.data, data.image.width, data.image.height, 30);
      return data;
    }

    // main function
    const start = performance.now();
    const processedPreviewImageBytes = await dither(message.data);
    const timeTaken = performance.now() - start;
    postMessage({
      processedPreviewImageBytes,
      timeTaken,
    });
  };
};

// backup code:
// if (data.processing.greyscaleMethod == "Luminance") {
//   greyscale_luminance(data.image.data);
// } else if (data.processing.greyscaleMethod == "RGB Average") {
//   greyscale_average(data.image.data);
// }
// if (data.processing.ditherMethod == "Atkinson Dithering") {
//   dither_atkinson(
//     data.image.data,
//     data.image.width,
//     data.processing.greyscaleMethod == "Disabled"
//   );
// } else if (data.processing.ditherMethod == "Threshold") {
//   dither_threshold(data.image.data, data.processing.ditherThreshold);
// }
