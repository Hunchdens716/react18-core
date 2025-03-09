import ReactCurrentDispatcher from "./ReactCurrentDispatcher";

function resolveDispatcher() {
    return ReactCurrentDispatcher.current;
}

export function useReducer(reducer, initialAag) {
    const dispatcher = resolveDispatcher();
    return dispatcher.useReducer(reducer, initialAag);
}

export function useState(initialAag) {
    const dispatcher = resolveDispatcher();
    return dispatcher.useState(initialAag);
}

export function useEffect(create, deps) {
    const dispatcher = resolveDispatcher();
    return dispatcher.useEffect(create, deps);
}

export function useLayoutEffect(create, deps) {
    const dispatcher = resolveDispatcher();
    return dispatcher.useLayoutEffect(create, deps);
}