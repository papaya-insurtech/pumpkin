# Typing Cheat Sheet

## Type Definitions

1. JSON

    ```TypeScript
        export type JSON = string | number | boolean | null | { [key: string]: JSON } | JSON[];
    ```

2. Object

    ```TypeScript
        export type Object1 = { [key: string]: any };
        // Or
        export type Object2 = Record<string, any>;
    ```

3. Type of Costants

    ```TypeScript
        // VALUE has type string
        export const VALUE = "Value";
        // VALUES has type string[]
        export const VALUES = ["Value1", "Value2"];
        
        // VALUE has type "Value"
        export const VALUE = "Value" as const;
        // VALUES has type ("Value1" | "Value2")[]
        export const VALUES = ["Value1", "Value2"] as const;
    ```

4. Take avantage of Auto Suggestion

    ```TypeScript
        // Cannot get auto suggestion & type validation for the Array
        if(["Type1", "Type2"].includes(type)) {
            // Do something
        }

        // Can get auto suggestion which value can put in the Set & type validation for the Array
        if((["Type1", "Type2"] satisfies (typeof type)[]).includes(type)) {
            // Do something
        }
        if(new Set<typeof type>(["Type1", "Type2"]).has(type)) {
            // Do something
        }
        import includes from "lodash/includes";
        if(includes<typeof type>(["Type1", "Type2"], type)) {
            // Do something
        }
    ```
