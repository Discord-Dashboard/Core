import { BaseFormType, FormTypeEnum } from "@discord-dashboard/contracts";
export class TextFormType extends BaseFormType {
    placeholder(text) {
        this._placeholder = text;
        return this;
    }
    minLength(n) {
        this._minLength = n;
        return this;
    }
    maxLength(n) {
        this._maxLength = n;
        return this;
    }
    serialize() {
        return {
            type: FormTypeEnum.Text,
            key: this.key,
            label: this.label,
            required: this.required,
            default: this.defaultValue,
            placeholder: this._placeholder,
            minLength: this._minLength,
            maxLength: this._maxLength,
            ui: this.serializeUI(),
        };
    }
}
