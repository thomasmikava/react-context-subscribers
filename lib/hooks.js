import { useRef, useLayoutEffect } from "react";
import { depsShallowEquality } from "./equality-functions";
export const createMemoHook = (areDepsEqual = depsShallowEquality) => {
    const initialResultInfo = {
        called: false,
    };
    return (fn, deps) => {
        const resultRef = useRef(initialResultInfo);
        const depsRef = useRef(deps);
        let depsValue = depsRef.current;
        let resultValue = resultRef.current;
        useLayoutEffect(() => {
            depsRef.current = depsValue;
            resultRef.current = resultValue;
        });
        if (!resultValue.called) {
            resultValue = {
                called: true,
                data: fn(),
            };
            return resultValue.data;
        }
        const prevDeps = depsRef.current;
        const haveDepsChanged = !areDepsEqual(prevDeps, deps);
        if (haveDepsChanged) {
            // deps have changed; recalculating output;
            resultValue = {
                called: true,
                data: fn(),
            };
            depsValue = deps;
        }
        return resultValue.data;
    };
};
