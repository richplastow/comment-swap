import type { CommentSwapOptions } from '../../types';
import Filetype from '../types/Filetype';
import qikTransform from './quickTransform';
import { sourceContainsCssJsCommentSwap } from '../utils';

/**
 * Injects selectors, properties and values from ‘Comment Swap’ block comments into CSS.
 *
 * @param {string} source -
 *   The source CSS code
 * @param {CommentSwapOptions} [opts={}] -
 *   An optional options object. See `CommentSwapOptions` in comment-swap/types/index.d.ts
 * @returns The transformed CSS as a string (or `null` if `opts.returnsNull` is `true` and no Comment Swaps were found)
 * @throws A standard JavaScript `Error` object, whose `message` property describes the problem
 */
export default function quickTransformCss(
    source: string,
    opts: CommentSwapOptions = {},
) {
    // Only process CSS which contains at least one of these strings:
    //     /*=   =*/   /*$   $*/   ?*/
    // At least one of these will be present if `source` has Comment Swaps.
    if (! sourceContainsCssJsCommentSwap(source))
        return opts.returnNull ? null : source;

    return qikTransform(source, opts, Filetype.Css);
}
