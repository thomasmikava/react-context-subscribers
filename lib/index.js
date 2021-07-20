import React, { useContext, useLayoutEffect } from "react";
import { Subscription } from "simple-subscriptions";
import { createContextSelectorHook } from "./hook";
const EMPTY_VAL = `__$$emptyValue:-r$H5*AUg&TPWUkH_fPbLLNJQfHF4WQ%&rey)qCJP+]83~J^v__$$`;
export class ContextSubscriber {
    constructor(defaultValueGetter = (() => EMPTY_VAL), getterType = "function", equalityFn = defaultShallowEquality) {
        this.defaultValueGetter = defaultValueGetter;
        this.equalityFn = equalityFn;
        this.useGettingDefaultValue = () => {
            const value = this.defaultValueGetter();
            if (value === EMPTY_VAL) {
                throw new Error("Cannot use ContextSubscriber without default value or provider");
            }
            this.defaultProvider.useUpdateValue(...value);
        };
        this.counter = 0;
        this.lastValuesByProviderIds = {};
        this.subscriptionsByProviderIds = {};
        this.updateLastProviderValue = (id, ...value) => {
            const isInitialCall = !this.lastValuesByProviderIds.hasOwnProperty(id) || !this.lastValuesByProviderIds[id].hasOwnProperty("data");
            const oldValue = this.lastValuesByProviderIds[id] && (this.lastValuesByProviderIds[id].hasOwnProperty("data") ? this.lastValuesByProviderIds[id].data : this.lastValuesByProviderIds[id].tempData);
            if (!this.lastValuesByProviderIds[id]) {
                this.lastValuesByProviderIds[id] = { data: value };
            }
            else {
                if (!this.lastValuesByProviderIds[id].hasOwnProperty("data")) {
                    this.lastValuesByProviderIds[id].data = this.lastValuesByProviderIds[id].tempData;
                }
                this.lastValuesByProviderIds[id].useTempData = false;
                delete this.lastValuesByProviderIds[id].tempData;
            }
            const areEqual = isInitialCall ? false : this.equalityFn(oldValue, value);
            if (!areEqual) {
                this.lastValuesByProviderIds[id].data = value;
                this.subscriptionsByProviderIds[id].broadcast(...value);
            }
        };
        this.updateTempValue = (id, ...value) => {
            const isInitialCall = !this.lastValuesByProviderIds.hasOwnProperty(id);
            const oldValue = this.lastValuesByProviderIds[id] && (this.lastValuesByProviderIds[id].useTempData ? this.lastValuesByProviderIds[id].tempData : this.lastValuesByProviderIds[id].data);
            if (isInitialCall)
                this.lastValuesByProviderIds[id] = {};
            this.lastValuesByProviderIds[id].useTempData = true;
            if (isInitialCall || !this.lastValuesByProviderIds[id].hasOwnProperty("tempData") || !this.equalityFn(oldValue, value)) {
                this.lastValuesByProviderIds[id].tempData = value;
            }
        };
        this.destroyIntervalProvider = (id) => {
            setTimeout(() => {
                delete this.lastValuesByProviderIds[id];
            }, 1);
        };
        this.registerNewProvider = () => {
            this.counter++;
            const id = this.counter;
            const subscription = new Subscription();
            this.subscriptionsByProviderIds[id] = subscription;
            return {
                id,
                getLatestValue: () => this.getValue(id),
                subscribe: subscription.subscribe,
                asyncReverseOrderSubscribe: subscription.asyncReverseOrderSubscribe,
                updateValue: (...value) => this.updateLastProviderValue(id, ...value),
                useUpdateValue: (...value) => {
                    this.updateTempValue(id, ...value);
                    useLayoutEffect(() => {
                        this.updateLastProviderValue(id, ...value);
                    });
                },
                destroy: () => this.destroyIntervalProvider(id),
                isDestroyed: () => !this.lastValuesByProviderIds.hasOwnProperty(id),
            };
        };
        this.getValue = (id) => {
            if (!this.lastValuesByProviderIds.hasOwnProperty(id)) {
                throw new Error("context is not initialized yet");
            }
            const val = this.lastValuesByProviderIds[id];
            if (val.useTempData)
                return val.tempData;
            return val.data;
        };
        this.hook = () => {
            return useContext(this.context);
        };
        this.defaultProvider = this.registerNewProvider();
        this.context = React.createContext(this.defaultProvider);
        if (getterType === "hook") {
            this.useSelector = createContextSelectorHook(this.context, (id) => id === this.defaultProvider.id, this.useGettingDefaultValue);
        }
        else {
            this.lastValuesByProviderIds[this.defaultProvider.id] = { data: this.defaultValueGetter() };
            this.useSelector = createContextSelectorHook(this.context, () => false, this.defaultValueGetter);
        }
    }
    setDefaultValueGetter(fn) {
        this.defaultValueGetter = fn;
    }
}
const defaultShallowEquality = (prev, next) => {
    if (prev.length !== next.length)
        return false;
    for (let i = 0; i < prev.length; i++) {
        if (prev[i] !== next[i])
            return false;
    }
    return true;
};
