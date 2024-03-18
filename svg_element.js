function sizeOutlineBox(textElem, outline) {
    var textPadding = 2;
    var bounds = textElem.getBBox();
    domSetAtt(outline,'x',(bounds.x - textPadding) + "px");
    domSetAtt(outline, 'y', (bounds.y - textPadding) + "px");
    domSetAtt(outline, 'height', (bounds.height + textPadding * 2) + "px");
    domSetAtt(outline, 'width', (bounds.width + textPadding * 2) + "px");
}

function makeTextBox(props, updateFunc) {
    var textBox = svgElem('text', props);
    domOnClick(textBox, function onClick(e) {
        console.log(e);
        var elem = e.currentTarget;
        var outline = svgElem('rect', {
            stroke: "rgb(0,0,0)",
            fill: "transparent"
        });
        sizeOutlineBox(elem, outline);

        domAdd(outline, e.currentTarget.parentElement);

        e.currentTarget.firstChild.nodeValue = "";
        document.body.style.cursor = "text";
        window.onkeydown =  function onKeyDown(e) {
            if (e.keyCode === 13) {
                updateFunc(elem.firstChild.nodeValue);
                window.onkeydown = null;
                domDel(outline);
                document.body.style.cursor = "default";

                return;
            }
            elem.firstChild.nodeValue += e.key;
            sizeOutlineBox(elem, outline);
        }
    });
    return textBox;t
}
