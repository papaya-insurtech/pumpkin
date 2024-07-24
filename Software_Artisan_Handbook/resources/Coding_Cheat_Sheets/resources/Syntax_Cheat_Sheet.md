# Syntax Cheat Sheet

1. Numeric Separators

    ```JavaScript
    const worldPopulationIn2017 = 7_600_000_000;
    const leastSignificantByteMask = 0b1111_1111;
    const papayawhipColorHexCode = 0xff_ef_d5;
    ```

2. Array

    ```JavaScript
    const [firstPerson] = persons;
    const lastPerson = persons.at(-1);
    ```

3. Loop

    ```JavaScript
    // Loop 5 times
    Array.from({ length: 5 }).forEach((_, index) => console.log(index));

    // Filter null/undefined objects from array. Becareful to use for Array that contains 0, false, ""
    const validPersonsOne = [null, undefined, { name: "John" }].filter(Boolean);
    // Filter exactly null/undefined
    const validPersonsTwo = [null, undefined, { name: "John" }].filter(p => p != null);
    ```

4. Pipe Operator Alternative Syntax

    ```JavaScript
    // Async function
    const students = await getStudents(params)
      .then(result => result.json())
      .catch(error => {
          // Cache the error that occurs from this function only
          log(error);
          return [];
      })
      .finally(() => {
          // Do some last important things
      });

    // Sync function
    const add = (a, b) => a + b;
    const multiply = (a, b) => a * b;
    const subtract = (a, b) => a - b;
    const result = await Promise.try(() => 1)
      .then(_ => add(_, 2))
      .then(_ => multiply(_, 3))
      .catch(error => {
          // Cache the error that occurs from the start to this point of pipe only
          log(error);
          return 0;
      })
      .then(_ => subtract(_, 4))
      .finally(() => {
          // Do some last important things that do not affect the return
      });
    ```

5. Custom Pipe Operator Alternative Class Wrapper

    ```TypeScript
      class Pipe<C extends () => any> {
        protected callback: C;
        static start<T extends (...args: any) => any>(callback: T): Pipe<T> {
          return new Pipe(callback);
        }
        then<T extends (result: ReturnType<C>) => any>(
          thenCallback: T
        ): Pipe<() => ReturnType<T>> {
          return new Pipe(() => thenCallback(this.callback()));
        }
        catch<E extends (error: unknown) => any>(
          catchCallback: E
        ): Pipe<() => ReturnType<E> | ReturnType<C>> {
          return new Pipe(() => {
            try {
              return this.callback();
            } catch (error) {
              return catchCallback(error);
            }
          });
        }
        finally<T extends () => void>(finallyCallback: T): Pipe<() => ReturnType<C>> {
          return new Pipe(() => {
            try {
              return this.callback();
            } finally {
              finallyCallback();
            }
          });
        }

        finish(): ReturnType<C> {
          return this.callback();
        }

        constructor(callback: C) {
          this.callback = callback;
        }
      }

      const add = (a, b) => a + b;
      const multiply = (a, b) => a * b;
      const subtract = (a, b) => a - b;
      const result = Pipe.start(() => 1)
        .then(_ => add(_, 2))
        .then(_ => multiply(_, 3))
        .catch(error => {
            // Cache the error that occurs from the start to this point of pipe only
            log(error);
            return 0;
        })
        .then(_ => subtract(_, 4))
        .finally(() => {
            // Do some last important things that do not affect the return
        });
    ```
