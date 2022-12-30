const test = require('ava');
const quickTransformHtml = require('../dist/cjs').quickTransformHtml;

test('quickTransformHtml() ok: No Comment Swaps', t => {
    const boringSource = '<h1>Boring <em>Source</em></h1>';
    t.is(quickTransformHtml(boringSource), boringSource);
    t.is(quickTransformHtml(boringSource, { returnNull:true }), null);
});
