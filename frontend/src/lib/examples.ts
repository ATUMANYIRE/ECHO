/** Starter programs students can load from the example selector. */

export interface ExampleProgram {
  id: string;
  title: string;
  hint: string;
  code: string;
  expected: string;
}

export const EXAMPLES: ExampleProgram[] = [
  {
    id: "accumulator",
    title: "Average of scores",
    hint: "Prints the wrong average",
    code: `scores = [60, 80, 100]
total = 0
for score in scores:
    total = score
average = total / len(scores)
print(average)`,
    expected:
      "Iterate through scores [60, 80, 100], sum all values, and calculate average: 80.0",
  },
  {
    id: "off_by_one",
    title: "Printing a list",
    hint: "Crashes with an IndexError",
    code: `items = ["alpha", "beta", "gamma"]
# Bug: range(len + 1) indexes past list bounds
for i in range(len(items) + 1):
    print(f"Item {i}: {items[i]}")`,
    expected:
      "Iterate through items ['alpha', 'beta', 'gamma'] and print item 0, 1, 2 without IndexError.",
  },
  {
    id: "recursion",
    title: "Factorial",
    hint: "Watch a function call itself",
    code: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

result = factorial(4)
print(f"4! = {result}")`,
    expected: "Recursively compute factorial of 4, returning 24.",
  },
];

export const DEFAULT_EXAMPLE = EXAMPLES[0];
