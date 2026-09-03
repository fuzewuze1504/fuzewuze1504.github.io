import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";

const repositoryName = (process.env.GITHUB_REPOSITORY ?? "").split("/")[1] ?? "";
const prefix = repositoryName.endsWith(".github.io") ? "" : `/${repositoryName}`;
const root = "dist/client";
const textExtensions = new Set([".html", ".rsc", ".js", ".css"]);

async function updateDirectory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await updateDirectory(path);
    } else if (textExtensions.has(extname(entry.name))) {
      const original = await readFile(path, "utf8");
      const updated = original
        .replaceAll('"/assets/', `"${prefix}/assets/`)
        .replaceAll('\\\"/assets/', `\\\"${prefix}/assets/`)
        .replaceAll('"/favicon.svg', `"${prefix}/favicon.svg`)
        .replaceAll('\\\"/favicon.svg', `\\\"${prefix}/favicon.svg`);
      if (updated !== original) await writeFile(path, updated);
    }
  }
}

if (prefix) await updateDirectory(root);
