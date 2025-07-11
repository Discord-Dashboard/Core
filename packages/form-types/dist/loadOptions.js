import { readdir, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { createRequire } from 'module';
import { CategoryWithOptionsImpl } from '@discord-dashboard/contracts';
const nodeRequire = createRequire(import.meta.url);
let _cache = null;
async function isDirectory(p) {
    try {
        return (await stat(p)).isDirectory();
    }
    catch {
        return false;
    }
}
function findIndexFile(dir) {
    const ts = join(dir, 'index.ts');
    // zamiast require('fs') używamy nodeRequire, bundler tego nie podczepi
    if (nodeRequire('fs').existsSync(ts))
        return ts;
    const js = join(dir, 'index.js');
    if (nodeRequire('fs').existsSync(js))
        return js;
    throw new Error(`No index.ts or index.js in directory: ${dir}`);
}
async function doLoadAllCategories() {
    const ROOT = resolve(process.cwd(), 'src/options');
    const result = [];
    for (const catName of await readdir(ROOT)) {
        const catPath = join(ROOT, catName);
        if (!(await isDirectory(catPath)))
            continue;
        // 1) dynamiczny import buildera kategorii
        const catIndex = findIndexFile(catPath);
        const { default: CategoryBuilder } = nodeRequire(catIndex);
        // 2) dynamiczny import wszystkich opcji
        const optionBuilders = [];
        for (const optName of await readdir(catPath)) {
            const optPath = join(catPath, optName);
            if (!(await isDirectory(optPath)))
                continue;
            if (optName === 'index.ts' || optName === 'index.js')
                continue;
            const optIndex = findIndexFile(optPath);
            const { default: OptionBuilder } = nodeRequire(optIndex);
            optionBuilders.push(OptionBuilder);
        }
        result.push(new CategoryWithOptionsImpl(CategoryBuilder, optionBuilders));
    }
    return result;
}
export function loadAllCategories() {
    if (!_cache) {
        _cache = doLoadAllCategories();
    }
    return _cache;
}
