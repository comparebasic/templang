/* Copyright (c) 2024 Compare Basic Incorporated

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

see https://templang.org for technical documentation

Sections:

     [Initialized the Framework Object]
*/

function TempLang_Init(templates_el, framework){

    const DEBUG_EVENTS = false;

    const STATE_TEXT = 0;
    const STATE_PRE_KEY = 1;
    const STATE_KEY = 2;

    const DIRECTION_SELF = 3;
    const DIRECTION_PARENT = 4;
    const DIRECTION_CHILD = 5;
    const DIRECTION_DATA = 6;
    const DIRECTION_GLOBAL = 7;
    const DIRECTION_VARS = 9;
    const TYPE_HANDLER = 10;
    const TYPE_REDIR = 11;
    const TYPE_FUNC = 12;
    const TYPE_ELEM = 13;
    const REUSE_AFTER = 14;
    const REUSE_BEFORE = 15;
    const REUSE_SHIFT = 16;
    const SPEC_REDIR = 17;

    const ASSIGN = 1000;
    const EQUAL = 1001;
    const NOT_EQUAL = 1002;

    const DELAY_DRAG_START = 300;

    const FLAG_NODE_STATE_HOVER = 1;
    const FLAG_NODE_STATE_DRAG = 2;
    const FLAG_DRAG_TARGET = 4;
    const FLAG_DROP_TARGET = 8;
    const FLAG_DRAG_CONT_CALCULATED = 16;
    const FLAG_SPLIT = 32;
    const FLAG_VSPLIT = 64;
    const FLAG_SIZE_CALCULATED = 128;

    const COLOR_WHITE = '#fff';
    const COLOR_GREY = '#eee';
    const COLOR_RED = '#f00';
    const COLOR_BLUE = '#66f';
    const COLOR_GREEN = '#090';
    const COLOR_YELLOW = '#ff0';

    /*TODO: remove this temporary variable */
    let splitCount = 1;


    const TRANS_RETRY = 200;

    /* 
     *[Debugging]
     *
     */
     let _debug_el = null;
     function debug(msg, obj, color){
        let el = null;
        let obj_s = '';
        if(!_debug_el){
            console.log(msg, obj);
            return;
        }else{
            el = _debug_el;
            if(obj){
                obj_s = ' | ' + kv_toString(obj);
            }
        }

        const n = document.createElement('DIV');
        if(color){
            n.style.color = color;
        }
        n.style.padding = '4px';
        n.style.margin = 0;
        n.appendChild(document.createTextNode(msg + obj_s + '\n'));
        el.appendChild(n);
     }

     function Debug_SetEl(el){
        _debug_el = el;
     }

     try {

        /* Note: 
         *     Component files are added here by transpiler (or manually for now)
         */

        /*
         * [Initialized the Framework Object]
         */

        /* Setup default styles */
        if(!("_styleSheets" in framework)){
            framework._styleSheets = {};
        }
        if(!GetstyleSheet(null)){
            const sheet = document.createElement('style');
            document.head.appendChild(sheet);
        }

        /* other default stuff */
        if(!("data" in framework)){
            framework.dataCtx = Data_Sub({});
        }

        if(!("funcs" in framework)){
            framework.funcs = {};
        }
        if(!("content" in framework)){
            framework.content = {};
        }
        if(!("templates" in framework)){
            framework.templates = {};
        }

        if(!!('ontouchstart' in window)){
            framework._touch = {started: [], inter: -1, hover: {}}; 
        }

        if(!("_drag" in framework)){
            dragVessel = document.createElement('DIV');
            dragVessel._idtag = 'drag-vessel';
            El_SetStyle(dragVessel, 'position', 'absolute');
            El_SetStyle(dragVessel, 'z-index', '1000');

            dragHighlighter = document.createElement('DIV');
            dragHighlighter.classList.add('drag-highlighter');

            const bodies = document.getElementsByTagName('body');
            if(bodies && bodies[0]){
                const body = bodies[0]
                body._idtag = 'body';
                body.appendChild(dragVessel);
                body.appendChild(dragHighlighter);
                El_SetStyle(body, 'position', 'relative');
            }


            framework._drag = {
                vessel_el: dragVessel,
                highlighter_el: dragHighlighter,
                spacer_templ: null,
                spacers: {},
                byName: {},
                ev: null
            };

            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
            window.addEventListener('mousedown', onDown);
        }

        ResetCtx({});
        const root = document.documentElement;

        root.vars = {};
        root.varSetters = {};
        root._idtag = 'root';
        root.templ = { 
                on: { resize: Spec_Parse('size')},
                /* blank */
                nodeName: "_WINDOW",
                name: "",
                isMerged: false,
                flags: 0,
                el: document.documentElement,
                asKey: null,
                funcs: {},
                forKey: null,
                dataKey: null,
                withkey: null,
                mapVars: {},
                children:  [],
                body: "",
                classIfCond: {},
                baseStyle: '',
                setters: [],
                _misc: {},

        };

        framework._ctx.root = root;

        window.onresize = function(e){
            onResize.call(framework._ctx.root, e);
        };

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

        if(framework.templates['DRAG-SPACER']){
            framework._drag.spacer_templ = framework.templates['DRAG-SPACER'];
        }
        AddStyle(null, '.full-height{height: '+ window.innerHeight + 'px}');
        AddStyle(null, '.full-width{width: '+ window.innerWidth + 'px}');
        AddStyle(null, '.templ-hide-if{ display: none !important;}');

    }catch(e){
        debug('ERROR: ' + String(e), null, COLOR_RED);
        throw e;
    }

    /* Amend relevant public properties to the framework object */
    framework.content_idx = 0;
    framework.el_idx = 0;
    framework.Make = Make;
    framework.Injest = Injest;
    framework.Cash = Cash;
    framework.ChangeStyle = ChangeStyle;
    framework.AddStyle = AddStyle;
    framework.AddStyle = AddStyle;
    framework.Data_Set = Data_Set;
    framework.Debug_SetEl = Debug_SetEl;
}
