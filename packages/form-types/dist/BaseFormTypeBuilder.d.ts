import { DisplayCheckFn, ErrorCheckFn, GetterFn, SetterFn, UIConfig, BaseFormType } from "@discord-dashboard/contracts";
export declare abstract class BaseFormTypeBuilder<T> {
    readonly key: string;
    readonly label: string;
    readonly required: boolean;
    protected displayChecks: DisplayCheckFn[];
    protected errorChecks: ErrorCheckFn[];
    protected getterFn?: GetterFn<T>;
    protected setterFn?: SetterFn<T>;
    protected defaultValue?: T;
    protected uiConfig: UIConfig;
    constructor(key: string, label: string, required: boolean);
    addDisplayCheck(fn: DisplayCheckFn): this;
    addErrorCheck(fn: ErrorCheckFn): this;
    setGetter(fn: GetterFn<T>): this;
    setSetter(fn: SetterFn<T>): this;
    withDefault(val: T): this;
    withUI(config: UIConfig): this;
    abstract build(): BaseFormType<T>;
}
//# sourceMappingURL=BaseFormTypeBuilder.d.ts.map