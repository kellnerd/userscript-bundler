# userscript-bundler

Tools to build userscripts and bookmarklets from ES modules.

## Features

- Bundle multiple JavaScript modules into a single userscript (or bookmarklet) using [rollup](https://www.rollupjs.org/)
- Generate userscript metadata blocks automatically with default values
- Minify bookmarklets using [terser](https://terser.org/)
- Generate a README file with descriptions, userscript install buttons and bookmarklet code blocks

The default build script provides all these features, but you can also write your own based on the provided tools.

## Showcases

- https://github.com/kellnerd/musicbrainz-scripts
