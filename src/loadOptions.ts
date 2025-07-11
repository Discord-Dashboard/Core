import { readdir, stat } from 'fs/promises'
import { join, resolve } from 'path'
import { createRequire } from 'module'
import { CategoryWithOptionsImpl } from '@discord-dashboard/contracts'
import type { Category, BaseFormType } from '@discord-dashboard/contracts'

const nodeRequire = createRequire(import.meta.url)

let _cache: Promise<CategoryWithOptionsImpl[]> | null = null

async function isDirectory(p: string): Promise<boolean> {
    try {
        return (await stat(p)).isDirectory()
    } catch {
        return false
    }
}

function findIndexFile(dir: string): string {
    const ts = join(dir, 'index.ts')
    if (nodeRequire('fs').existsSync(ts)) return ts

    const js = join(dir, 'index.js')
    if (nodeRequire('fs').existsSync(js)) return js

    throw new Error(`No index.ts or index.js in directory: ${dir}`)
}

async function doLoadAllCategories(): Promise<CategoryWithOptionsImpl[]> {
    const ROOT = resolve(process.cwd(), 'src/options')
    const result: CategoryWithOptionsImpl[] = []

    for (const catName of await readdir(ROOT)) {
        const catPath = join(ROOT, catName)
        if (!(await isDirectory(catPath))) continue

        const catIndex = findIndexFile(catPath)
        const { default: CategoryBuilder } = nodeRequire(catIndex) as { default: Category }

        const optionBuilders: BaseFormType<unknown>[] = []
        for (const optName of await readdir(catPath)) {
            const optPath = join(catPath, optName)
            if (!(await isDirectory(optPath))) continue
            if (optName === 'index.ts' || optName === 'index.js') continue

            const optIndex = findIndexFile(optPath)
            const { default: OptionBuilder } = nodeRequire(optIndex) as { default: BaseFormType<unknown> }
            optionBuilders.push(OptionBuilder)
        }

        result.push(new CategoryWithOptionsImpl(CategoryBuilder, optionBuilders))
    }

    return result
}

export function loadAllCategories(): Promise<CategoryWithOptionsImpl[]> {
    if (!_cache) {
        _cache = doLoadAllCategories()
    }
    return _cache
}