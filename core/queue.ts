/** Create a minimal async queue with configurable concurrency. */
export function newQueue(concurrency: number) {
  let pending = 0;
  const queue: (() => void)[] = [];

  function add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = async () => {
        pending++;
        try {
          resolve(await fn());
        } catch (err) {
          reject(err);
        } finally {
          pending--;
          queue.shift()?.();
        }
      };

      if (pending < concurrency) {
        run();
      } else {
        queue.push(run);
      }
    });
  }

  return { add };
}
