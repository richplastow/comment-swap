import type { CommentSwapOptions } from '../../types';

export default function quickTransformHtml(
    _opts: CommentSwapOptions,
    code: string,
) {
    return `${code}\n/* @TODO quickTransformHtml() */`;
}
