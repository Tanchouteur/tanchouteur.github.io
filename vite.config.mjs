import { defineConfig } from "vite";
import { readFileSync, cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const pages = ["index", "project", "skills", "me", "hardware", "contact"];
export default defineConfig({
  publicDir: false,
  plugins: [
    {
      name: "atelier-html-and-static-assets",
      transformIndexHtml(html) {
        return html.replace(/<!-- partial:(nav|footer) -->/g, (_, name) =>
          readFileSync(`assets/html/${name}.html`, "utf8"),
        );
      },
      closeBundle() {
        mkdirSync("dist/assets", { recursive: true });
        for (const name of ["data", "images", "CV"])
          cpSync(`assets/${name}`, `dist/assets/${name}`, {
            recursive: true,
            filter: (path) => !path.endsWith(".DS_Store"),
          });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        pages.map((page) => [page, resolve(`${page}.html`)]),
      ),
    },
  },
});
