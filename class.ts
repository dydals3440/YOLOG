class InvalidAgeError extends Error {
  constructor(public readonly value: number) {
    super(`Invalid age: ${value}`);
    this.name = 'InvalidAgeError';
  }
}

class Person {
  constructor(private age: number) {
    if (age < 0) {
      throw new InvalidAgeError(age);
    }
  }
}

try {
  const person = new Person(-1);
  console.log(person);
} catch (error) {
  if (error instanceof InvalidAgeError) {
    console.log(error.message); // Invalid age: -1
  }
}
