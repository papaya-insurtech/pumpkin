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
    [...new Array(5)].forEach((_, index) => console.log(index));

    // Filter null/undefined objects from array. Becareful to use for Array that contains 0, false, ""
    const validPersonsOne = [null, undefined, { name: "John" }].filter(Boolean);
    // Filter exactly null/undefined
    const validPersonsTwo = [null, undefined, { name: "John" }].filter(p => p != null);
    ```
