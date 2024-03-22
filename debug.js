var DEBUG_VARS_GATHER = false;

var debug_el_li = [
    "preview",
    "preview-item",
];

var varDebug_el_li = [
    "type",
];

function El_IsDebug(node){
    if(node.templ && debug_el_li.indexOf(node.templ.name) != -1){
        return true;
    }
    return false;
}

function Templ_IsDebug(templ){
    if(templ && (typeof templ == 'string' && debug_el_li.indexOf(templ) ||  debug_el_li.indexOf(templ.name) != -1)){
        return true;
    }
    return false;
}

function Var_Debug(varname){
    if(varDebug_el_li.indexOf(varname) != -1){
        return true;
    }
    return false;
}
