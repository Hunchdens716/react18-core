import { createRoot } from "react-dom/client";
const root = createRoot(document.getElementById('root'));
// let element = (
//     <div>
//         <div>学习</div>
//         <div>知识</div>
//     </div>

// )
function FunctionComponent() {
    return (
        <div>
            <div>学习</div>
        </div>
    )
}
root.render(<FunctionComponent />);
// console.log("index.jsx", element);