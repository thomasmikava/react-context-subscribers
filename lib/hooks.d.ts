declare type DependencyList = readonly any[];
declare type EqualityFn = (previous: DependencyList, current: DependencyList) => boolean;
export declare const createMemoHook: (areDepsEqual?: EqualityFn) => <T>(fn: () => T, deps: DependencyList) => T;
export {};
