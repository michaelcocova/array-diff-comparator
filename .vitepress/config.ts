import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/array-diff-comparator/",
  srcDir: "docs",
  outDir: ".vitepress/dist",
  title: "Array Diff Comparator",
  description: "面向业务流程的数组对比与冲突决议文档",
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "Introduction", link: "/introduction" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "API", link: "/diff" },
      { text: "Development", link: "/development" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Introduction", link: "/introduction" },
          { text: "Getting Started", link: "/getting-started" },
        ],
      },
      {
        text: "Core API",
        items: [
          { text: "diff", link: "/diff" },
          { text: "apply", link: "/apply" },
          { text: "Chunked Apply", link: "/chunked-apply" },
          { text: "customCompare", link: "/custom-compare" },
        ],
      },
      {
        text: "Project",
        items: [
          { text: "Development", link: "/development" },
          { text: "Release", link: "/release" },
        ],
      },
    ],
    socialLinks: [
      { icon: "github", link: "https://github.com/michaelcocova/array-diff-comparator" },
    ],
    search: {
      provider: "local",
    },
  },
});
