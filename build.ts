import { IConfig } from "./types/interfaces";

const defaultConfigs: IConfig = {
  prefix: '_',
  responsive: {
    breakpoints: {
      'mobile': 600,
      'tablet': 900,
      'desktop': 1200
    },
    divisor: '@'
  },
  directions: {
    't': 'top',
    'b': 'bottom',
    'y': ['top', 'bottom'],
    'l': 'left',
    'r': 'right',
    'x': ['left', 'right'],
  },
  sizes: {
    '8': '2rem',
    '16': '4rem',
  },
  colors: {
    black: '#000000',
    white: '#FFFFFF'
  },
  utilities: {
    display: {
      property: 'd',
      values: {
        flex: 'f',
        block: 'b',
        none: 'n'
      }
    },
  },
}

function createConfig(userConfigs: IConfig) {
  const allConfigs = {
    ...defaultConfigs,
    ...userConfigs,
  }

  console.log("🚀 ~ createConfig ~ allConfigs:", allConfigs)
}

export default createConfig