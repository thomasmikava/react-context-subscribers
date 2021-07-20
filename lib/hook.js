import { useContext, useState, useRef, useLayoutEffect } from "react";
import { createMemoHook } from "./hooks";
import { depsShallowEquality } from "./equality-functions";
import { useForceUpdate } from "./re-render";
const EMPTY_DEPS = [
    `__$$EMPTY:%$W,w_&te-nw~[rzSETQK5{CB9V?F&+8n_m\nFZB?:fW]Y2QG$$__`,
];
const defaultTransformer = (...x) => x;
export const createContextSelectorHook = (context, isDefaultHookProviderId, useGettingDefaultValue) => {
    let defaultEqualityFn = globallyDefaultCompare;
    function useContextValue(...args) {
        const [fn, areDataEqual, deps, passedLabel] = getArgs(args, defaultEqualityFn);
        const [label] = useState(passedLabel);
        const fnRef = useRef(fn);
        const areDataEqualRef = useRef(areDataEqual);
        const latestSubscriptionCallbackErrorRef = useRef();
        const forceUpdate = useForceUpdate();
        const { getLatestValue, asyncReverseOrderSubscribe, id, isDestroyed } = useContext(context);
        if (isDefaultHookProviderId(id)) {
            useGettingDefaultValue();
        }
        const [transformedInitialValue] = useState(() => {
            return fn(...getLatestValue());
        });
        const transformedValueRef = useRef(transformedInitialValue);
        let selectedState;
        try {
            if (latestSubscriptionCallbackErrorRef.current && !isDestroyed()) {
                selectedState = fn(...getLatestValue());
            }
            else {
                selectedState = transformedValueRef.current;
            }
        }
        catch (err) {
            if (latestSubscriptionCallbackErrorRef.current) {
                if (label !== undefined)
                    err.message += `\nLabel: ${label}\n`;
                err.message += `\nThe error may be correlated with this previous error:\n${latestSubscriptionCallbackErrorRef.current.stack}\n\n`;
            }
            throw err;
        }
        useLayoutEffect(() => {
            latestSubscriptionCallbackErrorRef.current = undefined;
            transformedValueRef.current = selectedState;
            areDataEqualRef.current = areDataEqual;
            fnRef.current = fn;
        });
        useLayoutEffect(() => {
            let isCancelled = false;
            const cb = (...data) => {
                if (isCancelled)
                    return;
                try {
                    const value = fnRef.current(...data);
                    if (areDataEqualRef.current(transformedValueRef.current, value)) {
                        return;
                    }
                    transformedValueRef.current = value;
                }
                catch (err) {
                    // we ignore all errors here, since when the component
                    // is re-rendered, the selectors are called again, and
                    // will throw again
                    latestSubscriptionCallbackErrorRef.current = err;
                }
                forceUpdate();
            };
            const unsubscribe = asyncReverseOrderSubscribe((...args) => cb(...args), label);
            cb(...getLatestValue());
            return () => {
                isCancelled = true;
                unsubscribe();
            };
        }, [label]);
        useCustomMemoHook(() => {
            if (isDestroyed())
                return;
            const value = fn(...getLatestValue());
            if (areDataEqual(selectedState, value))
                return;
            selectedState = value;
        }, deps);
        return selectedState;
    }
    useContextValue.extendHook = function (fn) {
        const hook = createContextSelectorHook(context, isDefaultHookProviderId, useGettingDefaultValue);
        const finalHook = (trans, ...args) => {
            if (!trans) {
                const { fn: eqFn, isDefaultFn } = hook.getEqualityFnInfo();
                return hook((...rootData) => fn(...rootData), isDefaultFn ? depsShallowEquality : eqFn, []);
            }
            return hook((...rootData) => trans(...fn(...rootData)), ...args);
        };
        finalHook.setEqualityFn = hook.setEqualityFn;
        finalHook.extendHook = someFn => hook.extendHook((...data) => someFn(...fn(...data)));
        /* const defEq = (...args) => defaultEqualityFn(...args as [any, any]);
        defEq.___isSubscriberDefaultFn = () => {
            return isDefaultEquality(defaultEqualityFn)
        } */
        const copiedEquality = dublicateEqualityFn(useContextValue);
        finalHook.setEqualityFn(copiedEquality);
        finalHook.getEqualityFnInfo = () => {
            return {
                fn: copiedEquality,
                isDefaultFn: isDefaultEquality(copiedEquality),
            };
        };
        return finalHook;
    };
    useContextValue.setEqualityFn = equalityFn => {
        defaultEqualityFn = equalityFn;
    };
    useContextValue.getEqualityFnInfo = () => {
        return {
            fn: defaultEqualityFn,
            isDefaultFn: isDefaultEquality(defaultEqualityFn),
        };
    };
    return useContextValue;
};
export const dublicateEqualityFn = (useSelector) => {
    const selectorValueEqualityFn = (prev, next) => {
        return useSelector.getEqualityFnInfo().fn(prev, next);
    };
    selectorValueEqualityFn.___isSubscriberDefaultFn = () => {
        return useSelector.getEqualityFnInfo().isDefaultFn;
    };
    return selectorValueEqualityFn;
};
const shallowCompare = (prev, next) => {
    return prev === next;
};
shallowCompare.___isSubscriberDefaultFn = () => true;
const isDefaultEquality = (fn) => {
    if (typeof fn !== "function")
        return false;
    if (typeof fn.___isSubscriberDefaultFn !== "function")
        return false;
    return fn.___isSubscriberDefaultFn();
};
const globallyDefaultCompare = shallowCompare;
const useCustomMemoHook = createMemoHook((oldDeps, newDeps) => {
    if (oldDeps === EMPTY_DEPS || newDeps === EMPTY_DEPS)
        return false;
    return depsShallowEquality(oldDeps, newDeps);
});
const getArgs = (args, defaultEqualityFn) => {
    if (isDefaultEquality(defaultEqualityFn)) {
        defaultEqualityFn = undefined;
    }
    let label = undefined;
    if (typeof args[args.length - 1] === "string") {
        label = args[args.length - 1];
        args = args.slice(0, args.length - 1);
    }
    let areDataEqual = defaultEqualityFn || shallowCompare;
    let deps = null;
    const fn = args[0] ? args[0] : defaultTransformer;
    if (args.length > 2) {
        if (args[1])
            areDataEqual = args[1];
        deps = args[2];
    }
    else if (args[1] !== undefined) {
        if (Array.isArray(args[1]) || args[1] === null) {
            deps = args[1];
        }
        else if (typeof args[1] === "function") {
            areDataEqual = args[1];
        }
    }
    if (!args[0]) {
        areDataEqual = defaultEqualityFn || depsShallowEquality;
    }
    return [fn, areDataEqual, deps || EMPTY_DEPS, label];
};
