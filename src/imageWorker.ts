// WEB WORKER - Heavy loading calculation task
// @ts-nocheck
export default () => {
  self.onmessage = (message) => {
    // Convert image data to greyscale based on luminance.
    function greyscale_luminance(image) {
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

    // Convert image data to greyscale based on average of R, G and B values.
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

    // Apply Atkinson Dither to Image Data
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
        imageData.data[i] = Math.min(255, red + 50);
        imageData.data[i + 1] = Math.min(255, green + 20);
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
        imageData.data[i] = Math.max(0, red - 20);
        imageData.data[i + 1] = Math.max(0, green - 20);
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

    function filmGrainFilter(imageData, intensity) {
      const noiseAmount = 20 * intensity; // Adjust the noise amount based on the intensity

      for (let i = 0; i < imageData.data.length; i += 4) {
        const randomValue = Math.random() * noiseAmount - noiseAmount / 2;

        // Add random noise to the color channels
        imageData.data[i] = Math.min(255, imageData.data[i] + randomValue);
        imageData.data[i + 1] = Math.min(
          255,
          imageData.data[i + 1] + randomValue
        );
        imageData.data[i + 2] = Math.min(
          255,
          imageData.data[i + 2] + randomValue
        );
      }

      return imageData;
    }
    function cozyFadedFilter(imageData) {
      const brightness = 0.8; // Adjust the overall brightness
      const saturation = 0.6; // Adjust the saturation
      const contrast = 0.92; // Adjust the contrast

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
    function blackAndWhiteFilter(imageData) {
      for (let i = 0; i < imageData.data.length; i += 4) {
        const red = imageData.data[i];
        const green = imageData.data[i + 1];
        const blue = imageData.data[i + 2];

        // Calculate the average value of the RGB channels
        const averageValue = (red + green + blue) / 3;

        // Set the color channels to the average value to create a grayscale effect
        imageData.data[i] = averageValue;
        imageData.data[i + 1] = averageValue;
        imageData.data[i + 2] = averageValue;
      }
    }
    function grayFilter(imageData) {
      const threshold = 128; // Adjust the threshold value

      for (let i = 0; i < imageData.data.length; i += 4) {
        const red = imageData.data[i];
        const green = imageData.data[i + 1];
        const blue = imageData.data[i + 2];

        // Calculate the average value of the RGB channels
        const averageValue = (red + green + blue) / 3;

        // Adjust the intensity of black pixels (below the threshold) to appear as gray
        if (averageValue < threshold) {
          const grayValue = Math.round((averageValue / threshold) * 128); // Adjust the gray value
          imageData.data[i] = grayValue;
          imageData.data[i + 1] = grayValue;
          imageData.data[i + 2] = grayValue;
        } else {
          // Set white pixels (above or equal to the threshold) to pure white
          imageData.data[i] = 255;
          imageData.data[i + 1] = 255;
          imageData.data[i + 2] = 255;
        }
      }
    }
    function glitchFilter(imageData) {
      const glitchIntensity = 0.1; // Adjust the intensity of the glitch effect

      for (let i = 0; i < imageData.data.length; i += 4) {
        // Add random noise to color channels
        imageData.data[i] =
          imageData.data[i] + Math.random() * glitchIntensity * 255;
        imageData.data[i + 1] =
          imageData.data[i + 1] + Math.random() * glitchIntensity * 255;
        imageData.data[i + 2] =
          imageData.data[i + 2] + Math.random() * glitchIntensity * 255;

        // Randomly offset pixel positions
        const offsetX = Math.floor(Math.random() * glitchIntensity * 10);
        const offsetY = Math.floor(Math.random() * glitchIntensity * 10);
        const newIndex =
          (((i / 4 + offsetX) % imageData.width) + imageData.width * offsetY) *
          4;

        // Swap color channels with nearby pixels
        imageData.data[i] = imageData.data[newIndex];
        imageData.data[i + 1] = imageData.data[newIndex + 1];
        imageData.data[i + 2] = imageData.data[newIndex + 2];
      }
    }
    // DITHER
    function dither(data) {
      if (data.processing.greyscaleMethod == "Luminance") {
        greyscale_luminance(data.image.data);
      } else if (data.processing.greyscaleMethod == "RGB Average") {
        greyscale_average(data.image.data);
      }

      // texture
      if (data.processing.ditherMethod == "Atkinson Dithering") {
        dither_atkinson(
          data.image.data,
          data.image.width,
          data.processing.greyscaleMethod == "Disabled"
        );
      } else if (data.processing.ditherMethod == "Threshold") {
        dither_threshold(data.image.data, data.processing.ditherThreshold);
      }

      // theme
      // applyWarmFilter(data.image.data);
      // applyCoolFilter(data.image.data);
      cozyFadedFilter(data.image.data);

      // black and white
      // blackAndWhiteFilter(data.image.data);
      // grayFilter(data.image.data);

      return data;
    }

    // main function
    const start = performance.now();
    const processedPreviewImageBytes = dither(message.data);
    const timeTaken = performance.now() - start;
    postMessage({
      processedPreviewImageBytes,
      timeTaken,
    });
  };
};
