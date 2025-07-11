import { BaseFormTypeBuilder } from "../BaseFormTypeBuilder.js";
import { TextFormType } from "../form-types/TextFormType.js";

export class TextFormTypeBuilder extends BaseFormTypeBuilder<string> {
    build(): TextFormType {
        return new TextFormType(
            this.key,
            this.label,
            this.required,
            this.defaultValue,
            this.getterFn,
            this.setterFn,
            this.displayChecks,
            this.errorChecks,
            this.uiConfig
        );
    }
}