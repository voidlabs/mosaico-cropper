import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import less from 'less';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

const filename = resolve('src/css/core.less');
const rendered = await less.render(await readFile(filename, 'utf8'), { filename });
const result = await postcss([autoprefixer(), cssnano()]).process(rendered.css, { from: filename, to: 'dist/mosaico-cropper.core.css' });
await writeFile('dist/mosaico-cropper.core.css', result.css);
