import { createFiberRoot } from "./ReactFiberRoot";
import { createUpdate, enqueueUpdate } from "./ReactFiberClassUpdateQueue";
import { scheduleUpdateOnFiber } from "./ReactFiberWorkLoop";
export function createContainer(containerInfo) {
    return createFiberRoot(containerInfo)
}
// 渲染过程的入口
export function updateContainer(element, container) {
    const current = container.current; // HostRootFiber;  
    const update = createUpdate();
    update.payload = { element };
    // 往里面插更新的东西
    const root = enqueueUpdate(current, update);
    // 调度过程
    scheduleUpdateOnFiber(root)
}