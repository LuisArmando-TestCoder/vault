type Populator<T extends object> = (propertyPath: string, value: any) => T;

function createObjectPopulator<T extends object>(obj: T): Populator<T> {
  return function(propertyPath: string, value: any): T {
    const keys = propertyPath.split(".");

    // Recursive helper that builds a new nested object for the given chain.
    const updateNested = (current: any, keys: string[]): any => {
      // Take the first key from the chain
      const [first, ...rest] = keys;

      // If there are no more keys, assign the value to this key.
      if (rest.length === 0) {
        return {
          ...current,
          [first]: value
        };
      }
      // Otherwise, recursively update the nested object.
      return {
        ...current,
        [first]: updateNested(current && current[first] ? current[first] : {}, rest)
      };
    };

    // Return a new object with the updated chain.
    return updateNested(obj, keys);
  };
}

// Example usage:
const initialObject = { existing: "data", nested: { value: [1,2,35], already: { there: true } }, this: { exists: true } };
const populator = createObjectPopulator(initialObject);

const updatedChain = createObjectPopulator(initialObject)("this.thing.is.a.chain.of.properties", "hello");
console.log("Nested chain update:", JSON.stringify(updatedChain, null, 2));
/* Output:
{
  "existing": "data",
  "nested": {
    "value": [1,2,35],
    "already": {
      "there": true
    }
  },
  "this": {
    "exists": true,
    "thing": {
      "is": {
        "a": {
          "chain": {
            "of": {
              "properties": "hello"
            }
          }
        }
      }
    }
  }
}
*/

// test rn with something like
// deno run populatorFunction.ts
