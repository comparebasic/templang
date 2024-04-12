/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation
*/

    /*
     * [Initialized the Framework Object]
     */
    if(typeof framework.funcs === 'undefined'){
        framework.funcs = {};
    }
    if(typeof framework.templates === 'undefined'){
        framework.templates = {};
    }
    if(typeof framework._styleSheets === 'undefined'){
        framework._styleSheets = {};
    }

    ResetCtx({});

    /* Parse templates from the elment in the page */
    if(templates_el){
        var nodes = templates_el.childNodes;
        for(var i = 0, l = nodes.length; i < l;i++){
            var el = nodes[i];
            if(el.nodeType == Node.ELEMENT_NODE){
                Templ_Parse(el, null);
            }
        }
    }

    /* Setup default styles */
    if(!GetstyleSheet(null)){
        const sheet = document.createElement('style');
        document.head.appendChild(sheet);
    }

    AddStyle(null, '.full-height{height: '+ window.innerHeight + 'px}');
    AddStyle(null, '.full-width{width: '+ window.innerHeight + 'px}');

    /* Amend relevant public properties to the framework object */
    framework.content_idx = 0;
    framework.el_idx = 0;
    framework.Make = Make;
    framework.Injest = Injest;
    framework.Cash = Cash;
    framework.ChangeStyle = ChangeStyle;
    framework.AddStyle = AddStyle;
