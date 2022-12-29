// Configuration, used by `rollup -c` during `npm run build`.

import { readFileSync } from 'fs';
import typescript from 'rollup-plugin-typescript2';

const pkg = JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8')
);

export default {
    input: 'src/index.ts',
    output: [
      {
        format: 'cjs',
        file: pkg.main,
        exports: 'named',
        sourcemap: true
      },
      {
        format: 'es',
        file: pkg.module,
        plugins: [
          emitModulePackageFile()
        ],
        sourcemap: true
      },
    ],
    plugins: [
      typescript({ sourceMap: true }),
    ],
};

function emitModulePackageFile() {
    return {
        name: 'emit-module-package-file',
        generateBundle() {
            this.emitFile({
                type: 'asset',
                fileName: 'package.json',
                source: '{"type":"module"}',
            });
        }
    };
}
