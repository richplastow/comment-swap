import type { CommentSwapOptions } from '../../types';
import QuickCommentSwap from '../types/QuickCommentSwap';
import Filetype from '../types/Filetype';
import CSKind from '../types/CommentSwapKind';

export default function quickTransform(
    source: string,
    opts: CommentSwapOptions,
    filetype: Filetype,
) {
    // @TODO Validate the arguments

    // Initialise `commentSwaps`, which will contain each QuickCommentSwap instance.
    // Initialise `pos`, the current character position in `source`.
    // Get `len`, the number of characters in `source`.
    const commentSwaps: QuickCommentSwap[] = [];
    let pos = 0;
    const len = source.length;

    // Traverse the source code. Fully parsing it into an AST is usually overkill,
    // and (I guess) would be slower.
    // @TODO slowTransform(), for more robust AST processing, which catches edge cases.
    while (pos < len) {

        // Get the start position of the next multiline comment.
        const commentBegin = source.indexOf(
            (filetype === Filetype.Html ? '<!--' : '/*'),
            pos,
        );
        if (commentBegin === -1) break; // no more multiline comments
        pos = commentBegin + (filetype === Filetype.Html
            ? 4 // jump to the character after '<!--'
            : 2 // jump to the character after '/*'
        );

        // Get the end position of the next multiline comment.
        let commentEnd = source.indexOf(
            (filetype === Filetype.Html ? '-->' : '*/'),
            pos,
        );
        if (commentEnd === -1) break; // maybe a malformed multiline comment
        commentEnd += (filetype === Filetype.Html
            ? 3 // the position after the '>'
            : 2 // the position after the '/'
        );
        pos = commentEnd; // jump to the character after the '-->' or '*/'

        // Treat <!--=--> or /*=*/ as a LiteralBefore Comment Swap with no content.
        const charAfterCommentBegin = source[
            commentBegin + (filetype === Filetype.Html ? 4 : 2)
        ];
        const charBeforeCommentEnd = source[
            commentEnd - (filetype === Filetype.Html ? 4 : 3)
        ];
        if (
            charAfterCommentBegin === '=' &&
            commentEnd === commentBegin + (filetype === Filetype.Html ? 8 : 5)
        ) {
            commentSwaps.push(new QuickCommentSwap(
                commentBegin,
                commentEnd,
                filetype,
                CSKind.LiteralBefore,
            ));
            continue;
        }

        // Determine the kind of Comment Swap.
        let kind = CSKind.Absent;
        switch (charAfterCommentBegin) {
            case '=':
                kind = CSKind.LiteralBefore; break;
            case '$':
                kind = CSKind.VariableBefore; break;
        }
        switch (charBeforeCommentEnd) {
            case '=':
                if (kind !== CSKind.Absent) throw Error(
                    `'${CSKind[kind]}' Comment Swap ends '=' (pos ${commentBegin})`);
                kind = CSKind.LiteralAfter; break;
            case '$':
                if (kind !== CSKind.Absent) throw Error(
                    `'${CSKind[kind]}' Comment Swap ends '$' (pos ${commentBegin})`);
                kind = CSKind.VariableAfter; break;
            case '?':
                if (kind !== CSKind.Absent) throw Error(
                    `'${CSKind[kind]}' Comment Swap ends '?' (pos ${commentBegin})`);
                kind = CSKind.TernaryCondition; break;
        }

        // Record the Comment Swap.
        if (kind !== CSKind.Absent) {
            commentSwaps.push(new QuickCommentSwap(
                commentBegin,
                commentEnd,
                filetype,
                kind,
            ));
        }

    }

    // If there are no valid Comment Swaps, return `source` untransformed.
    // @TODO maybe return null if opts.returnNull... will need tests
    if (commentSwaps.length === 0)
        return source;

    // Process each Comment Swap. This will populate the `replacement`, `swapBegin`
    // and `swapEnd` properties.
    for (let i=0, len=commentSwaps.length; i<len; i++) {
        const prevKind = i === 0 ? CSKind.Absent : commentSwaps[i-1].kind;
        const nextCommentSwap = i === len - 1 ? null : commentSwaps[i+1];
        commentSwaps[i].process(opts, source, prevKind, nextCommentSwap);
    }

    // Initialise an array, which will be output as a string.
    const transformedSource = [
        source.slice(0, commentSwaps[0].swapBegin), // before the first Comment Swap
    ];

    // Rebuild the source code using each Comment Swap's replacement value.
    for (let i=0, len=commentSwaps.length; i<len; i++) {

        // Append this Comment Swap's replacement source.
        transformedSource.push(commentSwaps[i].replacement);

        // Append the source between this Comment Swap and the next one. Or if this
        // is the last Comment Swap, just append the remaining source.
        transformedSource.push(
            source.slice(commentSwaps[i].swapEnd, commentSwaps[i+1]?.swapBegin)
        );

    }

    // console.log(commentSwaps+'')
    // console.log(transformedSource.join(''));

    return transformedSource.join('');
}
