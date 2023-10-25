import "!prismjs/themes/prism.css";

import {
  Button,
  Checkbox,
  Container,
  Divider,
  Muted,
  render,
  Text,
  TextboxNumeric,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useState } from "preact/hooks";
import { useCallback, useEffect } from "react";
import {
  GetPreviewHandler,
  PaintImageHandler,
  SubmitNumberHandler,
} from "./types";
import fibWorkerScript from "./fibWorker.js";
import imageProcessingWorkerScript from "./imageWorker.js";
import { decode, encode } from "./lib/imageProcessingUtils";

function Plugin() {
  const [number, setNumber] = useState("10");
  const [fibWebWorker, setFibWebWorker] = useState<any>();
  const [usefibWorker, setUseFibWorker] = useState<boolean>(false);

  const [imageProcessingWebWorker, setImageProcessingWebWorker] =
    useState<any>();

  // 💡 1. Since we cannot load external script but webworker needs a URL
  // convert the code than is meant to run in the webworker to
  // URL BLOB and pass it into the webworker:
  const loadWebWorker = (script: Function) => {
    const scriptStr = script.toString();
    return new Worker(URL.createObjectURL(new Blob([`(${scriptStr})()`])));
  };

  // 2. load the workers into state
  useEffect(() => {
    setFibWebWorker(loadWebWorker(fibWorkerScript));
    setImageProcessingWebWorker(loadWebWorker(imageProcessingWorkerScript));

    // WIP: clean up web workers
    return () => {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
          registration.unregister();
        }
      });
    };
  }, []);

  // 💡 Example 1: Fib number
  const handleSubmitButtonClick = () => {
    const num = parseInt(number, 10);

    const logResult = (
      num: number,
      fibNum: number,
      timeTaken: number,
      type: string
    ) => {
      console.log(
        `Fib(${num})=${fibNum} (${parseFloat(`${timeTaken}`).toFixed(
          2
        )} ms, ${type} thread)`
      );
    };

    // either calculate on background threads (web worker)
    if (usefibWorker) {
      fibWebWorker.postMessage({ number: num });
    } else {
      // or calculate fib on main thread:
      // (but the UI will stuck for a while when the calculation is heavy)
      const fib = (n: number): number => (n < 2 ? n : fib(n - 1) + fib(n - 2));
      const start = performance.now();
      const fibNum = fib(num);
      const timeTaken = performance.now() - start;
      logResult(num, fibNum, timeTaken, "main");
      emit<SubmitNumberHandler>("SUBMIT_NUM", `${fibNum}`);
    }

    // after we finish the calculation on background threads,
    // return the result to main thread.
    fibWebWorker.onmessage = (e: any) => {
      const { timeTaken, fibNum } = e.data;
      logResult(num, fibNum, timeTaken, "background");
      emit<SubmitNumberHandler>("SUBMIT_NUM", `${fibNum}`);
    };
    fibWebWorker.onerror = (err: Error) => {
      console.log("webWorker error: ", err);
    };
  };

  // 💡 Example 2: Image processing
  const handleImageProcessing = () => {
    // first, send a signal to Figma to get the image data. (main thread -> Figma)
    emit<GetPreviewHandler>("GET_PREVIEW");
  };

  const imageProcessing = useCallback(
    async (imageBytes: any) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const imageDetails = await decode(canvas, ctx!, imageBytes);
      const preset = {
        image: {
          data: imageDetails.imageData,
          width: imageDetails.width,
          height: imageDetails.height,
        },
        processing: {
          greyscaleMethod: "Disabled", // "Luminance", "RGB Average", "Disabled"
          ditherMethod: "Atkinson Dithering", // "Atkinson Dithering", "Threshold"
        },
      };

      // send image data to the bg thread to do heavy image processing
      // (main thread -> bg thread)
      imageProcessingWebWorker.postMessage(preset);

      // process finished, receive the image from background thread
      // (bg thread -> main thread)
      imageProcessingWebWorker.onmessage = async (e: any) => {
        const { processedPreviewImageBytes } = e.data;
        const newBytes = await encode(
          canvas,
          ctx!,
          processedPreviewImageBytes.image.data
        );

        // got processed result and send to figma worker to render on Figma canvas.
        // (main thread -> Figma worker)
        emit<PaintImageHandler>("PAINT_IMAGE", { imageBytes: newBytes });
      };
      imageProcessingWebWorker.onerror = (err: Error) => {
        console.log("image processing web worker error: ", err);
      };
    },
    [imageProcessingWebWorker]
  );

  useEffect(() => {
    onmessage = (event) => {
      //get the image data. (Figma -> main thread)
      const { type } = event.data.pluginMessage;
      if (type === "get-node-image-bytes") {
        const imageBytes = event.data.pluginMessage.imageBytes;
        imageProcessing(imageBytes);
      }
    };
  }, [imageProcessingWebWorker]);

  return (
    <Container space="medium">
      {/*  */}
      <VerticalSpace space="large" />
      <Text>Example 1: Fib number</Text>
      <VerticalSpace space="small" />
      <Text><Muted>Get a Fibonacci number by entering the index (try 42 or 43)</Muted></Text>
      <VerticalSpace space="large" />
      <TextboxNumeric
        onInput={(event) => setNumber(event.currentTarget.value)}
        value={`${number}`}
        variant="border"
      />
      <VerticalSpace space="small" />
      <Button fullWidth onClick={handleSubmitButtonClick}>
        Get Fibonacci number
      </Button>
      <VerticalSpace space="small" />
      <Checkbox
        onChange={(event) => setUseFibWorker(event.currentTarget.checked)}
        value={usefibWorker}
      >
        <Text>use web worker</Text>
      </Checkbox>
      <VerticalSpace space="small" />
      <Divider />
      {/*  */}
      <VerticalSpace space="large" />
      <Text>Example 2: Image processing</Text>
      <VerticalSpace space="small" />
      <Text><Muted>Apply a filter on top of the selected image</Muted></Text>
      <VerticalSpace space="large" />
      <Button fullWidth onClick={handleImageProcessing}>
        Image processing
      </Button>
      <VerticalSpace space="small" />
      <Divider />
      {/*  */}
    </Container>
  );
}

export default render(Plugin);
