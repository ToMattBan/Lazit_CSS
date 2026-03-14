import build from "./build.js";
const defaultConfigs = {
    prefix: '_',
    responsive: {
        breakpoints: {
            'tabletV': 600,
            'tabletH': 900,
            'desktop': 1200,
        },
        divisor: '@'
    },
    grid: {
        divisor: '/',
        total: 12,
    },
    sizes: {
        "a": "auto",
        "xxxs": "4px",
        "xxs": "8px",
        "xs": "16px",
        "sm": "24px",
        "": "32px",
        "lg": "48px",
        "xl": "64px",
        "xxl": "128px",
    },
    directions: {
        't': 'top',
        'b': 'bottom',
        'v': ['top', 'bottom'],
        'l': 'left',
        'r': 'right',
        'h': ['left', 'right'],
    },
    colors: {
        black: '#000000',
        white: '#FFFFFF',
        red: '#FF0000',
        green: '#008000',
        blue: '#0000FF',
        yellow: '#FFFF00',
        orange: '#FFA500'
    },
    utilities: {
        color: {
            shorthand: '',
            type: 'color'
        },
        backgroundColor: {
            shorthand: 'bg',
            type: 'color'
        },
        borderColor: {
            shorthand: 'bdc',
            type: 'color'
        },
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
            type: 'size'
        },
        bottom: {
            shorthand: 'b',
            type: 'size'
        },
        left: {
            shorthand: 'l',
            type: 'size'
        },
        right: {
            shorthand: 'r',
            type: 'size'
        },
        fontSize: {
            shorthand: 'fs',
            type: 'size'
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
};
function createConfig(userConfigs) {
    const allConfigs = {
        ...defaultConfigs,
        ...userConfigs,
    };
    build(allConfigs);
}
export default createConfig;
