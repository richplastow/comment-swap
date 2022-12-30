const test = require('ava');
const quickTransformJs = require('../dist/cjs').quickTransformJs;

test('quickTransformJs() ok: No Comment Swaps', t => {
    const boringSource = 'let domain = "dev.example.com"';
    t.is(quickTransformJs(boringSource), boringSource);
    t.is(quickTransformJs(boringSource, { returnNull:true }), null);
});
