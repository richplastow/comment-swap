const test = require('ava');
const quickTransformHtml = require('../dist/cjs').quickTransformHtml;

test('quickTransformHtml() ok: No Comment Swaps', t => {
    const boringSource = '<h1>Hello <em>World</em></h1>';
    t.is(quickTransformHtml(boringSource), boringSource);
    t.is(quickTransformHtml(boringSource, { returnNull:true }), null);
});

test('quickTransformHtml() ok: Object with toString()', t => {
    const obj = {
        toString() {
            return '<h1><!-- Hi =-->Hello <em><!-- Planet =-->World</em></h1>';
        }
    };
    t.is(quickTransformHtml(obj), '<h1>Hi <em>Planet</em></h1>');
});

test('quickTransformHtml() ok: Literal', t => {
    const literalAfter  = '<h1><!-- Hi =-->Hello <em><!-- Planet =-->World</em></h1>';
    const literalBefore  = '<h1>Hello <!--= Hi --><em>World<!--= Planet --></em></h1>';
    const literalEmpty  = '<h1>Hello<!--=-->Hi <em>World<!--=-->Planet</em></h1>';
    const literalOk = '<h1>Hi <em>Planet</em></h1>';

    t.is(quickTransformHtml(literalAfter, { returnNull:true }), literalOk);
    t.is(quickTransformHtml(literalAfter), literalOk); // defaults to `returnNull:false`
    t.is(quickTransformHtml(literalBefore), literalOk);
    t.is(quickTransformHtml(literalEmpty), literalOk);
});

test('quickTransformHtml() ok: Ternary Literal', t => {
    const ternaryAlmostEmptyConditionLiteral = '<!-- \t\n ?--> <h1> <!--= <h2> -->Hi <!-- ?--></h1><!--=</h2>--> !';
    const ternaryEmptyConditionLiteral = '<!--?--> <h1> <!--= <h2> -->Hi <!--?--></h1><!--=</h2>--> !';
    const ternaryFalseyConditionLiteral = '<!-- falsey ?--> <h1> <!--= <h2> -->Hi </h2> !';
    const ternaryMissingConditionLiteral = '<!-- missing ?--> <h1> <!--= <h2> -->Hi </h2> !';
    const ternaryTruthyConditionLiteral = '<!-- truthy ?--> <h2> <!--= <h1> -->Hi </h2> !';
    const ternaryOk = ' <h2> Hi </h2> !';

    t.is(quickTransformHtml(ternaryAlmostEmptyConditionLiteral), ternaryOk);
    t.is(quickTransformHtml(ternaryEmptyConditionLiteral), ternaryOk);
    t.is(quickTransformHtml(ternaryFalseyConditionLiteral, { $:{ falsey:'' } }), ternaryOk);
    t.is(quickTransformHtml(ternaryMissingConditionLiteral), ternaryOk);
    t.is(quickTransformHtml(ternaryTruthyConditionLiteral, { $:{ truthy:[] } }), ternaryOk);
});

test('quickTransformHtml() ok: Ternary Variable', t => {
    const ternaryEmptyConditionVariable =
        ' <!-- \t\n ?--><h1><!--$ begin --> Hi<!--?--></h1><!--$ end --> }';
    const ternaryFalseyConditionVariable =
        '<!-- falsey ?--> <h1> <!--$ beginSpc -->Hi<!--nonesuch?--></h1> <!--$endSpc-->}';
    const ternaryTruthyConditionVariable =
        '<!-- truthy ?--> <h2> <!--$ end -->Hi<!-- end ?--> </h2><!--$falsey--> }';
    const ternaryVariableDoesNotExist =
        ' <!-- falsey?--><h2><!--$ nonesuch --> Hi<!-- ?--> </h2><!--$nonesuch--> }';
    const ternaryOk = ' <h2> Hi </h2> }';
    const opts = {
        $:{ falsey:false, begin:'<h2>', beginSpc:' <h2> ', end:' </h2>' , endSpc:' </h2> ', truthy:123 }
    };

    t.is(quickTransformHtml(ternaryEmptyConditionVariable, opts), ternaryOk);
    t.is(quickTransformHtml(ternaryFalseyConditionVariable, opts), ternaryOk);
    t.is(quickTransformHtml(ternaryTruthyConditionVariable, opts), ternaryOk);
    t.is(quickTransformHtml(ternaryVariableDoesNotExist, opts), ternaryOk);
});

test('quickTransformHtml() ok: Variable', t => {
    const variableAfter = '<h1><!-- greet $-->Hello <em><!-- place $-->World</em></h1>';
    const variableBefore = '<h1>Hello <!--$ greet --><em>World<!--$ place --></em></h1>';
    const variableNonesuch = '<h1><!-- nonesuch $-->Hi <em>Planet<!--$ nonesuch--></em></h1>';
    const variableOk = '<h1>Hi <em>Planet</em></h1>';
    const opts = {
        $:{ greet:'Hi', place:'Planet' }
    };

    t.is(quickTransformHtml(variableAfter, opts), variableOk);
    t.is(quickTransformHtml(variableBefore, opts), variableOk);
    t.is(quickTransformHtml(variableNonesuch, opts), variableOk);
});
