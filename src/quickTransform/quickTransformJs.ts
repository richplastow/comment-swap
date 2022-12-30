import type { CommentSwapOptions } from '../../types';
import Filetype from '../types/Filetype';
import qikTransform from './quickTransform';
import { sourceContainsCssJsCommentSwap } from '../utils';

export default function quickTransformJs(
    source: string,
    opts: CommentSwapOptions = {},
) {
    // Only process JavaScript which contains at least one of these strings:
    //     /*=   =*/   /*$   $*/   ?*/
    // At least one of these will be present if `source` has Comment Swaps.
    if (! sourceContainsCssJsCommentSwap(source))
        return opts.returnNull ? null : source;

    return qikTransform(source, opts, Filetype.Js);
}
