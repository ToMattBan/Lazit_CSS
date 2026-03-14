import { IConfig } from "../types/interfaces.js";
import build from "./build.js";

const defaultConfigs: IConfig = {
  prefix: '_',
  responsive: {
    breakpoints: {
      'mobile': 600,
      'tabletV': 900,
      'tabletH': 1200,
      'desktop': 1600,
    },
    divisor: '@'
  },
  grid: 12,
  directions: {
    't': 'top',
    'b': 'bottom',
    'y': ['top', 'bottom'],
    'l': 'left',
    'r': 'right',
    'x': ['left', 'right'],
  },
  sizes: {
    "xxxs": "4px",
    "xxs": "8px",
    "xs": "16px",
    "sm": "24px",
    "": "32px",
    "lg": "48px",
    "xl": "64px",
    "xxl": "128px",
  },
  colors: {
    addBackgroundColor: true,
    addTextColor: true,
    addBorderColor: true,
    colors: {
      black: '#000000',
      white: '#FFFFFF',
      red: '#FF0000',
      green: '#008000',
      blue: '#0000FF',
      yellow: '#FFFF00',
      orange: '#FFA500'
    }
  },
  utilities: {
    padding: {
      shorthand: 'p',
      type: 'directional'
    },
    margin: {
      shorthand: 'm',
      type: 'directional'
    },
    top: {
      shorthand: 't',
      type: 'directional'
    },
    bottom: {
      shorthand: 'b',
      type: 'directional'
    },
    left: {
      shorthand: 'l',
      type: 'directional'
    },
    right: {
      shorthand: 'r',
      type: 'directional'
    },
    fontSize: {
      shorthand: 'fs',
      type: 'incrementalSize'
    },
    fontWeight: {
      shorthand: 'fw',
      values: {
        100: 1,
        200: 2,
        300: 3,
        400: 4,
        500: 5,
        600: 6,
        700: 7,
        800: 8,
        900: 9,
      }
    },
    zIndex: {
      shorthand: 'z',
      values: {
        0: 0,
        1: 1,
        2: 2,
        3: 3,
        10: 10,
        20: 20,
        100: 100
      }
    },
    textAlign: {
      shorthand: 'ta',
      values: {
        center: 'c',
        right: 'r',
        left: 'l',
      }
    },
    textTransform: {
      shorthand: 'tt',
      values: {
        capitalize: 'c',
        lowercase: 'lc',
        uppercase: 'up',
      }
    },
    display: {
      shorthand: 'd',
      values: {
        flex: 'f',
        block: 'b',
        none: 'n',
        grid: 'g',
      }
    },
    position: {
      shorthand: 'po',
      values: {
        absolute: 'a',
        fixed: 'f',
        sticky: 's',
        relative: 'r'
      }
    },
    cursor: {
      shorthand: 'c',
      values: {
        pointer: 'p',
        default: 'd'
      }
    },
    flexDirection: {
      shorthand: 'fd',
      values: {
        column: 'c',
        "column-reverse": 'cr',
        row: 'r',
        "row-reverse": 'rr'
      }
    },
    alignItems: {
      shorthand: 'ai',
      values: {
        start: 's',
        center: 'c',
        end: 'e'
      }
    },
    justifyContent: {
      shorthand: 'jc',
      values: {
        start: 's',
        center: 'c',
        end: 'e',
        "space-around": 'sa',
        "space-between": 'sb',
        "space-evenly": 'se'
      }
    },
    whiteSpace: {
      shorthand: 'ws',
      values: {
        nowrap: 'nw'
      }
    },
  },
}

function createConfig(userConfigs?: IConfig) {
  const allConfigs = {
    ...defaultConfigs,
    ...userConfigs,
  }

  build(allConfigs);
}

export default createConfig