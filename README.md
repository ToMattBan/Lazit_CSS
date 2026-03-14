# Lazit CSS

**Lazit CSS** is a small utility-CSS generator.
It's meant to be your custom hammer for daily use.
You have the power to decide which utilities you will have, be it just some or all possible.
It builds a **minified utility stylesheet** based on a simple configuration file.

You can:

* Use the **default prebuilt CSS**, which some minimum utilities work-ready
* Or generate a **custom stylesheet** with your own utilities, colors, sizes, and everything else.

---

# Installation

As simple as a single command:

```bash
npm install lazit-css
```

or

```bash
pnpm add lazit-css
```

---

# Creating a Custom Config

To generate your own utilities, create a config file in the root of your project:

Supported config files are:
```
lazit.config.ts
lazit.config.js
lazit.config.mjs
lazit.config.cjs
```

Fill it with your own configs.
It's strongly recommended to use typescript, as we ship the generator with types to help you config your css.

Example of config file:
```ts
import { createConfig } from "lazit-css";

createConfig({
  colors: {
    primary: "#7A0EA8",
    secondary: "#1E293B"
  }
});
```

Then generate your new css with
```
npm run lazit
```

or 

```
pnpm exec lazit
```

---

# Using the CSS

In the entrypoint of your project, import it like that:

```js
import "lazit-css/style.css";
```

Or if you are using something like Nuxt, you can also add to nuxt.config.ts
```ts
export default defineNuxtConfig({
  css: ['lazit-css/style.css']
})
```

Or include it in HTML:

```html
<link rel="stylesheet" href="node_modules/lazit-css/public/style.min.css">
```

---

# Configuration Guide:

## Prefix

Prefix is exactly what the name implies, a prefix that will be followed by the rest of class compositionExample:

```ts
createConfig({
  prefix: '_'
  utilities: {
    display: {
      shorthand: "d",
      values: {
        flex: "f",
      }
    }
  }
});
```

Generated CSS:

```css
._df { display: flex }
```

## Utilities

Utilities are generated from CSS properties, with the following logic:
shorthand + value { property_name: key }

Example:

```ts
createConfig({
  prefix: '_'
  utilities: {
    display: {
      shorthand: "d",
      values: {
        flex: "f",
        block: "b",
        none: "n"
      }
    }
  }
});
```

Generated CSS:

```css
._df { display: flex }
._db { display: block }
._dn { display: none }
```

There are 4 types of utilities:
- Value
- Color
- Size
- Directional

The first one, value, is the default. It expects its values in keys, like the example above with display.
If type is ommited, Lazit will understand that you want a "value" type of util.
More on the other types in the next sections

---

## Colors

You can configure your colors to be used with utilities.
The colors configured here will also be put in :root, so you can use them in your own css.

```ts
createConfig({
  colors: {
    primary: "#7A0EA8",
    secondary: "#1E293B"
  }
});
```

Generated CSS:
```css
:root {
  --primary: #7A0EA8;
  --secondary: #1E293B;
}
```

This is REQUIRED if you use a utility with type color, for example:
```ts
createConfig({
  prefix: '_'
  utilities: {
    color: {
      shorthand: 'txc',
      type: 'color' // --> Note the type color here!!
    },
  }
});
```

Generated CSS:

```css
:root {
  --primary: #7A0EA8;
  --secondary: #1E293B;
}

._txcprimary {
  color: #7A0EA8
}
._txcsecondary {
  color: #1E293B
}
```

---

## Sizes

Sizes are values used with utilities that handles numeric values, like font-size.
This alone, won't do anything. You need to also define a utility that uses type size
In the same hand, this is REQUIRED if you use a utility with type size.

Example:

```ts
createConfig({
  prefix: '_',
  sizes: {
    "sm": "24px",
    "": "32px",
    "lg": "48px",
  },
  utilities: {
    fontSize: {
      shorthand: 'fz',
      type: 'size' // --> Note the type size here!!
    },
  }
})
```

Generated CSS:

```css
._fzsm { font-size: '24px' }
._fz { font-size: '32px' }
._fzlg { font-size: '48px' }
```

---

## Directions

Directions are used with utilities that needs to point to somowhere.
Even if you define your directions, nothing will happens if you don't define a utility with type direction.
In the same hand, this is REQUIRED if you use a utility with type direction.

You will also need to define sizes for directions to work, as every CSS property that haves a direction also have a value

Example:

```ts
createConfig({
  prefix: '_',
  directions: {
    't': 'top',
    'b': 'bottom'
  },
  sizes: {
    sm: '24px',
  },
  utilities: {
    padding: {
      shorthand: 'p',
      type: 'directional' // --> Note the type directional here!!
    },
  }
})
```

Generated CSS:

```css
._psm { padding: 24px }
._ptsm { padding-top: 24px }
._pbsm { padding-bottom: 24px }
```

---

## Grid

You can generate simple fractional grid widths:

```ts
createConfig({
  prefix: '_'
  grid: {
    divisor: "/",
    total: 12
  }
});
```

Generated CSS:

```
._1/12 { width: 8.33333% }
._2/12 { width: 16.6667% }
...
._12/12 { width: 100% }
```

---

## Responsive

Lazit believes in a mobile-first approach. But also that mobile isn't everything that exists in the web. So there is a option to create your own breakpoints that all classes will follow.

It generates believing that mobile is the default breakpoint, and anything else comes after. So, if you use a class with breakpoint, it will replace the mobile one. And thus on, so a bigger breakpoint always replaces the smaller one.

Example:

```ts
createConfig({
  prefix: '_',
  responsive: {
    breakpoints: {
      'desktop': 1200,
    },
    divisor: '@'
  },
  utilities: {
    display: {
      shorthand: "d",
      values: {
        flex: "f",
      }
    }
  }
});
```

Generated CSS:

```css
._df { display: flex }
@media (min-width: 1200px) {
  ._df\@desktop { display: flex }
}
```

Where the @desktop one would have a highwer priority than the mobile one.
So, we could use it like

```html
<h1 class="_dn _db@desktop">Lazit CSS</h1>
```

This way the title would just be shown for screens bigger than 1200px, and before that display none would be the rule with more priority

---