# Comment Swap

## A powerful, simple and flexible [metaprogramming](https://en.wikipedia.org/wiki/Metaprogramming) hack for web developers

---

### __Basic Example__

Comment Swap uses block comments to inject code, markup and values into CSS, HTML and JavaScript. Let’s start with a basic example…

```js
// src/server.js

/* Use port 1234 during development, `node src/server.js`.
 * Use port 80 in production, `node prod/server.js`. */
const PORT = 1234/*= 80 */;

require('node:http').createServer(async (_req, res) => {
  res.writeHead(200, { 'Content-Type':'text/plain' });
  res.end(`Serving http://127.0.0.1:${PORT}/\n`);
}).listen(PORT);
```

Note the `/*= 80 */` on line 5.  
That’s a ‘Literal Before’ Comment Swap, which you can [read about below](#literal-before).

After creating __*src/server.js,*__ run it and test it:

```sh
node src/server.js &
sleep 1
curl http://127.0.0.1:1234/
fg
```

Node ignores the `/*= 80 */` and sets `PORT` to `1234`.  
`curl` outputs the __*src/*__ server’s message: `Serving http://127.0.0.1:1234/`.  
[Control-c](https://en.wikipedia.org/wiki/Control-C) to quit the server.

Now let’s use Comment Swap to make __*src/server.js*__ production-ready.  
Create a simple build-script:

```js
// build.mjs
import fs from 'fs';
import { quickTransformJs } from 'comment-swap';
fs.writeFileSync(
    'prod/server.js',
    quickTransformJs( fs.readFileSync('src/server.js') ),
);
```

Build the production server __*prod/server.js,*__ run it and test it:

```sh
mkdir prod
node build.mjs
node prod/server.js &
sleep 1
curl http://127.0.0.1/
fg
```

This time, `curl` outputs `Serving http://127.0.0.1:80/`.

So what’s happened? Open the freshly made __*prod/server.js.*__  
`quickTransformJs()` has replaced `1234` with `80` and removed the Comment Swap.  
Line 5 is now: `const PORT = 80;`


---

### __Rollup Example__

This example combines [Rollup](https://rollupjs.org/) and Comment Swap to build a minimal and efficient production bundle, __*dist.js.*__

The source code in __*src/*__ will be run directly while the developer is working on it, without any build steps or compilation. This kind of ‘semi-buildless’ development workflow was the original motivation for Comment Swap.

Set up an `npm` project, and install Comment Swap and Rollup:

```sh
mkdir rollup-example
cd $_
npm init --yes
sed -i.bu 's/^{/{\n  "type": "module",/' package.json
rm package.json.bu
npm install comment-swap rollup --save-dev
```

Create two helper functions in __*src/helpers.js.*__  
There are two [Literal After](#literal-after) Comment Swaps here:
- `/*hugeSlowHelper=*/` on line 2 hides `helper()` from production.  
    It takes two arguments, and is only useful during development.  
    Imagine that it runs slowly, and needs hundreds of lines of code.
- `/*helper=*/` on line 5 renames `smallFastHelper()` in production.  
    It takes one argument, and has been designed for production.  
    Imagine that it runs fast, and needs just a few lines of code.

```js
// src/helpers.js -- Rollup will tree-shake this file.
export function /*hugeSlowHelper=*/helper(num, msg) {
    console.log('Imagine a huge, slow helper here:', num, msg)
}
export function /*helper=*/smallFastHelper(num) {
    console.log('A small, fast helper:', num)
}
```


Create __*src/main.js,*__ the app entry-point.  

```js
// src/main.js -- the app entry-point.
import { helper } from './helpers.js';
helper(99, 'verbose'/*=*/);
```

`/*=*/` on line 3 is an [Empty Literal Before.](#empty-literal-before)  
It will remove the string `'verbose'` in the production build.

After creating __*src/helpers.js*__ and __*src/main.js,*__ run and test them:

```sh
node src/main.js
```

Node ignores both Comment Swaps, so it outputs:  
`Imagine a huge, slow helper here: 99 verbose`

It’s worth remembering that `import { helper } from './helpers.js'` means that Node must load and parse both functions in __*src/helpers.js.*__ That’s not really a problem for a developer working on their local machine, but we wouldn’t want to be so wasteful in the production build. Luckily Rollup’s ‘tree shaking’ feature can help.

So let’s combine Rollup and Comment Swap to build a minimal and efficient production bundle.  
Create a simple Rollup configuration file, in __*rollup.config.js:*__

```js
// rollup.config.js -- Rollup configuration.
import { quickTransformJs } from 'comment-swap';
export default {
    input: 'src/main.js',
    output: {
        file: 'dist/index.js',
        format: 'es',
    },
    plugins: [{
        name: 'commentSwapQuickTransformJs',
        transform: source => quickTransformJs(
            source,
            { returnsNull:true }
        ),
    }],
};
```

```sh
npx rollup -c
node dist
```

Node outputs:  
`A small, fast helper: 99`

So what has happened here?  
During Rollup’s build process, __*src/helpers.js*__ is transformed into:

```js
export function hugeSlowHelper(num, msg) {
    console.log('Imagine a huge, slow helper here:', num, msg)
}
export function helper(num) {
    console.log('A small, fast helper:', num)
}
```

Open __*dist/index.js.*__  
Rollup did not add `hugeSlowHelper()` to the bundle — tree shaking in action:

```js
function helper(num) {
    console.log('A small, fast helper:', num);
}
helper(99, );
```


---

### __Front-End Example__

Comment Swap can inject selectors, properties and values into CSS, and it can also inject markup into HTML files. We’ll see this in action in this example, where CSS, HTML and JavaScript files all use Comment Swaps.

```css
/* src/style.css */

/* Show the ‘debug-panel’ by default during development.
 * Hide it by default in the production build. */
#debug-panel {
    display: /* none =*/block;
}
```

```html
<!-- src/index.html -->
<!doctype html><html lang=en>
<head>
  <meta charset=utf-8>
  <title>Comment Swap Example</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!--
  * The ‘developer-buttons’ menu will only exist in src/index.html.
  * It won’t exist in the production build, public/index.html. -->
  <!--?-->
  <menu id="developer-buttons">
    <button id="toggle-btn">
      Toggle Debug Panel
    </button>
  </menu>
  <!--=-->

  <!--
  * Viewing src/index.html in a browser, the heading shown is “DEV”.
  * But public/index.html will show a value from the `opts` argument. -->
  <h1>DEV<!--$ heading --></h1>

  <pre id="debug-panel">Loading...</pre>

  <script src="script.js"></script>
</body>
</html>
```

```js
// src/script.js

/* When src/script.js is used, run code which initialises ‘toggle-btn’.
 * But that code isn’t needed in public/script.js, the production build. */
/*?*/
document.querySelector('#toggle-btn').onclick =
    _evt => $debugPanel.style.display =
        $debugPanel.style.display !== 'none' ? 'none' : 'block';
/*=*/

const $debugPanel = document.querySelector('#debug-panel');
$debugPanel.innerHTML = 'Hello Developer!';
```
