import type { CommentSwapOptions } from '../../types';
import Filetype from '../types/Filetype';
import qikTransform from './quickTransform';
import { sourceContainsHtmlCommentSwap } from '../utils';

/**
 * Injects text and markup from ‘Comment Swap’ block comments into HTML.
 *
 * @param {string} source -
 *   The source HTML markup
 * @param {CommentSwapOptions} [opts={}] -
 *   An optional options object. See `CommentSwapOptions` in comment-swap/types/index.d.ts
 * @returns The transformed HTML as a string (or `null` if `opts.returnsNull` is `true` and no Comment Swaps were found)
 * @throws A standard JavaScript `Error` object, whose `message` property describes the problem
 */
export default function quickTransformHtml(
    source: string,
    opts: CommentSwapOptions = {},
) {
    // Only process HTML which contains at least one of these strings:
    //     <!--=   =-->   <!--$   $-->   ?-->
    // At least one of these will be present if `source` has Comment Swaps.
    if (! sourceContainsHtmlCommentSwap(source))
        return opts.returnNull ? null : source;

    return qikTransform(source, opts, Filetype.Html);
}
