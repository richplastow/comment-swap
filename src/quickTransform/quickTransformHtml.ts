import type { CommentSwapOptions } from '../../types';
import Filetype from '../types/Filetype';
import qikTransform from './quickTransform';
import { sourceContainsHtmlCommentSwap } from '../utils';

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
