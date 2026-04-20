import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@/ui": path.resolve(__dirname, "src/components/ui"),
      "@/containers": path.resolve(__dirname, "src/components/containers"),
      "@/pages": path.resolve(__dirname, "src/components/pages"),
      "@/components": path.resolve(__dirname, "src/components"),
      "@/hooks": path.resolve(__dirname, "src/lib/hooks"),
      "@/utils": path.resolve(__dirname, "src/lib/utils"),
      "@/data": path.resolve(__dirname, "src/lib/data"),
      "@/stores": path.resolve(__dirname, "src/lib/stores"),
      "@/types": path.resolve(__dirname, "src/lib/types"),
      "@/lib": path.resolve(__dirname, "src/lib"),
    },
  },
});
