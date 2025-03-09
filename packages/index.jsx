import { createRoot } from "react-dom/client";
import { useReducer, useState, useLayoutEffect } from "./react/src";
const root = createRoot(document.getElementById('root'));
function getAge(state, action) {
    switch (action.type) {
        case 'add':
            return state + action.value
        default:
            return state;
    }
}
function FunctionComponent() {
    const [num, setNum] = useState(1);
    useLayoutEffect(() => {
        console.log(11)

    })
    return (
        <div onClick={() => setNum(num + 1)}>{num}</div>
    )
}
root.render(<FunctionComponent />);
// console.log("index.jsx", element);