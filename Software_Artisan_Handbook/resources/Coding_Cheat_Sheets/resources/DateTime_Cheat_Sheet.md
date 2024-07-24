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

3. Create a Date in specific timezone (ignore device/server timezone setting) with a Naive DateTime input

    ```JavaScript
    import { fromZonedTime } from "date-fns-tz";
    // device/server timezone is Asia/Ho_Chi_Minh
    
    // Nave DateTime input without timezone
    const input = "2025-01-01T00:00:00" 
    // Create a Date object in device/server timezone
    const localDate = new Date(input);
    // Create a Date object in Asia/Singapore timezone
    const usDate = fromZonedTime(input, 'Asia/Singapore'); 

    console.log(localDate); // 2024-12-31T17:00:00.000Z => 2025-01-01T00:00:00+07:00
    console.log(usDate); // 2024-12-31T16:00:00.000Z => 2025-01-01T00:00:00+08:00
    ```

4. [Date FNS](https://date-fns.org/) has a lot of utility functions. Please search for them before implementing your own.
