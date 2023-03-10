import test from 'ava';
import { quickTransformCss } from '../dist/es/index.js';

test('quickTransformCss() ok: No Comment Swaps', t => {
    const boringSource = 'h1 { color:red }';
    t.is(quickTransformCss(boringSource), boringSource);
    t.is(quickTransformCss(boringSource, { returnNull:true }), null);
});

test('quickTransformCss() ok: Object with toString()', t => {
    const obj = {
        toString() {
            return '/* h2 =*/ h1 { color:/*blue=*/red }';
        }
    };
    t.is(quickTransformCss(obj), ' h2 { color:blue }');
});

test('quickTransformCss() ok: Literal', t => {
    const literalAfter  = '/* h2 =*/ h1 { color:/*blue=*/red }';
    const literalBefore = ' h1/*=h2*/ { color:red /*= blue */}';
    const literalEmpty = 'article/*=*/ h2 { /*hullo*//*=*/color:blue }';
    const literalOk = ' h2 { color:blue }';

    t.is(quickTransformCss(literalAfter, { returnNull:true }), literalOk);
    t.is(quickTransformCss(literalAfter), literalOk); // defaults to `returnNull:false`
    t.is(quickTransformCss(literalBefore), literalOk);
    t.is(quickTransformCss(literalEmpty), literalOk);
});

test('quickTransformCss() ok: Ternary Literal', t => {
    const ternaryAlmostEmptyConditionLiteral = '/* \t\n ?*/ h1 /*= h2 */{ color:/* ?*/red/*=blue*/ }';
    const ternaryEmptyConditionLiteral = '/*?*/ h1 /*= h2 */{ color:/*?*/red/*=blue*/ }';
    const ternaryFalseyConditionLiteral = '/* falsey ?*/ h1 /*= h2 */{ color:blue }';
    const ternaryMissingConditionLiteral = '/* missing ?*/ h1 /*= h2 */{ color:blue }';
    const ternaryTruthyConditionLiteral = '/* truthy ?*/ h2 /*= h1 */{ color:blue }';
    const ternaryOk = ' h2 { color:blue }';

    t.is(quickTransformCss(ternaryAlmostEmptyConditionLiteral), ternaryOk);
    t.is(quickTransformCss(ternaryEmptyConditionLiteral), ternaryOk);
    t.is(quickTransformCss(ternaryFalseyConditionLiteral, { $:{ falsey:'' } }), ternaryOk);
    t.is(quickTransformCss(ternaryMissingConditionLiteral), ternaryOk);
    t.is(quickTransformCss(ternaryTruthyConditionLiteral, { $:{ truthy:[] } }), ternaryOk);
});

test('quickTransformCss() ok: Ternary Variable', t => {
    const ternaryEmptyConditionVariable =
        ' /* \t\n ?*/h1/*$ heading */ { color:/*?*/red/*$ shade */ }';
    const ternaryFalseyConditionVariable =
        '/* falsey ?*/ h1 /*$ headingSpc */{ color:/*nonesuch?*/red /*$shadeSpc*/}';
    const ternaryTruthyConditionVariable =
        '/* truthy ?*/ h2 /*$ shade */{ color:/* shade ?*/blue/*$falsey*/ }';
    const ternaryVariableDoesNotExist =
        ' /* falsey?*/h2/*$ nonesuch */ { color:/* ?*/blue/*$nonesuch*/ }';
    const ternaryOk = ' h2 { color:blue }';
    const opts = {
        $:{ falsey:'', heading:'h2', headingSpc:' h2 ', shade:'blue' , shadeSpc:'blue ', truthy:[] }
    };

    t.is(quickTransformCss(ternaryEmptyConditionVariable, opts), ternaryOk);
    t.is(quickTransformCss(ternaryFalseyConditionVariable, opts), ternaryOk);
    t.is(quickTransformCss(ternaryTruthyConditionVariable, opts), ternaryOk);
    t.is(quickTransformCss(ternaryVariableDoesNotExist, opts), ternaryOk);
});

test('quickTransformCss() ok: Variable', t => {
    const variableAfter = '/* heading $*/ h1 { color:/*shade$*/red }';
    const variableBefore = ' h1/*$heading*/ { color:red /*$ shade */}';
    const variableNonesuch = '/* nonesuch $*/ h2 { color:blue /*$ nonesuch */}';
    const variableNumeric = ' h/* numeric $*/1 { color:blue }';
    const variableOk = ' h2 { color:blue }';
    const opts = {
        $:{ heading:'h2', numeric:2, shade:'blue' }
    };

    t.is(quickTransformCss(variableAfter, opts), variableOk);
    t.is(quickTransformCss(variableBefore, opts), variableOk);
    t.is(quickTransformCss(variableNonesuch, opts), variableOk);
    t.is(quickTransformCss(variableNumeric, opts), variableOk);
});

test('quickTransformCss() ok: CSS Selector', t => {
    const comma1    = '/* h4, h3 =*/h1, h2   { color:red }';
    const comma1ok  = 'h4, h3   { color:red }';
    const comma2    = 'a,p/*=q*/{}';
    const comma2ok  = 'q{}';
    const comma3    = 'div/*?*/, span/*=*/ {}';
    const comma3ok  = 'div {}';

    t.is(quickTransformCss(comma1), comma1ok);
    t.is(quickTransformCss(comma2), comma2ok);
    t.is(quickTransformCss(comma3), comma3ok);

    const id1    = ' /*  #prod  =*/  #dev{ color:red }';
    const id1ok  = '   #prod{ color:red }';
    const id2    = 'a{color:blue}  h2#dev   /*= h1#prod */ { color:red }';
    const id2ok  = 'a{color:blue}  h1#prod    { color:red }';
    const id3    = 'div/*?*/#dev/*=#prod*/ {}';
    const id3ok  = 'div#prod {}';

    t.is(quickTransformCss(id1), id1ok);
    t.is(quickTransformCss(id2), id2ok);
    t.is(quickTransformCss(id3), id3ok);

    const class1     = 'ul.big/*.prod.ok=*/.dev.error { color:red }';
    const class1ok   = 'ul.big.prod.ok { color:red }';
    const class2     = 'a{color:blue}\tul.big.dev.error/*=div.big.prod.ok*/{ color:red }';
    const class2ok   = 'a{color:blue}\tdiv.big.prod.ok{ color:red }';
    const class3bad  = 'ul.big./*?*/dev./*=prod.*/ok {color:red}'; // css(css-identifierexpected), though browsers do display it
    const class3good = 'ul.big/*?*/.dev/*=.prod*/.ok {color:red}'; // this is the proper syntax
    const class3ok   = 'ul.big.prod.ok {color:red}';

    t.is(quickTransformCss(class1), class1ok);
    t.is(quickTransformCss(class2), class2ok);
    t.is(quickTransformCss(class3bad), class3ok);
    t.is(quickTransformCss(class3good), class3ok);

    const misc1    = '/* x-prod =*/\f\r\t\na#b.c[d="e"]\n\t\r\f{ color:red }';
    const misc2    = '\f\r\t\na#b.c[d="e"]\n\t\r\f/*= x-prod */{ color:red }';
    const misc3    = '\f\r\t\n/*?*/a#b.c[d="e"]:hover/*=x-prod*/\n\t\r\f{ color:red }';
    const miscok   = '\f\r\t\nx-prod\n\t\r\f{ color:red }';

    t.is(quickTransformCss(misc1), miscok);
    t.is(quickTransformCss(misc2), miscok);
    t.is(quickTransformCss(misc3), miscok);

    const pseudo1    = '/* b, x-prod =*/a, x-dev:hover { color:red }';
    const pseudo1ok  = 'b, x-prod:hover { color:red }';
    const pseudo2    = '  input:\fhover >div\t\t/*= focus*/{ color:red }';
    const pseudo2ok  = '  input:\ffocus\t\t{ color:red }';
    const pseudo3    = 'input/*?*/:hover/*=.focusable:focus\f\r*/{ color:red }';
    const pseudo3ok  = 'input.focusable:focus\f\r{ color:red }';

    t.is(quickTransformCss(pseudo1), pseudo1ok);
    t.is(quickTransformCss(pseudo2), pseudo2ok);
    t.is(quickTransformCss(pseudo3), pseudo3ok);
});

test('quickTransformCss() ok: CSS Properties', t => {
    const property1     = 'h1 { /* color =*/\f\nbackground-color \t\ :red }';
    const property1ok   = 'h1 { \f\ncolor \t\ :red }';
    const property2     = 'h1 {\r\tbackground-color\f\n/*=outline-color*/ :red }';
    const property2ok   = 'h1 {\r\toutline-color\f\n :red }';
    const property3bad  = 'h1 {/*?*/background/*=\toutline*/-color:red }'; // browsers do not display this
    const property3good = 'h1 {/*?*/background-color/*=\toutline-color*/:red }'; // this is the proper syntax
    const property3ok   = 'h1 {\toutline-color:red }';

    t.is(quickTransformCss(property1), property1ok);
    t.is(quickTransformCss(property2), property2ok);
    t.is(quickTransformCss(property3bad), property3ok);
    t.is(quickTransformCss(property3good), property3ok);
});

test('quickTransformCss() ok: CSS Values', t => {
    const value1     = 'h1 { color:/* red =*/\fblue; top:0 }';
    const value1ok   = 'h1 { color:\fred; top:0 }';
    const value2     = 'h1 { color:rgb(1,2,3)/*= red */ }';
    const value2ok   = 'h1 { color:red }';
    const value3bad  = 'h1 { color:pale/*?*/green/*=goldenrod*/ }'; // browsers do not display this
    const value3good = 'h1 { color:/*?*/palegreen/*=palegoldenrod*/ }'; // this is the proper syntax
    const value3ok   = 'h1 { color:palegoldenrod }';

    t.is(quickTransformCss(value1), value1ok);
    t.is(quickTransformCss(value2), value2ok);
    t.is(quickTransformCss(value3bad), value3ok);
    t.is(quickTransformCss(value3good), value3ok);
});

test('quickTransformCss() ok: @import', t => {
    const import1opts = { $:{ urlAndMedia:'url("prod.css") print, screen' } };
    const import1     = '@import/* urlAndMedia $*/ url("dev.css") print;';
    const import2opts = { $:{ importUrl:'@import url("prod.css")' } };
    const import2     = '@import url("dev.css") /*$ importUrl */print, screen;';
    const import3opts = { $:{ isDev:false, url:'url("prod.css")' } };
    const import3     = '@import /* isDev ?*/url("dev.css")/*$ url */ print, screen;';
    const importOk    = '@import url("prod.css") print, screen;';

    t.is(quickTransformCss(import1, import1opts), importOk);
    t.is(quickTransformCss(import2, import2opts), importOk);
    t.is(quickTransformCss(import3, import3opts), importOk);
});

test('quickTransformCss() ok: @media', t => {
    const media1opts = { $:{ property:'min-width' } };
    const media1     = '@media screen and (/* property $*/min-height: 900px) { }';
    const media2opts = { $:{ value:'900px' } };
    const media2     = '@media screen and (min-width: 900px/*$ value */) { }';
    const media3opts = { $:{ pdfMode:false, media:'screen' } };
    const media3     = '@media /*pdfMode?*/print/*$media*/ and (min-width: 900px/*$ value */) { }';
    const mediaOk    = '@media screen and (min-width: 900px) { }';

    t.is(quickTransformCss(media1, media1opts), mediaOk);
    t.is(quickTransformCss(media2, media2opts), mediaOk);
    t.is(quickTransformCss(media3, media3opts), mediaOk);
});

test('quickTransformCss() ok: remove comments', t => {
    const comments   = 'h1 { color:green /*?*//* green means go *//*=*/}';
    const commentsOk = 'h1 { color:green }';
    t.is(quickTransformCss(comments), commentsOk);
});
