import { createHostRootFiber } from "./ReactFiber";
import { initialUpdateQueue } from "./ReactFiberClassUpdateQueue";

function FiberRootNode(containerInfo) {
    // 整个应用的根
    this.containerInfo = containerInfo
}


export function createFiberRoot(containerInfo) {
    // 整个应用的起点
    const root = new FiberRootNode(containerInfo);
    // 整个fiber树的起点
    const uninitailizedFiber = createHostRootFiber();
    // fiberRootNode -> hostRootFiber
    root.current = uninitailizedFiber;
    uninitailizedFiber.stateNode = root; // stateNode指向的是真实节点
    initialUpdateQueue(uninitailizedFiber)
    return root
}