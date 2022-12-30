const test = require('ava');
const quickTransformJs = require('../dist/cjs').quickTransformJs;

test('quickTransformJs() error: Literal After', t => {
    const literalAfterAtEnd = 'abc /* def =*/';
    const literalAfterNoReplacement = '/* abc =*/ =def';

    t.throws(() => quickTransformJs(literalAfterAtEnd), {
        instanceOf: Error,
        message: "A 'LiteralAfter' Comment Swap is at end of source",
    });
    t.throws(() => quickTransformJs(literalAfterNoReplacement), {
        message: "A 'LiteralAfter' Comment Swap has nothing after it to replace" });
});

test('quickTransformJs() error: Literal Before', t => {
    const literalBeforeAtStart = '/*= abc */ def';
    const literalBeforeNoReplacement = 'abc=  /*= def */';
    const literalBeforeEndsEquals = 'abc /*= d =*/';
    const literalBeforeEndsDollar = 'ab /*= cd $*/';
    const literalBeforeEndsQuestion = 'a /*= b ?*/';

    t.throws(() => quickTransformJs(literalBeforeAtStart), {
        message: "A 'LiteralBefore' Comment Swap is at pos 0" });
    t.throws(() => quickTransformJs(literalBeforeNoReplacement), {
        message: "A 'LiteralBefore' Comment Swap has nothing before it to replace" });
    t.throws(() => quickTransformJs(literalBeforeEndsEquals), {
        message: "'LiteralBefore' Comment Swap ends '=' (pos 4)" });
    t.throws(() => quickTransformJs(literalBeforeEndsDollar), {
        message: "'LiteralBefore' Comment Swap ends '$' (pos 3)" });
    t.throws(() => quickTransformJs(literalBeforeEndsQuestion), {
        message: "'LiteralBefore' Comment Swap ends '?' (pos 2)" });
});

test('quickTransformJs() error: Ternary Placement', t => {
    const ternaryConditionAtEnd = '/* abc ?*/';
    const ternaryConditionIsOnlyCommentSwap = '/* abc ?*/ def /* ghi */';
    const ternaryConditionThenLiteralAfter = '/* abc ?*/ def /* ghi =*/ jkl';
    const ternaryConditionThenVariableAfter = 'a /* bc ?*/ def /* ghi $*/ jkl';
    const twoTernaryConditionsApart = '\t/* abc ?*/ def /* ghi ?*/ jkl';
    const twoTernaryConditionsTogether = '.../* abc ?*//* def ?*/ ghi';

    t.throws(() => quickTransformJs(ternaryConditionAtEnd), {
        message: "A 'TernaryCondition' Comment Swap is at end of source" });
    t.throws(() => quickTransformJs(ternaryConditionIsOnlyCommentSwap), {
        message: "'TernaryCondition' at pos 0 is the last Comment Swap in source" });
    t.throws(() => quickTransformJs(ternaryConditionThenLiteralAfter), {
        message: "'LiteralAfter' at pos 15 follows 'TernaryCondition' at pos 0" });
    t.throws(() => quickTransformJs(ternaryConditionThenVariableAfter), {
        message: "'VariableAfter' at pos 16 follows 'TernaryCondition' at pos 2" });
    t.throws(() => quickTransformJs(twoTernaryConditionsApart), {
        message: "'TernaryCondition' at pos 16 follows 'TernaryCondition' at pos 1" });
    t.throws(() => quickTransformJs(twoTernaryConditionsTogether), {
        message: "'TernaryCondition' at pos 13 follows 'TernaryCondition' at pos 3" });
});

test('quickTransformJs() error: Ternary Syntax', t => {
    const ternarySyntaxError = '/* # ?*/ a /*= b */';

    t.throws(() => quickTransformJs(ternarySyntaxError), {
        message: "'TernaryCondition' content at pos 2 fails /^[$_a-z][$_a-z0-9]*$/i" });
});

test('quickTransformJs() error: Variable After', t => {
    const variableAfterAtEnd = 'abc/*def$*/';
    const variableAfterNoReplacement = 'abc/*def$*/ ';

    t.throws(() => quickTransformJs(variableAfterAtEnd), {
        message: "A 'VariableAfter' Comment Swap is at end of source" });
    t.throws(() => quickTransformJs(variableAfterNoReplacement), {
        message: "A 'VariableAfter' Comment Swap has nothing after it to replace" });
});

test('quickTransformJs() error: Variable Before', t => {
    const variableBeforeAtStart = '/*$ abc */ def';
    const variableBeforeNoReplacement = 'abc=  /*$ def */';
    const variableBeforeEndsEquals = 'a /*$ bcd =*/';
    const variableBeforeEndsDollar = 'ab /*$ cd $*/';
    const variableBeforeEndsQuestion = 'abc /*$ d ?*/';

    t.throws(() => quickTransformJs(variableBeforeAtStart), {
        message: "A 'VariableBefore' Comment Swap is at pos 0" });
    t.throws(() => quickTransformJs(variableBeforeNoReplacement), {
        message: "A 'VariableBefore' Comment Swap has nothing before it to replace" });
    t.throws(() => quickTransformJs(variableBeforeEndsEquals), {
        message: "'VariableBefore' Comment Swap ends '=' (pos 2)" });
    t.throws(() => quickTransformJs(variableBeforeEndsDollar), {
        message: "'VariableBefore' Comment Swap ends '$' (pos 3)" });
    t.throws(() => quickTransformJs(variableBeforeEndsQuestion), {
        message: "'VariableBefore' Comment Swap ends '?' (pos 4)" });
});
