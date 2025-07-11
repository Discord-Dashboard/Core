import {BaseFormType, FormTypeEnum} from "@discord-dashboard/contracts";

export class TextFormType extends BaseFormType<string> {
    serialize() {
        return {
            type: FormTypeEnum.Text,
            key: this.key,
            label: this.label,
            required: this.required,
            ui: this.serializeUI(),
        };
    }
}