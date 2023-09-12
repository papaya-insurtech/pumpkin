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
