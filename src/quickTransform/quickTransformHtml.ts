import type { CommentSwapOptions, Stringable} from '../../types';
import Filetype from '../types/Filetype';
import qikTransform from './quickTransform';
import { sourceContainsHtmlCommentSwap } from '../utils';

/**
 * Injects text and markup from ‘Comment Swap’ block comments into HTML.
 *
 * @param {string|Stringable} source -
 *   The source HTML markup. A string, or an object with a `toString()` method
 * @param {CommentSwapOptions} [opts={}] -
 *   An optional options object. See `CommentSwapOptions` in comment-swap/types/index.d.ts
 * @returns The transformed HTML as a string (or `null` if `opts.returnsNull` is `true` and no Comment Swaps were found)
 * @throws A standard JavaScript `Error` object, whose `message` property describes the problem
 */
export default function quickTransformHtml(
    source: string | Stringable,
    opts: CommentSwapOptions = {},
) {
    // Make sure `source` is a string.
    // Makes config more succinct when using rollup-plugin-copy, for example.
    const sourceStr = source.toString();

    // Only process HTML which contains at least one of these strings:
    //     <!--=   =-->   <!--$   $-->   ?-->
    // At least one of these will be present if `source` has Comment Swaps.
    if (! sourceContainsHtmlCommentSwap(sourceStr))
        return opts.returnNull ? null : sourceStr;

    return qikTransform(sourceStr, opts, Filetype.Html);
}
