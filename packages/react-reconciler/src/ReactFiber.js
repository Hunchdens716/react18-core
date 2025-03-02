import { HostRoot } from 'react-reconciler/src/ReactWorkTags';
import { NoFlags } from 'react-reconciler/src/ReactFiberFlags';
export function FiberNode(tag, pendingProps, key) {
    this.tag = tag; // 代表fiber节点的类型
    this.key = key;
    this.type = null; // 代表fiber节点对应虚拟DOM的类型

    this.stateNode = null; // 指向真实节点
    this.return = null;
    this.sibiling = null;

    this.pendingProps = pendingProps; // 还未生效的props
    this.memorizedProps = null; // 已经生效的props
    this.memorizedState = null; // 已经生效的state
    this.updateQueue = null; // 更新队列
    this.flags = NoFlags;
    this.subTreeFlags = NoFlags;
    this.alternate = null; // 双缓存用的东西
    this.index = 0; // 第几个子节点 
}   

export function createFiber(tag, pendingProps, key) {
    return new FiberNode(tag, pendingProps, key)
}

export function createHostRootFiber() {
    return createFiber(HostRoot, null, null)
}