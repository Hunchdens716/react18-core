export const allNativeEvents = new Set(); //保存的dom事件
export function registerTowPhaseEvent(registrationName, dependencies) {
    registerDirectEvent(registrationName, dependencies);
    registerDirectEvent(registrationName + "Capture", dependencies);
}

export function registerDirectEvent(registrationName, dependencies) {
    for (let i = 0; i < dependencies.length; i++) {
        allNativeEvents.add(dependencies[i]);
    }
}