// The first RNTL test in a file pays jest-expo's cold module load, which exceeds Jest's 5 s default
// on CI runners. (`testTimeout` is a global-only option and is ignored inside `projects`.)
jest.setTimeout(30_000);

export {};
