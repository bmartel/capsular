import ts from "typescript";
import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import json from "@rollup/plugin-json";
import { terser } from "rollup-plugin-terser";
import pkg from "./package.json";

const build = (output = {}) => ({
  input: "src/index.ts",
  output,
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs({
      include: /node_modules/,
    }),
    typescript({
      typescript: ts,
    }),
    terser({
      output: {
        comments: false,
      },
    }),
  ],
});

const scripts = {
  input: "scripts/index.js",
  output: {
    file: pkg.bin,
    format: "cjs",
  },
  plugins: [
    resolve({
      browser: true,
      node: true,
    }),
    commonjs({
      include: /node_modules/,
    }),
    json(),
    babel({ babelHelpers: "bundled" }),
    terser({
      output: {
        comments: false,
      },
    }),
  ],
};

export default [
  scripts,
  build({
    format: "umd",
    name: "capsular",
    file: pkg.browser,
  }),
  build({
    format: "cjs",
    file: pkg.main,
  }),
  build({
    format: "es",
    file: pkg.module,
  }),
];
