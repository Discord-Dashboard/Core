export class BaseFormTypeBuilder {
    constructor(key, label, required) {
        this.key = key;
        this.label = label;
        this.required = required;
        this.displayChecks = [];
        this.errorChecks = [];
        this.uiConfig = {};
    }
    addDisplayCheck(fn) {
        this.displayChecks.push(fn);
        return this;
    }
    addErrorCheck(fn) {
        this.errorChecks.push(fn);
        return this;
    }
    setGetter(fn) {
        this.getterFn = fn;
        return this;
    }
    setSetter(fn) {
        this.setterFn = fn;
        return this;
    }
    withDefault(val) {
        this.defaultValue = val;
        return this;
    }
    withUI(config) {
        this.uiConfig = { ...this.uiConfig, ...config };
        return this;
    }
}
