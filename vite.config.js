import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
const resolve = path.resolve;

export default defineConfig({
    resolve: {
        alias: {
            react: resolve("packages/react"),
            "react-dom": resolve("packages/react-dom"),
            "react-dom-bindings": resolve("packages/react-dom-bindings"),
            "react-reconciler": resolve("packages/react-reconciler"),
            "scheduler": resolve("packages/scheduler"),
            shared: resolve("packages/shared"),
        }
    },
    plugins: [react()],
    optimizeDeps: {
        force: true
    },
    server: {
        port: 8000
    }
})