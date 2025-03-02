import { REACT_ELEMENT_TYPE, hasOwnProperty } from "shared/index"; 
const RESERVED_PROPS = {
    key: true,
    ref: true,
    __self: true,
    __source: true
}
/**
 * let elemnt = <div style={{color: 'red'}} key="testKey">test</div>
 * 
 * import { jsx as _jsx } from "react/jsx-runtime";
 * 
 * let element = /*#__PURE__/_jsx("div", {
 *  style: {
 *      color: 'red'
 *  },
 *  children: "test"
 * }, ["testKey"]);
 */

function hasValidKey(config) {
    return config.key !== undefined
}

function hasValidRef(config) {
    return config.ref !== undefined
}

// type 标签名
function ReactElement(type, key, ref, props) {
    return {
        $$typeof: REACT_ELEMENT_TYPE,
        type,
        key,
        ref,
        props
    }
}

export function jsxDEV(type, config, maybeKey) {
    const props = {};
    let key = null;
    let ref = null;

    if (typeof maybeKey !== 'undefined') {
        key = maybeKey;
    }

    // 处理特殊情况
    if (hasValidKey(config)) {
        key = "" + config.value;
    }

    if (hasValidRef(config)) {
        ref = config.ref;
    }

    for (let propName in config) {
        if (hasOwnProperty.call(config, propName) && !RESERVED_PROPS.hasOwnProperty(propName)) {
            props[propName] = config[propName];
        }
    }

    return ReactElement(type, key, ref, props)
}