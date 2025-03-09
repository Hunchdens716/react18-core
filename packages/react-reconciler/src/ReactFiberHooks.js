import ReactSharedInternals from "shared/ReactSharedInternals";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
import { Passive as PassiveEffect, Update as UpdateEffect } from "./ReactFiberFlags";
import { HasEffect as HookHasEffect, Passive as HookPassive, Layout as HookLayout } from "./ReactHookEffectTags";
import { enqueueConcurrentHookUpdate } from "./ReactFiberConcurrentUpdates";

const { ReactCurrentDispatcher } = ReactSharedInternals;
let currentlyRenderingFiber = null; // 正在处理中的fiber
let workInProgressHook = null; // 正在处理中的hook
let currentHook = null;
const HooksDispatcherOnMount = {
    useReducer: mountReducer,
    useState: mountState,
    useEffect: mountEffect,
    useLayoutEffect: mountLayoutEffect,
}
const HooksDispatcherOnUpdate = {
    useReducer: updateReducer,
    useState: updateState,
    useEffect: updateEffect,
    useLayoutEffect: updateLayoutEffect
}

function mountLayoutEffect(create, deps) {
    return mountEffectImpl(UpdateEffect, HookLayout, create, deps);
}

function updateLayoutEffect() {
    return updateEffectImpl(UpdateEffect, HookLayout, create, deps)
}

function mountEffect(create, deps) {
    return mountEffectImpl(PassiveEffect, HookPassive, create, deps);
}

function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
    const hook = mountWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    currentlyRenderingFiber.flags |= fiberFlags;
    hook.memorizedState = pushEffect(HookHasEffect | hookFlags, create, undefined, nextDeps);

}

function pushEffect(tag, create, destroy, deps) {
    const effect = {
        tag,
        create,
        destroy,
        deps,
        next: null
    }
    let componentUpdateQueue = currentlyRenderingFiber.updateQueue;
    if (componentUpdateQueue === null) {
        // 首次
        componentUpdateQueue = createFunctionComponentUpdateQueue();
        currentlyRenderingFiber.updateQueue = componentUpdateQueue;
        componentUpdateQueue.lastEffect = effect.next = effect;
    } else {
        const lastEffect = componentUpdateQueue.lastEffect;
        if (lastEffect === null) {
            componentUpdateQueue.lastEffect = effect.next = effect;
        } else {
            const firstEffect = lastEffect.next;
            lastEffect.next = effect;
            effect.next = firstEffect;
            componentUpdateQueue.lastEffect = effect;
        }
    }
    return effect;
}

function createFunctionComponentUpdateQueue() {
    return {
        lastEffect: null
    }
}

function updateEffect(create, deps) {
    return updateEffectImpl(PassiveEffect, HookPassive, create, deps);

}

function areHookInputsEqual(nextDeps, prevDeps) {
    if (prevDeps === null) return null;
    for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
        if (Object.is(nextDeps[i], prevDeps[i])) {
            continue;
        }
        return false;
    }
    return true;
}

function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
    const hook = updateWorkInProgressHook();
    const nextDeps = deps === undefined ? null : deps;
    let destroy;
    // 老hook
    if (currentHook !== null) {
        const prevEffect = currentHook.memorizedState;
        destroy = prevEffect.destroy;
        if (nextDeps !== null) {
            const preDeps = prevEffect.deps;
            if (areHookInputsEqual(nextDeps, preDeps)) {
                hook.memorizedState = pushEffect(hookFlags, create, destroy, nextDeps);
                return;
            }
        }
    }
    currentlyRenderingFiber.flags |= fiberFlags;
    hook.memorizedState = pushEffect(hookFlags, create, destroy, nextDeps);
}

function baseStateReducer(state, action) {
    return typeof action === 'function' ? action(state) : action;
}

function mountState(initialState) {
    const hook = mountWorkInProgressHook();
    hook.memorizedState = initialState;
    const queue = {
        pending: null,
        dispatch: null,
        lastRenderedReducer: baseStateReducer,
        lastRenderedState: initialState
    }
    hook.queue = queue;
    const dispatch = (queue.dispatch = dispatchSetStateAction.bind(null, currentlyRenderingFiber, queue));
    return [hook.memorizedState, dispatch];
}

function dispatchSetStateAction(fiber, queue, action) {
    const update = {
        action,
        hasEagerState: false,
        eagerState: null,
        next: null
    }
    const { lastRenderedReducer, lastRenderedState } = queue;
    const eagerState = lastRenderedReducer(lastRenderedState, action);
    update.eagerState = eagerState;
    update.hasEagerState = true;
    // 优化
    if (Object.is(eagerState, lastRenderedState)) {
        return
    }
    const root = enqueueConcurrentHookUpdate(fiber, queue, update);
    scheduleUpdateOnFiber(root);
}

function updateState() {
    return updateReducer(baseStateReducer);
}

function mountReducer(reducer, initialArg) {
    const hook = mountWorkInProgressHook();
    hook.memorizedState = initialArg;
    const queue = {
        pending: null
    }
    hook.queue = queue;
    const dispatch = (queue.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, queue));
    return [hook.memorizedState, dispatch];
}

function mountWorkInProgressHook() {
    const hook = {
        memorizedState: null,
        queue: null,
        next: null,
    }
    if (workInProgressHook === null) {
        currentlyRenderingFiber.memorizedState = workInProgressHook = hook;
    } else {
        workInProgressHook = workInProgressHook.next = hook;
    }
    return workInProgressHook;
}

function updateReducer(reducer) {
    const hook = updateWorkInProgressHook();
    const queue = hook.queue;
    const current = currentHook;
    const pendingQueue = queue.pending;
    let newState = current.memorizedState;

    if (pendingQueue !== null) {
        queue.pending = null
        const firstUpdate = pendingQueue.next;
        let update = firstUpdate;
        do {
            const action = update.action;
            newState = reducer(newState, action);
            update = update.next;
        } while (update !== null && update !== firstUpdate)
    }

    hook.memorizedState = newState;
    return [hook.memorizedState, queue.dispatch];
}

function updateWorkInProgressHook() {
    if (currentHook === null) {
        // 首次渲染
        const current = currentlyRenderingFiber.alternate;
        currentHook = current.memorizedState; // 老hook
    } else {
        currentHook = currentHook.next;
    }
    const newHook = {
        memorizedState: currentHook.memorizedState,
        queue: currentHook.queue,
        next: null
    }

    if (workInProgressHook === null) {
        currentlyRenderingFiber.memorizedState = workInProgressHook = newHook;
    } else {
        workInProgressHook = workInProgressHook.next = newHook;
    }
    return workInProgressHook;
}

function dispatchReducerAction(fiber, queue, action) {
    const update = {
        action,
        next: null
    }
    const root = enqueueConcurrentHookUpdate(fiber, queue, update);
    scheduleUpdateOnFiber(root);
}


export function renderWithHooks(current, workInProgress, Component, props) {
    currentlyRenderingFiber = workInProgress;
    workInProgress.updateQueue = null;
    if (current !== null && current.memorizedState !== null) {
        ReactCurrentDispatcher.current = HooksDispatcherOnUpdate;
    } else {
        ReactCurrentDispatcher.current = HooksDispatcherOnMount;
    }

    const children = Component(props);
    currentlyRenderingFiber = null;
    workInProgressHook = null;
    currentHook = null;
    return children;
}