import test from 'ava';
import { quickTransformJs } from '../dist/es/index.js';

test('quickTransformJs() ok: No Comment Swaps', t => {
    const boringSource = 'let domain = "example.com"';
    t.is(quickTransformJs(boringSource), boringSource);
    t.is(quickTransformJs(boringSource, { returnNull:true }), null);
});

test('quickJs() ok: Literal', t => {
    const literalAfter  = ' let /* domain =*/production = "prod.example.com"';
    const literalBefore = ' let domain = "dev.example.com"/*= "prod.example.com" */';
    const literalEmpty = ' let domain = "mock-" +/*=*/"prod.example.com"';
    const literalOk = ' let domain = "prod.example.com"';

    t.is(quickTransformJs(literalAfter, { returnNull:true }), literalOk);
    t.is(quickTransformJs(literalAfter), literalOk); // defaults to `returnNull:false`
    t.is(quickTransformJs(literalBefore), literalOk);
    t.is(quickTransformJs(literalEmpty), literalOk);
});

test('quickJs() ok: Ternary Literal', t => {
    const ternaryAlmostEmptyConditionLiteral = '/* \t\n ?*/ const /*= let */foo = "foo"';
    const ternaryEmptyConditionLiteral = '/*?*/ const /*= let */foo = "foo"';
    const ternaryFalseyConditionLiteral = '/* falsey ?*/ const /*= let */foo = "foo"';
    const ternaryMissingConditionLiteral = '/* missing ?*/ const /*= let */foo = "foo"';
    const ternaryTruthyConditionLiteral = '/* truthy ?*/ let /*= const */foo = "foo"';
    const ternaryOk = ' let foo = "foo"';

    t.is(quickTransformJs(ternaryAlmostEmptyConditionLiteral), ternaryOk);
    t.is(quickTransformJs(ternaryEmptyConditionLiteral), ternaryOk);
    t.is(quickTransformJs(ternaryFalseyConditionLiteral, { $:{ falsey:'' } }), ternaryOk);
    t.is(quickTransformJs(ternaryMissingConditionLiteral), ternaryOk);
    t.is(quickTransformJs(ternaryTruthyConditionLiteral, { $:{ truthy:[] } }), ternaryOk);
});

test('quickJs() ok: Ternary Variable', t => {
    const ternaryEmptyConditionLiteral =
        ' /* \t\n ?*/const/*$ assignmentKeyword */ foo = /*?*/"bar"/*$value*/';
    const ternaryFalseyConditionVariable =
        '/* falsey ?*/const/*$ assignmentKeywordSpc */foo = /*nonesuch?*/"bar"/*$value*/';
    const ternaryTruthyConditionVariable =
        '/* truthy ?*/ let /*$ falsey */foo = /*value?*/"foo"/*$assignmentKeyword*/';
    const ternaryVariableDoesNotExist =
        ' /* falsey?*/let/*$ nonesuch */ foo = /* ?*/"foo"/*$nonesuch*/';
    const ternaryOk = ' let foo = "foo"';
    const opts = {
        $:{ assignmentKeyword:'let', assignmentKeywordSpc:' let ', falsey:0, truthy:Math, value:'"foo"' }
    };

    t.is(quickTransformJs(ternaryEmptyConditionLiteral, opts), ternaryOk);
    t.is(quickTransformJs(ternaryFalseyConditionVariable, opts), ternaryOk);
    t.is(quickTransformJs(ternaryTruthyConditionVariable, opts), ternaryOk);
    t.is(quickTransformJs(ternaryVariableDoesNotExist, opts), ternaryOk);
});

test('quickJs() ok: Variable', t => {
    const variableAfter = 'fn();/* leftHand $*/ const bar =/*value$*/ "bar" ;';
    const variableBefore = 'fn(); const/*$assignmentKeyword*/ foo = "bar" /*$ value */;';
    const variableNonesuch = 'fn();/* nonesuch $*/ let foo = "foo" /*$ nonesuch */;';
    const variableNumeric = 'let foo =/* numeric $*/ "bar"';
    const variableOk = 'fn(); let foo = "foo" ;';
    const variableNumericOk = 'let foo = 123';
    const opts = {
        $:{ assignmentKeyword:'let', leftHand:'let foo', numeric:123, value:'"foo"' }
    };

    t.is(quickTransformJs(variableAfter, opts), variableOk);
    t.is(quickTransformJs(variableBefore, opts), variableOk);
    t.is(quickTransformJs(variableNonesuch, opts), variableOk);
    t.is(quickTransformJs(variableNumeric, opts), variableNumericOk);
});

test('quickJs() ok: Replaces up to open bracket', t => {
    const openBracket1   = 'function/* foo =*/  bar() {}';
    const openBracket1ok = 'function  foo() {}';
    const openBracket2   = 'function fn(\tbar/*= foo */) {}';
    const openBracket2ok = 'function fn(\tfoo) {}';

    t.is(quickTransformJs(openBracket1), openBracket1ok);
    t.is(quickTransformJs(openBracket2), openBracket2ok);
});

test('quickJs() ok: Replaces up to close bracket', t => {
    const closeBracket1   = 'function fn(/* foo =*/bar) {}';
    const closeBracket1ok = 'function fn(foo) {}';
    const closeBracket2   = '(1+2)*3/*=*4*/';
    const closeBracket2ok = '(1+2)*4';

    t.is(quickTransformJs(closeBracket1), closeBracket1ok);
    t.is(quickTransformJs(closeBracket2), closeBracket2ok);
});

test('quickJs() ok: Replaces up to comma', t => {
    const comma1   = 'add(/* 99 =*/1, 2)';
    const comma1ok = 'add(99, 2)';
    const comma2   = 'add(1, 2/*= 99 */)';
    const comma2ok = 'add(1, 99)';

    t.is(quickTransformJs(comma1), comma1ok);
    t.is(quickTransformJs(comma2), comma2ok);
});

test('quickJs() ok: Replaces up to colon', t => {
    const colon1   = '{ /* bar =*/foo:1 }';
    const colon1ok = '{ bar:1 }';
    const colon2   = '{ foo:99/*= 1 */ }';
    const colon2ok = '{ foo:1 }';

    t.is(quickTransformJs(colon1), colon1ok);
    t.is(quickTransformJs(colon2), colon2ok);
});

test('quickJs() ok: Replaces up to semicolon', t => {
    const semicolon1   = 'let foo = /* "foo" =*/"bar" ;';
    const semicolon1ok = 'let foo = "foo" ;';
    const semicolon2   = 'h1 { color:red; width/*= top */:0 }';
    const semicolon2ok = 'h1 { color:red; top:0 }';

    t.is(quickTransformJs(semicolon1), semicolon1ok);
    t.is(quickTransformJs(semicolon2), semicolon2ok);
});

test('quickJs() ok: Replaces up to equals', t => {
    const equals1   = 'let /* foo =*/\rbar\n\r= "foo"';
        const equals1ok = 'let \rfoo\n\r= "foo"';
    const equals2   = 'let foo ="bar"\f/*= "foo" */';
    const equals2ok = 'let foo ="foo"\f';

    t.is(quickTransformJs(equals1), equals1ok);
    t.is(quickTransformJs(equals2), equals2ok);
});

test('quickJs() ok: Replaces up to open curly bracket', t => {
    const openCurly1   = 'class /* Bar =*/Foo {}';
    const openCurly1ok = 'class Bar {}';
    const openCurly2   = 'item => { add/*= remove */(item) }';
    const openCurly2ok = 'item => { remove(item) }';

    t.is(quickTransformJs(openCurly1), openCurly1ok);
    t.is(quickTransformJs(openCurly2), openCurly2ok);
});

test('quickJs() ok: Replaces up to close curly bracket', t => {
    const closeCurly1   = 'import { a, /* b =*/c } from "d"';
    const closeCurly1ok = 'import { a, b } from "d"';
    const closeCurly2   = 'import { a } from "b"/*= from "c" */';
    const closeCurly2ok = 'import { a } from "c"';

    t.is(quickTransformJs(closeCurly1), closeCurly1ok);
    t.is(quickTransformJs(closeCurly2), closeCurly2ok);
});
