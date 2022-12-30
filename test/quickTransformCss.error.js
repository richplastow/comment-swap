const test = require('ava');
const quickTransformCss = require('../dist/cjs').quickTransformCss;

test('quickTransformCss() error: Literal After', t => {
    const literalAfterAtEnd = 'abc /* def =*/';
    const literalAfterNoReplacement = '/* abc =*/ :def';

    t.throws(() => quickTransformCss(literalAfterAtEnd), {
        instanceOf: Error,
        message: "A 'LiteralAfter' Comment Swap is at end of source",
    });
    t.throws(() => quickTransformCss(literalAfterNoReplacement), {
        message: "A 'LiteralAfter' Comment Swap has nothing after it to replace" });
});

test('quickTransformCss() error: Literal Before', t => {
    const literalBeforeAtStart = '/*= abc */ def';
    const literalBeforeNoReplacement = 'abc:  /*= def */';
    const literalBeforeEndsEquals = 'abc /*= d =*/';
    const literalBeforeEndsDollar = 'ab /*= cd $*/';
    const literalBeforeEndsQuestion = 'a /*= b ?*/';

    t.throws(() => quickTransformCss(literalBeforeAtStart), {
        message: "A 'LiteralBefore' Comment Swap is at pos 0" });
    t.throws(() => quickTransformCss(literalBeforeNoReplacement), {
        message: "A 'LiteralBefore' Comment Swap has nothing before it to replace" });
    t.throws(() => quickTransformCss(literalBeforeEndsEquals), {
        message: "'LiteralBefore' Comment Swap ends '=' (pos 4)" });
    t.throws(() => quickTransformCss(literalBeforeEndsDollar), {
        message: "'LiteralBefore' Comment Swap ends '$' (pos 3)" });
    t.throws(() => quickTransformCss(literalBeforeEndsQuestion), {
        message: "'LiteralBefore' Comment Swap ends '?' (pos 2)" });
});

test('quickTransformCss() error: Ternary Placement', t => {
    const ternaryConditionAtEnd = '/* abc ?*/';
    const ternaryConditionIsOnlyCommentSwap = '/* abc ?*/ def /* ghi */';
    const ternaryConditionThenLiteralAfter = '/* abc ?*/ def /* ghi =*/ jkl';
    const ternaryConditionThenVariableAfter = 'a /* bc ?*/ def /* ghi $*/ jkl';
    const twoTernaryConditionsApart = '\t/* abc ?*/ def /* ghi ?*/ jkl';
    const twoTernaryConditionsTogether = '.../* abc ?*//* def ?*/ ghi';

    t.throws(() => quickTransformCss(ternaryConditionAtEnd), {
        message: "A 'TernaryCondition' Comment Swap is at end of source" });
    t.throws(() => quickTransformCss(ternaryConditionIsOnlyCommentSwap), {
        message: "'TernaryCondition' at pos 0 is the last Comment Swap in source" });
    t.throws(() => quickTransformCss(ternaryConditionThenLiteralAfter), {
        message: "'LiteralAfter' at pos 15 follows 'TernaryCondition' at pos 0" });
    t.throws(() => quickTransformCss(ternaryConditionThenVariableAfter), {
        message: "'VariableAfter' at pos 16 follows 'TernaryCondition' at pos 2" });
    t.throws(() => quickTransformCss(twoTernaryConditionsApart), {
        message: "'TernaryCondition' at pos 16 follows 'TernaryCondition' at pos 1" });
    t.throws(() => quickTransformCss(twoTernaryConditionsTogether), {
        message: "'TernaryCondition' at pos 13 follows 'TernaryCondition' at pos 3" });
});

test('quickTransformCss() error: Ternary Syntax', t => {
    const ternarySyntaxError = '/* # ?*/ a /*= b */';

    t.throws(() => quickTransformCss(ternarySyntaxError), {
        message: "'TernaryCondition' content at pos 2 fails /^[$_a-z][$_a-z0-9]*$/i" });
});

test('quickTransformCss() error: Variable After', t => {
    const variableAfterAtEnd = 'abc/*def$*/';
    const variableAfterNoReplacement = 'abc/*def$*/ ';

    t.throws(() => quickTransformCss(variableAfterAtEnd), {
        message: "A 'VariableAfter' Comment Swap is at end of source" });
    t.throws(() => quickTransformCss(variableAfterNoReplacement), {
        message: "A 'VariableAfter' Comment Swap has nothing after it to replace" });
});

test('quickTransformCss() error: Variable Before', t => {
    const variableBeforeAtStart = '/*$ abc */ def';
    const variableBeforeNoReplacement = 'abc:  /*$ def */';
    const variableBeforeEndsEquals = 'a /*$ bcd =*/';
    const variableBeforeEndsDollar = 'ab /*$ cd $*/';
    const variableBeforeEndsQuestion = 'abc /*$ d ?*/';

    t.throws(() => quickTransformCss(variableBeforeAtStart), {
        message: "A 'VariableBefore' Comment Swap is at pos 0" });
    t.throws(() => quickTransformCss(variableBeforeNoReplacement), {
        message: "A 'VariableBefore' Comment Swap has nothing before it to replace" });
    t.throws(() => quickTransformCss(variableBeforeEndsEquals), {
        message: "'VariableBefore' Comment Swap ends '=' (pos 2)" });
    t.throws(() => quickTransformCss(variableBeforeEndsDollar), {
        message: "'VariableBefore' Comment Swap ends '$' (pos 3)" });
    t.throws(() => quickTransformCss(variableBeforeEndsQuestion), {
        message: "'VariableBefore' Comment Swap ends '?' (pos 4)" });
});
