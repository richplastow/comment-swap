/**
 * An object containing options, passed as the second argument to `quickTransformCss()`,
 * `quickTransformHtml()` and `quickTransformJs()`.
 */
export interface CommentSwapOptions {
    /** An optional boolean which specifies what to return if no Comment Swaps are found in `source`.  
     *  If `false` (default), `source` is returned.  
     *  If `true`, `null` is returned */
    returnNull?: boolean;
    /** An optional object containing values which ‘Variable’ and ‘Ternary Condition’
     *  Comment Swaps can access */
    $?: Object;
}

/**
 * An object which contains a `toString()` method.
 */
export interface Stringable {
    /** A method which returns a string. JavaScript code like `foo+''` automatically calls this. */
    toString(): string;
}

/**
 * Injects selectors, properties and values from ‘Comment Swap’ block comments into CSS.
 *
 * @param {string|Stringable} source -
 *   The source CSS code. A string, or an object with a `toString()` method
 * @param {CommentSwapOptions} [opts={}] -
 *   An optional options object. See `CommentSwapOptions` in comment-swap/types/index.d.ts
 * @returns The transformed CSS as a string (or `null` if `opts.returnsNull` is `true` and no Comment Swaps were found)
 * @throws A standard JavaScript `Error` object, whose `message` property describes the problem
 */
export default function quickTransformCss(
    source: string | Stringable,
    opts?: CommentSwapOptions
): string | null;

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
    opts?: CommentSwapOptions
): string | null;

/**
 * Injects code, markup and values from ‘Comment Swap’ block comments into JavaScript.
 *
 * @param {string|Stringable} source -
 *   The source JavaScript code. A string, or an object with a `toString()` method
 * @param {CommentSwapOptions} [opts={}] -
 *   An optional options object. See `CommentSwapOptions` in comment-swap/types/index.d.ts
 * @returns The transformed JavaScript as a string (or `null` if `opts.returnsNull` is `true` and no Comment Swaps were found)
 * @throws A standard JavaScript `Error` object, whose `message` property describes the problem
 */
export default function quickTransformJs(
    source: string | Stringable,
    opts?: CommentSwapOptions
): string | null;
