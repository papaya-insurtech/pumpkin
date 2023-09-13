# DateTime Cheat Sheet

## Duration

1. Define duration

    ```JavaScript
    const TWO_HOURS_IN_MILLISECONDS = 2 * 60 * 60 * 1000;

    import hoursToMilliseconds from 'date-fns/hoursToMilliseconds'
    const FOUR_HOURS_IN_MILLISECONDS = hoursToMilliseconds(4);
    ```

2. Iterate each day/hour/minute ... with a pair of start date - end date

    ```JavaScript
    // https://date-fns.org/v2.30.0/docs/eachDayOfInterval
    import eachDayOfInterval from 'date-fns/eachDayOfInterval'
    
    eachDayOfInterval({start, end}).forEach((day) => {
        // Do something with day
    });
    ```

3. [Date FNS](https://date-fns.org/) has a lot of utility functions. Please search for them before implementing your own.
