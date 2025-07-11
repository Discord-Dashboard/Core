import {
    FormContext,
    FormError,
    GetterFn,
    SetterFn,
    DisplayCheckFn,
    ErrorCheckFn,
    UIConfig,
} from "./types";

export abstract class BaseFormType<T> {
    constructor(
        public readonly key: string,
        public readonly label: string,
        public readonly required: boolean,
        protected readonly defaultValue?: T,
        protected readonly getterFn?: GetterFn<T>,
        protected readonly setterFn?: SetterFn<T>,
        protected readonly displayChecks: DisplayCheckFn[] = [],
        protected readonly errorChecks: ErrorCheckFn[] = [],
        protected readonly uiConfig: UIConfig = {}
    ) {}

    async shouldDisplay(ctx: FormContext): Promise<boolean> {
        for (const fn of this.displayChecks) {
            if (!(await fn(ctx))) return false;
        }
        return true;
    }

    async getDisplayErrors(ctx: FormContext): Promise<FormError[] | null> {
        const errors: FormError[] = [];

        for (const fn of this.errorChecks) {
            const err = await fn(ctx);
            if (err) errors.push(err);
        }

        return errors.length > 0 ? errors : null;
    }

    async get(ctx: FormContext): Promise<T> {
        if (!this.getterFn) {
            if (this.defaultValue === undefined) throw new Error(`No getter or default for ${this.key}`);
            return this.defaultValue;
        }
        return await this.getterFn(ctx);
    }

    async set(val: T, ctx: FormContext): Promise<void | FormError> {
        if (!this.setterFn) throw new Error(`No setter defined for ${this.key}`);
        return await this.setterFn(val, ctx);
    }

    async getError(ctx: FormContext): Promise<string | null> {
        for (const fn of this.errorChecks) {
            const err = await fn(ctx);
            if (err) return err as unknown as string;
        }
        return null;
    }

    serializeUI(): UIConfig {
        return this.uiConfig;
    }

    abstract serialize(): Record<string, any>;
}