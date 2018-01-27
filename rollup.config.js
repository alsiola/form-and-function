import pkg from "./package.json";
import typescript from "rollup-plugin-typescript";
import ts from "typescript";
import uglify from "rollup-plugin-uglify";

export default [
    {
        input: "./dist/modules/index.js",
        external: ["react"],
        output: [
            { file: pkg.main, format: "cjs" },
            { file: pkg.module, format: "es" },
            {
                name: "form-and-function",
                file: pkg.browser,
                format: "umd",
                globals: {
                    react: "React"
                }
            }
        ],
        plugins: [
            typescript({
                typescript: ts
            }),
            uglify()
        ]
    }
];
