import { build } from "esbuild";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
export async function bundleTest(
  entry: string,
  mocks: Record<string, string>,
  define: Record<string, string> = {},
) {
  mkdirSync(".test-build", { recursive: true });
  const outfile = resolve(".test-build", crypto.randomUUID() + ".mjs");
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    define,
    plugins: [
      {
        name: "isolated-sdk",
        setup(b) {
          b.onResolve({ filter: /.*/ }, (args) => {
            const key = Object.keys(mocks).find(
              (k) => args.path === k || args.path.endsWith("/" + k),
            );
            if (key) return { path: key, namespace: "mock" };
          });
          b.onLoad({ filter: /.*/, namespace: "mock" }, (args) => ({
            contents: mocks[args.path],
            loader: "ts",
          }));
        },
      },
    ],
  });
  return import(pathToFileURL(outfile).href);
}
