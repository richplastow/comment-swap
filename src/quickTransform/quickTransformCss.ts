import type { CommentSwapOptions } from '../../types';

export default function quickTransformCss(
    _opts: CommentSwapOptions,
    code: string,
) {
    return `${code}\n/* @TODO quickTransformCss() */`;
}
