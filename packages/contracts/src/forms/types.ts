import type {Guild, GuildMember} from "discord.js";

export interface FormError {
    message: string;
}

export interface FormContext {
    guild?: Guild
    member?: GuildMember
}

export interface UIConfig {
    order?: number;
    [key: string]: any;
}

export type DisplayCheckFn = (ctx: FormContext) => Promise<boolean>;

export type ErrorCheckFn = (ctx: FormContext) => Promise<FormError | null>;

export type GetterFn<T> = (ctx: FormContext) => Promise<T>;

export type SetterFn<T> = (
    value: T,
    ctx: FormContext
) => Promise<void | FormError>;