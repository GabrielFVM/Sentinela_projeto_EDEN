import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";


export default defineConfig({
plugins: [react()],
base: "/Sentinela_projeto_EDEN/",
server: {
  host: '0.0.0.0',  // Aceita conexões de qualquer IP (necessário para Tailscale)
  port: 5173,
},
});