import * as CSS from "csstype"

type IDirections = 'top' | 'bottom' | 'left' | 'right'

type ValidCSSKeys<K extends keyof CSS.Properties> = CSS.Properties[K] extends string | undefined ? CSS.Properties[K] : never
type CSSKeysForRecord<K extends keyof CSS.Properties> = Exclude<ValidCSSKeys<K>, undefined>
interface IUtility<K extends keyof CSS.Properties> {
  shorthand: string
  values: Partial<Record<CSSKeysForRecord<K>, string>>
}
export interface IConfig {
  prefix?: string,
  responsive?: {
    breakpoints: {
      [key: string]: number
    },
    divisor: string,
  },
  directions?: {
    [key: string]: IDirections | IDirections[]
  }
  sizes?: {
    [key: string]: string
  },
  colors?: {
    [key: string]: string
  },
  utilities?: {
    [K in keyof CSS.Properties]?: IUtility<K>
  }
}