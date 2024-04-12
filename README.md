# TempLang

Web template framework. Bring event routing and element creation together quickly and completely. 


##  Licence

MIT licence owned by (Compare Basic Incorporated)[https://comparebasic.com]


## TempLang: Documentation

see https://templang.org for an example of the framework


### Public API:

    ```
    Templag_Init(templates_el, framework) -> undefined
       - templates_el: this is the root node that contains HTML template tags
         to use with TempLang 
       - framework: this is an empty object that will be filled in with the
         TempLang public API functions

        upon success the "framework" object will have been modified to contain
        the following:

            {
                Make: Make,
                Injest: Injest,
                Cash: Cash,
            }

        The `templang` object that you have passed in can be analyzed as you
        work, there is a lot of iformation in the templang._ctx object if you
        are interested.

    Make(templ, parent_el, data) -> undefined
        - templ: string or template object that was added to framework.templates
        - parent_el: where to place the newly created element
        - data: data used to populate the nodes that are designated by the "templ"

    Injest(content) -> undefined
        - content: an array that will be tagged with tracking properties such
          as _idscope, and _idtag that are used internally by TempLang

    Cash(s, data) -> string
        - s: string to parse in the form of "Hi there ${prop}"
        - data: a data object with data used to fill the cash string
    ```
