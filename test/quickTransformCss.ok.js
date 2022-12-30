const test = require('ava');
const quickTransformCss = require('../dist/cjs').quickTransformCss;

test('quickTransformCss() ok: No Comment Swaps', t => {
    const boringSource = 'h1 { color:red }';
    t.is(quickTransformCss(boringSource), boringSource);
    t.is(quickTransformCss(boringSource, { returnNull:true }), null);
});
