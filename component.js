import {dlog} from './op.app'
import { _exists, parseString, _default } from "./functions";
import $ from 'jquery'

/**
 * A simple frontend component, somewhat similar to React component.
 */
export default class hComponent {

    /**
     * 
     * @param {string|object} tpl selector or DOM element to copy and use as template.
     * By default, variable placeholders in template are marked by variable name within double percents: %%varname%%
     * you can use your own attribute handlers to populate template. Override/append hanlders with setAttributesHandlers() 
     * @param {*} data data to populate template
     * @param {*} params additional parameters. accepts: {array} eventList - list of additional events to handle.
     */
    constructor( tpl, data, params ){
        this.tpl = tpl;
        this.state = data;
        this._element = null;

        
        /**
        * list of events to handle with this.event().
        * The argument of "on{event}" attribute is the name of method to call.
        * E.g. <button onclick="handleClick">Handle it</button> will call descendant's handleClick() method and pass the element to it
        */
        this.eventList = ['click', 'Click', 'change', 'Change', 'input', 'Input', 'keyup', 'keydown', 'mousein', 'mouseout']

        this.rules = {
            /**
             * List of attributes and callbacks to call when attribute is found
             */
            attributes:{}, 
            
            //  events :{}
        }

        params = _default( params, {} )

        // default attributes handlers
        this.setAttributesHandlers( 
            { 
                foreach: this.foreach.bind(this)
            }
        )

        // optional override of event list
        if(params.eventList){
            // merge two arrays and remove duplicates
            this.eventList = Array.from( new Set( this.eventList.concat(params.eventList) ) );
            dlog("merged ", params.eventList, ", recieved ", this.eventList )
        }

    }

    /**
     * Set/override attribute handlers.
     * Call it in descendants after super() call to append/override attribute handlers
     * @param {object} handlers  object of { attibute_name : callback, ... }
     */
    setAttributesHandlers( handlers ){
        this.rules.attributes = Object.assign(this.rules.attributes, handlers );
    }

    setState( data, doRender = false ){
        // overwrite values in state
        this.state = Object.assign( this.state, data );      
        
        if(doRender) this.render();
    }

    event( el, attribute ){
        const value = $(el).attr(attribute)
        dlog( "event", el, attribute, this[value] );
        // $(el)[0].addEventListener( attribute, this[value].bind(this) ) // event listener function name is the value of attribute
       //  dlog( "calling event handler", attribute, value,   this[value], this );

       if( typeof this[value] === 'function' ){
           $(el).on( attribute, this[value].bind(this) ) // event listener function name is the value of attribute
       } else {
           dlog(`Warning: component event handler '${value}' not found for event '${attribute}'`);
       }
    }

    foreach( el, attribute ){
        dlog("component foreach called")
        let html = "";                
        
        const value = $(el).attr(attribute) // atribute value points to variable in state to fetch the items from.
        const items = this.state[value]; 
        dlog("component foreach", items, el );
        
        if( items ){
            for( let ind in items ){
                const item = items[ind];
                let itemHtml = $(el)[0].outerHTML;

                // add item index to item
                item["__INDEX"] = ind;

                dlog("foreach appending item", item, $(itemHtml)[0].outerHTML );
                itemHtml = parseString( itemHtml , item);
                
                html += itemHtml;
                dlog("foreach item html", itemHtml );
                
                dlog("foreach increment html", html );
            }            
        }
        

        dlog( "foreach result", html );
        // (el).append( $(html) );
        return html;
    }

    parseTpl(){

        let html;
        const tpl =  $(this.tpl)[0];
        if( tpl ){

            dlog("Parsing component tpl");
            html = tpl.cloneNode(true);
    
            // parse attributes
            for( let attribute in this.rules.attributes){
                const callback = this.rules.attributes[attribute];
                $( `[${attribute}]`, html ).each( (ind, item) => {
                    dlog( "component parsing attr", attribute, html );
                    
                    // call callback
                    $(item)[0].outerHTML = callback(item, attribute ) ;
                    
                })
            }
    
            dlog("after parsing attributes", html );
    
            // parse values
            html = parseString(  $(html)[0].outerHTML , this.state );        
    
            html = $.parseHTML(html);
    
            // parse event attributes (it has to be done after the template text is finished and no more changes will be done)            
            for( let eventName of this.eventList ){
                dlog( "parsing event", eventName, "on", html )                                            
                $( `[${eventName}]`, html ).each( (ind, item) => {
                    dlog( "component parsing attr", eventName, html );                                        
                    
                    // handle the event
                    this.event(item, eventName )             

                    // remove the attribute altogether
                    $(item)[0].removeAttribute(eventName)
                })
            }
    
            dlog("after parsing events", html );
        } else {
            html = $(`<div>Could not find template selector  '${this.tpl}' in document</div>`);
        }

        return $(html);
    }
    

    render(){              
        
        const html =  this.parseTpl();

        // if html is stored, replace it in situ
        if( this._element ){
            $(this._element).replaceWith(html);    
        }

        this._element = html; // store pointer to rendered html
        return html;
    }
}