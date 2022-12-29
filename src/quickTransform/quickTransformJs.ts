import type { CommentSwapOptions } from '../../types';

export default function quickTransformJs(
    _opts: CommentSwapOptions,
    code: string,
) {
    return `${code}\n/* @TODO quickTransformJs() */`;
}
