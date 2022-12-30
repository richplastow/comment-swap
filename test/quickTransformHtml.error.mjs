import test from 'ava';
import { quickTransformHtml } from '../dist/es/index.js';

test('quickTransformHtml() error: Literal After', t => {
    const literalAfterAtEnd = 'abc <!-- def =-->';
    const literalAfterNoReplacement = '<!-- abc =--> <br>';

    t.throws(() => quickTransformHtml(literalAfterAtEnd), {
        instanceOf: Error,
        message: "A 'LiteralAfter' Comment Swap is at end of source",
    });
    t.throws(() => quickTransformHtml(literalAfterNoReplacement), {
        message: "A 'LiteralAfter' Comment Swap has nothing after it to replace" });
});

test('quickTransformHtml() error: Literal Before', t => {
    const literalBeforeAtStart = '<!--= abc --> def';
    const literalBeforeNoReplacement = '<br>  <!--= def -->';
    const literalBeforeEndsEquals = 'abc <!--= d =-->';
    const literalBeforeEndsDollar = 'ab <!--= cd $-->';
    const literalBeforeEndsQuestion = 'a <!--= b ?-->';

    t.throws(() => quickTransformHtml(literalBeforeAtStart), {
        message: "A 'LiteralBefore' Comment Swap is at pos 0" });
    t.throws(() => quickTransformHtml(literalBeforeNoReplacement), {
        message: "A 'LiteralBefore' Comment Swap has nothing before it to replace" });
    t.throws(() => quickTransformHtml(literalBeforeEndsEquals), {
        message: "'LiteralBefore' Comment Swap ends '=' (pos 4)" });
    t.throws(() => quickTransformHtml(literalBeforeEndsDollar), {
        message: "'LiteralBefore' Comment Swap ends '$' (pos 3)" });
    t.throws(() => quickTransformHtml(literalBeforeEndsQuestion), {
        message: "'LiteralBefore' Comment Swap ends '?' (pos 2)" });
});

test('quickTransformHtml() error: Ternary Placement', t => {
    const ternaryConditionAtEnd = '<!-- abc ?-->';
    const ternaryConditionIsOnlyCommentSwap = '<!-- abc ?--> def <!-- ghi -->';
    const ternaryConditionThenLiteralAfter = '<!-- abc ?--> def <!-- ghi =--> jkl';
    const ternaryConditionThenVariableAfter = 'a <!-- bc ?--> def <!-- ghi $--> jkl';
    const twoTernaryConditionsApart = '\t<!-- abc ?--> def <!-- ghi ?--> jkl';
    const twoTernaryConditionsTogether = '...<!-- abc ?--><!-- def ?--> ghi';

    t.throws(() => quickTransformHtml(ternaryConditionAtEnd), {
        message: "A 'TernaryCondition' Comment Swap is at end of source" });
    t.throws(() => quickTransformHtml(ternaryConditionIsOnlyCommentSwap), {
        message: "'TernaryCondition' at pos 0 is the last Comment Swap in source" });
    t.throws(() => quickTransformHtml(ternaryConditionThenLiteralAfter), {
        message: "'LiteralAfter' at pos 18 follows 'TernaryCondition' at pos 0" });
    t.throws(() => quickTransformHtml(ternaryConditionThenVariableAfter), {
        message: "'VariableAfter' at pos 19 follows 'TernaryCondition' at pos 2" });
    t.throws(() => quickTransformHtml(twoTernaryConditionsApart), {
        message: "'TernaryCondition' at pos 19 follows 'TernaryCondition' at pos 1" });
    t.throws(() => quickTransformHtml(twoTernaryConditionsTogether), {
        message: "'TernaryCondition' at pos 16 follows 'TernaryCondition' at pos 3" });
});

test('quickTransformHtml() error: Ternary Syntax', t => {
    const ternarySyntaxError = '<!-- # ?--> a <!--= b -->';

    t.throws(() => quickTransformHtml(ternarySyntaxError), {
        message: "'TernaryCondition' content at pos 4 fails /^[$_a-z][$_a-z0-9]*$/i" });
});

test('quickTransformHtml() error: Variable After', t => {
    const variableAfterAtEnd = 'abc<!--def$-->';
    const variableAfterNoReplacement = 'abc<!--def$--> ';

    t.throws(() => quickTransformHtml(variableAfterAtEnd), {
        message: "A 'VariableAfter' Comment Swap is at end of source" });
    t.throws(() => quickTransformHtml(variableAfterNoReplacement), {
        message: "A 'VariableAfter' Comment Swap has nothing after it to replace" });
});

test('quickTransformHtml() error: Variable Before', t => {
    const variableBeforeAtStart = '<!--$ abc --> def';
    const variableBeforeNoReplacement = '<br>  <!--$ def -->';
    const variableBeforeEndsEquals = 'a <!--$ bcd =-->';
    const variableBeforeEndsDollar = 'ab <!--$ cd $-->';
    const variableBeforeEndsQuestion = 'abc <!--$ d ?-->';

    t.throws(() => quickTransformHtml(variableBeforeAtStart), {
        message: "A 'VariableBefore' Comment Swap is at pos 0" });
    t.throws(() => quickTransformHtml(variableBeforeNoReplacement), {
        message: "A 'VariableBefore' Comment Swap has nothing before it to replace" });
    t.throws(() => quickTransformHtml(variableBeforeEndsEquals), {
        message: "'VariableBefore' Comment Swap ends '=' (pos 2)" });
    t.throws(() => quickTransformHtml(variableBeforeEndsDollar), {
        message: "'VariableBefore' Comment Swap ends '$' (pos 3)" });
    t.throws(() => quickTransformHtml(variableBeforeEndsQuestion), {
        message: "'VariableBefore' Comment Swap ends '?' (pos 4)" });
});
