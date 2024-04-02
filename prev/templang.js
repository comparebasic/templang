var FLAG_INITIALIZED = 1;
var FLAG_UPDATE = 2;
var FLAG_HAS_DRAG = 4;
var FLAG_DRAG_CONTAINER = 8;
var FLAG_CONTAINER = 16;
var FLAG_DRAG_CONT_CALCULATED = 32;
var FLAG_CONTENT_INJESTED = 64;

var STATE_TEXT = 0;
var STATE_PRE_KEY = 1;
var STATE_KEY = 2;

var QUERY_SELF = 1;
var QUERY_PARENTS = 2;
var QUERY_CHILDREN = 4;

var EVENT_QUERY = 16;
var ELEM_QUERY = 17;

var _styleSheets = {};
function GetstyleSheet(sheet_s){
    var name_s = sheet_s;
    if(sheet_s === null){
        name_s === 'default';
    }
    if(_styleSheets[name_s]){
        return _styleSheets[name_s];
    }
    for(var i = 0; i < document.styleSheets.length; i++){
        var s = document.styleSheets[i];
        if(!sheet_s && !s.href){
            _styleSheets[name_s] = {sheet: s, cls: {}};
            return _styleSheets[name_s];
        }else if(s.href){
            if(s.href && s.href.substring(s.href.length - sheet_s.length) === sheet_s){
                _styleSheets[sheet_s] = {sheet: s, cls: {}};
                return _styleSheets[sheet_s];
            }
        }
    }
    return null;
}

function GetStyleRule(sheetObj, cls){
    if(sheetObj.cls[cls]){
        return sheetObj.cls[cls];
    }
    for(var i = 0; i < sheetObj.sheet.rules.length; i++){
        var rule = sheetObj.sheet.rules[i];
        if(rule.selectorText == cls){
            sheetObj.cls[cls] = rule;
            return rule;
        }
    }
    return null;
}

function changeStyles(sheet_s, name, att, value){
    var sheetObj = GetstyleSheet(sheet_s);
    console.log("FOUND SHEET", sheetObj);
    if(sheetObj){
        var rule = GetStyleRule(sheetObj, name);
        rule.style[att] = value;
    }
}
