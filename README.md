# TempLang

Web template framework. Bring event routing and element creation together quickly and completely. 


##  Licence

MIT licence owned by (Compare Basic Incorporated)[https://comparebasic.com]


## TempLang: Documentation

see https://templang.org for an example of the framework


### Public API:

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


# Repository Layout

##  Deploy File

Status: Not Ready for much

Please use this as an inspirational system for a while, this will change as we deploy products on it, but it is not yet ready for production use.

[Deploy file: src/deploy/templang.js](src/deploy/templang.js)


##  Development Files

The development files have been split out by section, for easy browsing


### Sections:

#### Internal Stuff:

 - [Elem Query and Match](src/devel/templang_query.js)
 - [Helper Functions](src/devel/templang_helpers.js)
 - [Data And Context Functions](src/devel/templang_data.js)
 - [Setters Run and Register](src/devel/templang_setters.js)
 - [Parsing Templates](src/devel/templang_parse.js)
 - [Events Native and Synthetic](src/devel/templang_events.js)
 - [Bind and Assign Browser Events](src/devel/templang_bind_ev.js)


#### External Stuff:

 - [Styles and Stylesheet Management](src/devel/templang_styles.js)
 - [Cash Variable-in-strin Parser](src/devel/templang_cash.js)
 - [Injest and Tag Data](src/devel/templang_injest.js)
 - [Core Functions For Element Creation](src/devel/templang_element.js)
 - [Initialized the Framework Object](src/devel/templan_init.js)
