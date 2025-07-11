import {
    DisplayCheckFn,
    ErrorCheckFn,
    FormContext,
    FormError,
    GetterFn,
    SetterFn,
    UIConfig,
    BaseFormType
} from "@discord-dashboard/contracts";

export abstract class BaseFormTypeBuilder<T> {
    protected displayChecks: DisplayCheckFn[] = [];
    protected errorChecks: ErrorCheckFn[] = [];
    protected getterFn?: GetterFn<T>;
    protected setterFn?: SetterFn<T>;
    protected defaultValue?: T;
    protected uiConfig: UIConfig = {};

    constructor(
        public readonly key: string,
        public readonly label: string,
        public readonly required: boolean
    ) {}

    public addDisplayCheck(fn: DisplayCheckFn): this {
        this.displayChecks.push(fn);
        return this;
    }

    public addErrorCheck(fn: ErrorCheckFn): this {
        this.errorChecks.push(fn);
        return this;
    }

    public setGetter(fn: GetterFn<T>): this {
        this.getterFn = fn;
        return this;
    }

    public setSetter(fn: SetterFn<T>): this {
        this.setterFn = fn;
        return this;
    }

    public withDefault(val: T): this {
        this.defaultValue = val;
        return this;
    }

    public withUI(config: UIConfig): this {
        this.uiConfig = { ...this.uiConfig, ...config };
        return this;
    }

    public abstract build(): BaseFormType<T>;
}