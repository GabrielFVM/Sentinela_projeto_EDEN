import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";


export default defineConfig({
plugins: [react()],
base: "/Sentinela_projeto_EDEN/",
// server: {
// port: 5173,
// },
});