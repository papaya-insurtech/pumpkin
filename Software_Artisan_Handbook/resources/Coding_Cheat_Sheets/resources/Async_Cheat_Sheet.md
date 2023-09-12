# Async Cheat Sheet

## Utilities

1. [Sleep](http://bluebirdjs.com/docs/api/promise.delay.html)

    ```JavaScript
    import BPromise from "bluebird"
    // http://bluebirdjs.com/docs/api/promise.delay.html
    await BPromise.delay(5000);
    ```

2. [Timeout](http://bluebirdjs.com/docs/api/timeout.html)

    ```JavaScript
    import BPromise from "bluebird"
    // http://bluebirdjs.com/docs/api/timeout.html
    const result = await BPromise.resolve(asyncFunction()).timeout(5000);
    ```

3. [Retry](https://www.npmjs.com/package/async-retry)

    ```JavaScript
    import retry, { Options } from "async-retry";

    // The opts are passed to options
    //    retries: The maximum amount of times to retry the operation. Default is 10.
    //    factor: The exponential factor to use. Default is 2.
    //    minTimeout: The number of milliseconds before starting the first retry. Default is 1000.
    //    maxTimeout: The maximum number of milliseconds between two retries. Default is Infinity.
    //    randomize: Randomizes the timeouts by multiplying with a factor between 1 to 2. Default is true.
    //    onRetry: an optional Function that is invoked after a new retry is performed. It's passed the Error that triggered it as a parameter.

    // Example:
    // async function fetchData(url) {
    //   const randomNumber = Math.random();
    //   if (randomNumber < 0.8) {
    //     throw new Error("Failed to fetch data");
    //   }
    //   return `Data fetched successfully from ${url}`;
    // }
    //
    // const result = await retryAsync(fetchData, ["https://google.com"], { retries: 5 });

    export const retryAsync = async (fn, params, options) => {
    const r = await retry(async () => {
        const result = await fn(...params);
        return result;
    }, options);
    return r;
    };

    export default { retryAsync };
    ```
