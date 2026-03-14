import * as CSS from "csstype"

type IDirections = 'top' | 'bottom' | 'left' | 'right';

type ValidCSSKeys<K extends keyof CSS.Properties> = CSS.Properties[K] extends string | undefined ? CSS.Properties[K] : never;
type CSSKeysForRecord<K extends keyof CSS.Properties> = Exclude<ValidCSSKeys<K>, undefined>;
type IUtility<K extends keyof CSS.Properties> = {
  shorthand: string;
  type?: 'value';
  values: Partial<Record<CSSKeysForRecord<K>, string>>;
} | {
  shorthand: string;
  type: 'directional' | 'incrementalSize';
}

export interface IConfig {
  prefix?: string;
  responsive?: {
    breakpoints: {
      [key: string]: number;
    },
    divisor: string;
  },
  grid: number;
  directions?: {
    [key: string]: IDirections | IDirections[];
  }
  sizes?: {
    [key: string]: string;
  },
  colors?: {
    addBackgroundColor: boolean;
    addTextColor: boolean;
    addBorderColor: boolean;
    colors: {
      [key: string]: string;
    }
  },
  utilities?: {
    [K in keyof CSS.Properties]?: IUtility<K>;
  }
}