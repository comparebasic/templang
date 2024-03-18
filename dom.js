function domById(_id, _parent) { var parent = _parent || document; return parent.getElementById(_id);}
function domByClassName(cls){ return document.getElementsByClassName(cls);}
function domByTagName(tag){ return document.getElementsByTagName(tag);}
function domNewFragment(){ return document.createElementFragment();}
function domAdd(child, elem){elem.appendChild(child);} 
function domClear(elem){ elem.innerHTML = "";} 
function domSetContent(content, elem){ elem.innerHTML = content;} 
function domNewText(content){ return document.createTextNode(content);} 
function domOnLoad(elem, func){ return elem.addEventListener('load', func);} 
function domOnClick(elem, func){ return elem.addEventListener('click', func);} 
function domOnKeyDown(elem, func){ return elem.addEventListener('keydown', func);} 
function domOnBlur(elem, func){ return elem.addEventListener('blur', func);} 
function domOnMouseOver(elem, func){ return elem.addEventListener('mouseover', func);} 
function domNoPropagate(ev){ return ev.stopPropagation();} 
function domNoDefault(ev){ return ev.preventDefault();} 
function domDel(_node){ return _node.parentNode.removeChild(_node);} 
var propMutation = {fontSize: "font-size", fontWeight: "font-weight"};
function domSetAtt(elem, name, _value) {
    name = propMutation[name] || name; return elem.setAttribute(name, _value);
}
function domSetAttNS(elem, name, _value) { return elem.setAttributeNS(null, name, _value);}
function underscoresToDash(props) {
    var _key;
    for (_key in props) {
        if (_key.includes('_')) {
            props[_key.replaceAll('_', '-')] = props[_key];
            delete props[_key];
        }
    }
}

function domNewElem(tagName, props) {
    var elem = document.createElement(tagName);
    if (props) {
        var _key;
        for (_key in props) {
            domSetAtt(elem, _key, props[_key]);
        }
    };
    return elem;
} 
function svgElem(elemName, props) {
    underscoresToDash(props);
    var elem = document.createElementNS("http://www.w3.org/2000/svg", elemName);
    if (props) {
        var _key;
        for (_key in props) {
            domSetAtt(elem, _key, props[_key]);
        }
    };
    return elem;
}

