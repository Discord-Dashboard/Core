import { BaseFormTypeBuilder } from "../BaseFormTypeBuilder.js";
import { TextFormType } from "../form-types/TextFormType.js";
export class TextFormTypeBuilder extends BaseFormTypeBuilder {
    build() {
        return new TextFormType(this.key, this.label, this.required, this.defaultValue, this.getterFn, this.setterFn, this.displayChecks, this.errorChecks, this.uiConfig);
    }
}
