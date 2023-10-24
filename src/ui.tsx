import "!prismjs/themes/prism.css";

import {
  Button,
  Checkbox,
  Container,
  render,
  Text,
  TextboxNumeric,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useState } from "preact/hooks";
import { SubmitNumberHandler } from "./types";
import workerScript from "./fibWorker.js";
import { useEffect } from "react";

function Plugin() {
  const [number, setNumber] = useState("10");
  const [webWorker, setWebWorker] = useState<any>();
  const [useWorker, setUseWorker] = useState<boolean>(false);

  // 💡 1. Since we cannot load external script but webworker needs a URL
  // convert the code than is meant to run in the webworker to
  // URL BLOB and pass it into the webworker:
  const loadWebWorker = (script: Function) => {
    const scriptStr = script.toString();
    return new Worker(URL.createObjectURL(new Blob([`(${scriptStr})()`])));
  };

  // 2. load the worker into state
  useEffect(() => {
    setWebWorker(loadWebWorker(workerScript));
  }, []);

  const handleSubmitButtonClick = () => {
    const num = parseInt(number, 10);

    const logResult = (num: number, fibNum: number, timeTaken: number, type: string) => {
      console.log(
        `Fib(${num})=${fibNum} (${parseFloat(`${timeTaken}`).toFixed(
          2
        )} ms, ${type} thread)`
      );
    };

    // either calculate on background threads (web worker)
    if (useWorker) {
      webWorker.postMessage({ number: num });
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
    webWorker.onmessage = (e: any) => {
      const { timeTaken, fibNum } = e.data;
      logResult(num, fibNum, timeTaken, "background");
      emit<SubmitNumberHandler>("SUBMIT_NUM", `${fibNum}`);
    };
    webWorker.onerror = (err: Error) => {
      console.log("webWorker error: ", err);
    };
  };
  return (
    <Container space="medium">
      <VerticalSpace space="small" />
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
      <Checkbox onChange={(event) => setUseWorker(event.currentTarget.checked)} value={useWorker}>
        <Text>use web worker</Text>
      </Checkbox>
      <VerticalSpace space="small" />
    </Container>
  );
}

export default render(Plugin);
