import { BaseFormType, FormTypeEnum } from "@discord-dashboard/contracts";
export declare class TextFormType extends BaseFormType<string> {
    serialize(): {
        type: FormTypeEnum;
        key: string;
        label: string;
        required: boolean;
        ui: import("@discord-dashboard/contracts").UIConfig;
    };
}
//# sourceMappingURL=TextFormType.d.ts.map