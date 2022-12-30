import type { CommentSwapOptions } from '../../types';
import CSKind from './CommentSwapKind';
import Filetype from './Filetype';

export default class QuickCommentSwap {
    replacement: string;
    swapBegin: number;
    swapEnd: number;

    constructor(
        readonly commentBegin: number,
        readonly commentEnd: number,
        readonly filetype: Filetype,
        readonly kind: CSKind,
    ) {}

    process(
        opts: CommentSwapOptions,
        source: string,
        prevKind: CSKind,
        nextCommentSwap: QuickCommentSwap | null,
    ) {
        this.swapBegin = this.commentBegin;
        this.swapEnd = this.commentEnd;

        // If the previous Comment Swap was a Ternary Condition, then this should
        // be either a Literal Before or a Variable Before Comment Swap. The 
        // Ternary Condition will have already read the replacement source inside
        // this Comment Swap (if the condition is false), so we actually don’t
        // want this Comment Swap to contribute anything to the processed source.
        if (prevKind === CSKind.TernaryCondition) {
            this.replacement = '';
            return;            
        }

        switch (this.kind) {
            case CSKind.LiteralAfter:
            case CSKind.VariableAfter:
                [ this.replacement, this.swapEnd ] =
                    prepareReplacementAfter(
                        opts,
                        this.commentBegin,
                        this.commentEnd,
                        this.kind,
                        source,
                        this.filetype,
                    );
                break;

            case CSKind.LiteralBefore:
            case CSKind.VariableBefore:
                [ this.replacement, this.swapBegin ] =
                    prepareReplacementBefore(
                        opts,
                        this.commentBegin,
                        this.commentEnd,
                        this.kind,
                        source,
                        this.filetype,
                    );
                break;

            case CSKind.TernaryCondition:
                [ this.replacement, this.swapEnd ] =
                    prepareReplacementTernary(
                        opts,
                        this.commentBegin,
                        this.commentEnd,
                        source,
                        this.filetype,
                        nextCommentSwap,
                    );
                break;
        }
    }

    toString() {
        return `${CSKind[this.kind]} ${this.commentBegin}-${this.commentEnd}`
    }
}

function prepareReplacementAfter(
    opts: CommentSwapOptions,
    commentBegin: number,
    commentEnd: number,
    kind: CSKind.LiteralAfter | CSKind.VariableAfter,
    source: string,
    filetype: Filetype,
): [ string, number ] {
    const len = source.length;

    // Throw an exception if this Comment Swap ends the source code.
    if (commentEnd === len)
        throw Error(`A '${CSKind[kind]}' Comment Swap is at end of source`);

    // Start at the character position after the end of the Comment Swap.
    // We have established above that `commentEnd` is not at the very end of
    // `source`, so there must be at least one character after it.
    let pos = commentEnd;

    // Step forwards through `source`, character-by-character, to find the end
    // position of any whitespace which should be preserved.
    for (; pos<len; pos++) {
        if (! charIsWhitespace(source[pos])) break;
    }
    const preservedSpaceEnd = pos;

    // Step forwards through `source`, character-by-character, to find the
    // position of a special 'break' character, which delimits the replacement.
    switch (filetype) {
        case Filetype.Css:
            for (; pos<len; pos++) {
                const c = source[pos];
                if (c === ':' || // eg h1 { /* color =*/background:red }  -> h1 { color:red }
                    c === ';' || // eg h1 { color:/* red =*/blue; top:0 } -> h1 { color:red; top:0 }
                    c === '{' || // eg /* h1 =*/ div { color:red }        -> h1 { color:red }
                    c === '}'    // eg h1 { color:/* red =*/blue }        -> h1 { color:red }
                ) break;
            }
            break;
        case Filetype.Html:
            for (; pos<len; pos++) {
                const c = source[pos];
                if (c === '<') break; // eg <div><!-- Hi =-->Hello</div> -> <div>Hi</div>
            }
            break;
        case Filetype.Js:
            for (; pos<len; pos++) {
                const c = source[pos];
                if (c === '(' || // eg function/* foo =*/ bar() {}       -> function foo() {}
                    c === ')' || // eg function fn(/* foo =*/bar) {}     -> function fn(foo) {}
                    c === ',' || // eg add(/* 99 =*/1, 2)                -> add(99, 2)
                    c === ':' || // eg { /* bar =*/foo:1 }               -> { bar:1 }
                    c === ';' || // eg let foo = /* "foo" =*/"bar" ;     -> let foo = "foo" ;
                    c === '=' || // eg let /* foo =*/bar = "foo"         -> let foo = "foo"
                    c === '{' || // eg class /* Bar =*/Foo {}            -> class Bar {}
                    c === '}'    // eg import { a, /* b =*/c } from "d"  -> import { a, b } from "d"
                ) break;
            }
            break;
        default:
            throw Error(`filetype '${Filetype[filetype]}' not supported`);
    }

    // Wind backwards, to preserve any whitespace directly before the break character.
    for (; pos>preservedSpaceEnd; pos--) {
        if (! charIsWhitespace(source[pos - 1])) { break; } // note the `- 1`
    }
    const swapEnd = pos;

    // Ensure there is something to replace.
    if (swapEnd === preservedSpaceEnd) throw Error(`A '${CSKind[kind]
        }' Comment Swap has nothing after it to replace`);

    // Get the content (literal or variable) from inside the comment.
    const content = getCommentContent(
        commentBegin + (filetype === Filetype.Html ? 4 : 2),
        commentEnd - (filetype === Filetype.Html ? 4 : 3),
        source,
        kind,
    );

    // If this Comment Swap is a Variable, retrieve it from `opts.$`.
    // Otherwise use the content literally returned by getCommentContent().
    const value = kind === CSKind.VariableAfter
        ? opts.$?.[content]
        : content;

    // The replacement source is any preserved whitespace followed by the value.
    // In the edge case where the variable is missing from `opts.$`, keep the
    // original source the way it was.
    const replacement = typeof value !== 'undefined'
        ? source.slice(commentEnd, preservedSpaceEnd) + value
        : source.slice(commentEnd, swapEnd);

    return [ replacement, swapEnd ];
}

function prepareReplacementBefore(
    opts: CommentSwapOptions,
    commentBegin: number,
    commentEnd: number,
    kind: CSKind.LiteralBefore | CSKind.VariableBefore,
    source: string,
    filetype: Filetype,
): [ string, number ] {
    // Throw an exception if this Comment Swap begins the source code.
    if (commentBegin === 0)
        throw Error(`A '${CSKind[kind]}' Comment Swap is at pos 0`);

    // Start at the character position before the beginning of the Comment Swap.
    // We have established above that `commentBegin` is at least 1,  so `pos`
    // must be at least 0.
    let pos = commentBegin - 1;

    // Step backwards through `source`, character-by-character, to find the
    // start position of any whitespace which should be preserved.
    for (; pos>-1; pos--) {
        if (! charIsWhitespace(source[pos])) break;
    }
    const preservedSpaceBegin = pos + 1;

    // Step backwards through `source`, character-by-character, to find the
    // position of a special 'break' character, which delimits the replacement.
    switch (filetype) {
        case Filetype.Css:
            for (; pos>-1; pos--) {
                const c = source[pos];
                if (c === ':' || // eg h1 { color:blue/*= red */ }         -> h1 { color:red }
                    c === ';' || // eg h1 { color:red; width/*= top */:0 } -> h1 { color:red; top:0 }
                    c === '{' || // eg h1 { background/*= color */:red }   -> h1 { color:red }
                    c === '}'    // eg h1 { color:blue } div/*= h2 */ {}   -> h1 { color:red } h2 {}
                ) break;
            }
            break;
        case Filetype.Html:
            for (; pos>-1; pos--) {
                const c = source[pos];
                if (c === '>') break; // eg <div>Hello<!--= Hi --></div> -> <div>Hi</div>
            }
            break;
        case Filetype.Js:
            for (; pos>-1; pos--) {
                const c = source[pos];
                if (c === '(' || // eg fn(bar/*= foo */)                    -> fn(foo)
                    c === ')' || // eg (1+2)*3 /*= *4 */                    -> (1+2)*4
                    c === ',' || // eg add(1, 2/*= 99 */)                   -> add(1, 99)
                    c === ':' || // eg { foo:99/*= 1 */ }                   -> { foo:1 }
                    c === ';' || // eg fn(); const /*= let */foo = "foo"    -> fn(); let foo = "foo"
                    c === '=' || // eg let foo = "bar"/*= "foo" */          -> let foo = "foo"
                    c === '{' || // eg item => { add/*= remove */(item) }   -> item => { remove(item) }
                    c === '}'    // eg import { a } from "b"/*= from "c" */ -> import { a } from "c"
                ) break;
            }
            break;
        default:
            throw Error(`filetype '${Filetype[filetype]}' not supported`);
    }

    // Step forwards, to preserve any whitespace directly after the break character.
    for (; pos<preservedSpaceBegin; pos++) {
        if (! charIsWhitespace(source[pos + 1])) break; // note the `+ 1`
    }
    const swapBegin = pos + 1;

    // Ensure there is something to replace.
    if (swapBegin === preservedSpaceBegin + 1) throw Error(`A '${CSKind[kind]
        }' Comment Swap has nothing before it to replace`);

    // Get the content (literal or variable) from inside the comment.
    const content = getCommentContent(
        commentBegin + (filetype === Filetype.Html ? 5 : 3),
        commentEnd - (filetype === Filetype.Html ? 3 : 2),
        source,
        kind,
    );

    // If this Comment Swap is a Variable, retrieve it from `opts.$`.
    // Otherwise use the content literally returned by getCommentContent().
    const value = kind === CSKind.VariableBefore
        ? opts.$?.[content]
        : content;

    // The replacement source is the value followed by any preserved whitespace.
    // In the edge case where the variable is missing from `opts.$`, keep the
    // original source code the way it was.
    const replacement = typeof value !== 'undefined'
        ? value + source.slice(preservedSpaceBegin, commentBegin)
        : source.slice(swapBegin, commentBegin);

    return [ replacement, swapBegin ];
}

function prepareReplacementTernary(
    opts: CommentSwapOptions,
    commentBegin: number,
    commentEnd: number,
    source: string,
    filetype: Filetype,
    nextCS: QuickCommentSwap | null,
): [ string, number ] {
    const len = source.length;

    // Throw an exception if this Ternary Condition ends the source code,
    // or is the last Comment Swap. 
    if (commentEnd === len)
        throw Error(`A 'TernaryCondition' Comment Swap is at end of source`);
    if (nextCS === null)
        throw Error(`'TernaryCondition' at pos ${
            commentBegin} is the last Comment Swap in source`);

    // Throw an exception if this Ternary Condition is not followed by either
    // a 'Literal Before' or a 'Variable Before' Comment Swap.
    if (nextCS.kind !== CSKind.LiteralBefore &&
        nextCS.kind !== CSKind.VariableBefore)
        throw Error(`'${CSKind[nextCS.kind]}' at pos ${
            nextCS.commentBegin} follows 'TernaryCondition' at pos ${
            commentBegin}`);

    // Get the content from inside this Ternary Condition comment.
    const condition = getCommentContent(
        commentBegin + (filetype === Filetype.Html ? 4 : 2),
        commentEnd - (filetype === Filetype.Html ? 4 : 3),
        source,
        CSKind.TernaryCondition
    );

    // Resolve the condition against the `$` object, from the plugin options.
    // If true, `replacement` is the source code between the end of this
    // Ternary Condition and the start of the next Comment Swap.
    if (opts.$?.[condition]) {
        return [
            source.slice(commentEnd, nextCS.commentBegin),
            nextCS.commentEnd, // the position at the end of the next Comment Swap
        ]
    };

    // The condition is false, so get the content (literal or variable) from
    // inside the next Comment Swap.
    const content = getCommentContent(
        nextCS.commentBegin + (filetype === Filetype.Html ? 5 : 3),
        nextCS.commentEnd - (filetype === Filetype.Html ? 3 : 2),
        source,
        nextCS.kind,
        nextCS.kind === CSKind.LiteralBefore, // special case!
    );

    // If the condition is false and the next Comment Swap is a Variable,
    // retrieve it from `opts.$`.
    //
    // Otherwise use the content literally returned by getCommentContent().
    // In this special case, the Literal content has not been trimmed -
    // whitespace was preserved as-is.
    const value = nextCS.kind === CSKind.VariableBefore
        ? opts.$?.[content]
        : content;

    // The replacement source is usually just the value. In the edge case where the
    // variable is missing from `opts.$`, behave as if the condition was falsey.
    const replacement = typeof value !== 'undefined'
        ? value
        : source.slice(commentEnd, nextCS.commentBegin);

    return [ replacement, nextCS.commentEnd ];
}

function getCommentContent(
    sourceBegin: number,
    sourceEnd: number,
    source: string,
    kind: CSKind,
    preserveWhitespace: boolean = false,
) {
    // Get the content (Literal or Variable) from inside the comment.
    let content = source.slice(sourceBegin, sourceEnd);

    // Literal Comment Swap content can contain any characters.
    if (kind === CSKind.LiteralAfter ||
        kind === CSKind.LiteralBefore
    ) {
        // Leading and trailing whitespace should be removed, unless this
        // is a LiteralBefore following a TernaryCondition.
        if (preserveWhitespace)
            return content;
        else
            return content.trim();
    }

    // Not a Literal Comment Swap, so remove leading and trailing whitespace.
    content = content.trim();

    // Throw an exception if the content is not parseable.
    if (content !== '' && ! /^[$_a-z][$_a-z0-9]*$/i.test(content))
        throw Error(`'${CSKind[kind]}' content at pos ${
            sourceBegin} fails /^[$_a-z][$_a-z0-9]*$/i`);

    return content;
}

// Returns `true` if `char` is a W3C-defined whitespace character.
// From www.w3.org/TR/2003/WD-CSS21-20030915/syndata.html 4.1.1:
//     Only the characters "space" (Unicode code point 32), "tab" (9),
//     "line feed" (10), "carriage return" (13), and "form feed" (12) can
//     occur in whitespace.
function charIsWhitespace(
    char: string,
) {
    // Short circuit for the usual case where `char` is not whitespace.
    // eg the ASCII character '!' is greater than ' '.
    if (char > ' ') return false;

    // Test `char`. Start with "space" (the most commonly found), and end with
    // "form feed" (the least commonly found).
    return char===' ' || char==='\n' || char==='\t' || char==='\r' || char==='\f';
}
