// Tests whether `source` contains at least one of the following five strings:
//     /*=   =*/   /*$   $*/   ?*/
// At least one of these will be present in CSS or JS which uses Comment Swaps.
export function sourceContainsCssJsCommentSwap(
    source: string
): boolean {
    for (const str of ['/*=', '=*/', '/*$', '$*/', '?*/'])
        if (source.indexOf(str) !== -1)
            return true;
    return false;
}

// Tests whether `source` contains at least one of the following five strings:
//     <!--=   =-->   <!--$   $-->   ?-->
// At least one of these will be present in HTML which uses Comment Swaps.
export function sourceContainsHtmlCommentSwap(
    source: string
): boolean {
    for (const str of ['<!--=', '=-->', '<!--$', '$-->', '?-->'])
        if (source.indexOf(str) !== -1)
            return true;
    return false;
}
