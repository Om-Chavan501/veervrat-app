import type { IFormData as IActionFormData } from '@/interfaces/actionHelper';

export type IFormData = IActionFormData;

export type StrongOmit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type MakeOptional<T, K extends keyof T> = StrongOmit<T, K> & Partial<Pick<T, K>>;

type IsArray<T> = T extends readonly unknown[] ? true : false;

export type DotNestedScalarKeys<T> = T extends object
    ? {
          [K in keyof T & string]: IsArray<T[K]> extends true ? K : T[K] extends object ? K | `${K}.${DotNestedScalarKeys<T[K]>}` : K;
      }[keyof T & string]
    : never;

export type DotNestedBooleanKeys<T> = T extends object
    ? {
          [K in keyof T & string]: T[K] extends boolean ? K : T[K] extends object ? `${K}.${DotNestedBooleanKeys<T[K]>}` : never;
      }[keyof T & string]
    : never;

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export interface IHandleChangeEvent {
    target: {
        name: string;
        value: unknown;
    };
}

export type IHandleChange = (event: IHandleChangeEvent) => void;

