export const depsShallowEquality = (oldDeps, newDeps) => {
    if (!Array.isArray(oldDeps) || !Array.isArray(newDeps)) {
        return oldDeps === newDeps;
    }
    if (oldDeps.length !== newDeps.length)
        return false;
    for (let i = 0; i < oldDeps.length; ++i) {
        if (oldDeps[i] !== newDeps[i])
            return false;
    }
    return true;
};
