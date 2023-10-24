// WEB WORKER - Heavy loading calculation task
// reference1: https://github.com/ahkohd/FigmaDither/blob/master/src/worker/entry.html
// reference2: https://github.com/rsms/scripter/

export default () => {
  self.onmessage = (message) => {
    const { number } = message.data;
    const fib = (n: number): number => (n < 2 ? n : fib(n - 1) + fib(n - 2));

    const start = performance.now();
    const fibNum = fib(number);
    const timeTaken = performance.now() - start;
    postMessage({
      fibNum,
      timeTaken,
    });
  };
};
