import { ContextSelectorHook, ContextSubscraberValue } from "./interfaces";
import React from "react";
export declare const createContextSelectorHook: <Data extends readonly any[]>(context: React.Context<ContextSubscraberValue<Data>>, isDefaultHookProviderId: (id: number) => boolean, useGettingDefaultValue: () => void) => ContextSelectorHook<Data>;
export declare const dublicateEqualityFn: (useSelector: ContextSelectorHook<any>) => {
    (prev: any, next: any): boolean;
    ___isSubscriberDefaultFn(): boolean;
};
