import { createFiberRoot } from "./ReactFiberRoot";
import { createUpdate, enqueueUpdate } from "./ReactFiberClassUpdateQueue";
import { scheduleUpdateOnFiber, requestUpdateLane } from "./ReactFiberWorkLoop";
export function createContainer(containerInfo) {
    return createFiberRoot(containerInfo)
}
// 渲染过程的入口
export function updateContainer(element, container) {
    const current = container.current; // HostRootFiber;  
    const lane = requestUpdateLane(current);
    const update = createUpdate(lane);
    update.payload = { element };
    // 往里面插更新的东西
    const root = enqueueUpdate(current, update, lane);
    // 调度过程
    scheduleUpdateOnFiber(root, current, lane)
}