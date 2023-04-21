# userscript-bundler

Node.js tools to build userscripts and bookmarklets from ES modules.

## Features

- Bundle multiple JavaScript modules into a single userscript (or bookmarklet) using [rollup](https://www.rollupjs.org/)
- Generate userscript metadata blocks automatically with default values
- Minify bookmarklets using [terser](https://terser.org/)
- Generate a README file with descriptions, userscript install buttons and bookmarklet code blocks

The default build function provides all these features, but you can also write your own based on the provided tools.

## Usage

1. Install the package:

	```sh
	npm install --save-dev kellnerd/userscript-bundler
	```

	You can also install a specific version with `npm install --save-dev kellnerd/userscript-bundler#v0.8.1` (where the part after the hash can be any tag or commit).

2. Create a build script and save it, e.g. as `build.js`:

	```js
	import { build } from '@kellnerd/userscript-bundler';

	build({
		// default values below, you can leave out options unless you want to change them
		userscriptSourcePath: 'src/userscripts/',
		bookmarkletSourcePath: null,
		// bookmarklets are optional and have to be enabled:
		// bookmarkletSourcePath: './src/bookmarklets/',
		docSourcePath: 'doc/',
		outputPath: 'dist/',
		readmePath: 'README.md',
	});
	```

3. Move the introduction of your previous README file into `doc/_header.md` or create this file.

	The build script in this example will automatically generate your README file and use `doc/_header.md` as the document header.
	All other Markdown files in the specified doc folder will be appended to the end of the final README.

4. Create a new module which serves as entry point of your userscript in your userscript source folder, e.g. `example.user.js`:

	```js
	console.log('Hello world!');
	```

5. Specify the userscript's metadata in an accompanying `example.meta.js` file:

	```js
	/** @type {import('@kellnerd/userscript-bundler').EnhancedUserscriptMetadata} */
	const metadata = {
		name: 'Example',
		author: 'John Doe', // optional, falls back to your GitHub username
		description: 'Enhances the functionality of example.com.',
		match: '*://example.com/*',
	};

	export default metadata;
	```

6. *(Optional)* Create a new module which serves as entry point of your bookmarklet in your bookmarklet source folder, e.g. `exampleBookmarklet.js`:

	```js
	/** 
	 * The first block comment in this file will be used as description of the bookmarklet.
	 * The name of the bookmarklet will be the title-cased version of the camel-cased filename,
	 * i.e. "Example Bookmarklet" for this example.
	 */
	
	console.log('Hello world!');
	```

7. Ensure that your `package.json` file contains the URL of your GitHub repository, it is needed to automatically generate update URLs for your userscripts.

	```jsonc
	{
		// ...
		"repository": {
			"type": "git",
			"url": "https://github.com/<username>/<repository>.git"
		},
		"type": "module",
		"devDependencies": {
			"@kellnerd/userscript-bundler": "github:kellnerd/userscript-bundler",
			// ...
		}
	}
	```

8. Now you can execute your build script: `node build.js`

	It will create bundled versions of all your userscripts in the `outputPath` folder and add a section to the README for each script.

	In case you have created an identically named bookmarklet, it will be included in the same section, all other bookmarklets have separate sections after the userscript sections.

If you want to compile a single minified bookmarklet from a module or a standalone JavaScript file you can alternatively run `node bookmarkletify.js exampleBookmarklet.js`.
The result will be output directly on screen and no files will be modified.

## Showcases

If you are using this package to build your own userscripts or bookmarklets, you can create a pull request to be included in the following list.

- https://github.com/kellnerd/musicbrainz-scripts
