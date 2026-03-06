import {DisplayAttributes} from './displayTypes'

type IDirections = 'top' | 'bottom' | 'left' | 'right'

interface IUtility<T extends string> {
  property: string
  values: Partial<Record<T, string>>
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
    display?: IUtility<DisplayAttributes>,
    position?: IUtility<DisplayAttributes>
  }
}