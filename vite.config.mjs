import { defineConfig } from "vite";
import { readFileSync, cpSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const pages = ["index", "project", "skills", "me", "hardware", "contact"];
export default defineConfig({
  publicDir: false,
  plugins: [
    {
      name: "atelier-html-and-static-assets",
      transformIndexHtml(html, context) {
        const english = context.path.startsWith("/en/");
        let result = html.replace(/<!-- partial:(nav|footer) -->/g, (_, name) =>
          readFileSync(`assets/html/${name}${english ? ".en" : ""}.html`, "utf8"),
        );
        if (!english) {
          const redirect = `<script>try{const saved=localStorage.getItem("portfolio-language");const preferred=saved==="fr"||saved==="en"?saved:(/^en(?:-|$)/i.test(navigator.language)?"en":"fr");if(preferred==="en")location.replace("/en/"+(location.pathname.split("/").pop()||"index.html")+location.search+location.hash)}catch{if(/^en(?:-|$)/i.test(navigator.language))location.replace("/en/"+(location.pathname.split("/").pop()||"index.html")+location.search+location.hash)}</script>`;
          result = result.replace("</head>", `${redirect}</head>`);
          const page = context.path.split("/").pop() || "index.html";
          result = result.replace("</head>", `<link rel="alternate" hreflang="fr" href="https://tanchou.fr/${page}"><link rel="alternate" hreflang="en" href="https://tanchou.fr/en/${page}"></head>`);
        }
        return result;
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
        pages.flatMap((page) => [[page, resolve(`${page}.html`)], [`en-${page}`, resolve(`en/${page}.html`)]]),
      ),
    },
  },
});
