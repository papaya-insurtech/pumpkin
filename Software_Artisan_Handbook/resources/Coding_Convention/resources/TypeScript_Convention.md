# TypeScript Coding Convention

## Naming Convention

TypeScript is a superset of JavaScript that adds static typing and other features to the language. When writing TypeScript code, it's important to follow a consistent naming convention to make your code more readable and maintainable. In this document, we'll cover some best practices for naming conventions in TypeScript.

### General Rules

- Use camelCase for variable and function names.
- Use PascalCase for class and interface names.
- Use UPPER_CASE for constants.
- Respect English grammar.
- Always use descriptive names, even if they are long names.
- Always use the same term (in English) as the Product team (or other non-tech teams) use to name things.
- Always use ubiquitous language.

### Variables

- Use descriptive names that convey the purpose of the variable.
- Only using single-letter (or short) variable names for a small enough code block.
- Prefix boolean variables with a word that indicates they are boolean values and aligned with English grammar and the meaning of the variable. For example, `isLoading`, `hasError`, `shouldUpdate`.
- Use plural names for arrays. For example, `users`, `items`, `children`, `livesAssured`.

### Functions

- Use verbs or verb phrases for function names that describe what the function does. For example, `getUser`, `calculateTotal`.
- Use descriptive names for function parameters.

### Type

- Use nouns or noun phrases for class names that describe what the class represents. For example, `User`, `Product`.
- Use PascalCase for Type names.
- Use singular names for types that are not array Types.
- Use unused args with a leading underscore. For example, `_name`, `_age`.
- Use getters and setters for accessing private properties.

### Enums

- Use UPPER_CASE for enum names.

## Syntax Convention

- Prefer modern syntax or syntax sugar.
  - Spread syntax.
  - Destructuring assignment.
  - Optional chaining.
    - When to use
    - When not to use
  - Nullish coalescing operator.
  - Template literals.
  - Arrow functions.
- Nullish check: `== null` or `!= null` for (check `null` or `undefined`).
- Restrict implicit truthy and falsy checking.
- Type conversion.
- Prevent default values using the `||` operator.

## Logic convention

- Prefer early return over nested if-else.
- Prefer the ternary operator over if-else.
- Prefer switch case or multiple if over nested if-else.
- Prefer key/value map over switch case.

## Declarative Programming

Declarative programming is a programming paradigm that focuses on describing what the program should accomplish, rather than how it should be accomplished. In declarative programming, the programmer specifies the desired outcome or goal of the program, and the program itself takes care of the implementation details.

This is in contrast to imperative programming, where the programmer specifies the exact steps that the program should take to achieve the desired outcome. Declarative programming is often used in functional programming languages, where functions are treated as first-class citizens and can be composed together to form more complex programs.

Declarative programming is often associated with several benefits, including increased readability, maintainability, and modularity of code. By focusing on the desired outcome rather than the details of implementation, declarative programs can be easier to understand and modify over time. Additionally, declarative programming can often lead to more concise and expressive code, as the programmer can express complex operations more naturally and intuitively.

```typescript
const numbers = [1, 2, 3, 4, 5];

// Imperative approach
const filteredNumbers = [];
for (let i = 0; i < numbers.length; i++) {
  if (numbers[i] > 2) {
    filteredNumbers.push(numbers[i]);
  }
}

// Declarative approach
const filteredNumbers2 = numbers.filter(num => num > 2);
```

## Functional Programming

## Type Convention

- Using `type` over `interface`
