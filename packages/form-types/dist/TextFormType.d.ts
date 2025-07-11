import { BaseFormType, UIConfig, FormTypeEnum } from "@discord-dashboard/contracts";
export declare class TextFormType extends BaseFormType<string> {
    private _placeholder?;
    private _minLength?;
    private _maxLength?;
    placeholder(text: string): this;
    minLength(n: number): this;
    maxLength(n: number): this;
    serialize(): {
        type: FormTypeEnum;
        key: string;
        label: string;
        required: boolean;
        default: string | undefined;
        placeholder: string | undefined;
        minLength: number | undefined;
        maxLength: number | undefined;
        ui: UIConfig;
    };
}
//# sourceMappingURL=TextFormType.d.ts.map