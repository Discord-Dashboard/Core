import { UIConfig } from "./types"
import { BaseFormType } from "./BaseFormType";

export class Category {
    public uiConfig: UIConfig = {}

    constructor(
        public readonly id: string,
        public readonly label: string,
    ) {}

    withUI(config: UIConfig) {
        this.uiConfig = { ...this.uiConfig, ...config }
        return this
    }
}

export interface CategoryWithOptions {
    category: Category
    options: BaseFormType<unknown>[]
    serialize(): {
        id: string
        label: string
        uiConfig: any
        options: any[]
    }
}

export class CategoryWithOptionsImpl implements CategoryWithOptions {
    constructor(
        public category: Category,
        public options: BaseFormType<unknown>[],
    ) {}

    serialize() {
        return {
            id:       this.category.id,
            label:    this.category.label,
            uiConfig: this.category.uiConfig,
            options:  this.options.map(opt => opt.serialize()),
        }
    }
}