const test = require('ava');
const quickTransformCss = require('../dist/cjs').quickTransformCss;

test('quickTransformCss() ok: No Comment Swaps', t => {
    const boringCode = 'h1 { color:red }';
    t.is(quickTransformCss({}, boringCode), `${boringCode}\n/* @TODO quickTransformCss() */`);
});
