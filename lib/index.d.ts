import React from "react";
import { ContextSubscraberValue, ContextSelectorHook } from "./interfaces";
export declare class ContextSubscriber<Data extends readonly any[]> {
    private defaultValueGetter;
    private readonly equalityFn;
    readonly context: React.Context<ContextSubscraberValue<Data>>;
    readonly useSelector: ContextSelectorHook<Data>;
    readonly defaultProvider: ContextSubscraberValue<Data>;
    private readonly useGettingDefaultValue;
    constructor(defaultValueGetter?: () => Data, getterType?: "function" | "hook", equalityFn?: (prev: Data, next: Data) => boolean);
    setDefaultValueGetter(fn: () => Data): void;
    private counter;
    private lastValuesByProviderIds;
    private subscriptionsByProviderIds;
    private readonly updateLastProviderValue;
    private readonly updateTempValue;
    private destroyIntervalProvider;
    registerNewProvider: () => ContextSubscraberValue<Data>;
    private getValue;
    hook: () => ContextSubscraberValue<Data>;
}
