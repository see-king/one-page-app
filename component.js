import {dlog} from './op.app'
import { _exists, parseString, _default } from "one-page-app/functions";
import $ from 'jquery'

/**
 * A simple frontend component, somewhat similar to React component.
 */
export default class hComponent {

    constructor( tpl, data ){
        this.tpl = tpl;
        this.state = data;
        this._element = null;

        this.eventList = ['click', 'Click', 'change', 'Change', 'input', 'Input', 'keyup', 'keydown', 'mousein', 'mouseout']

        this.rules = {
            attributes:{
                foreach: this.foreach.bind(this),        
            },

            events :{

            }
        }

        // send all events to this.event()
        for( let i in this.eventList ){            
            this.rules.events[ this.eventList[i] ] = this.event.bind(this)
        }
        dlog("events added", this.rules.events);
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
        dlog("Parsing component tpl");
        let html = $(this.tpl)[0].cloneNode(true);

        // parse attributes
        for( let attribute in this.rules.attributes){
            const callback = this.rules.attributes[attribute];
            $( `[${attribute}]`, html ).each( (ind, item) => {
                dlog( "component parsing attr", attribute, html );
                // call callback
                $(item)[0].outerHTML = callback(item, attribute ) ;
                // remove the attribute altogether
                // $(item)[0].removeAttribute(attribute)
            })
        }

        dlog("after parsing attributes", html );

        // parse values
        html = parseString(  $(html)[0].outerHTML , this.state );        

        html = $.parseHTML(html);

        // parse event attributes (it has to be done after the teplate text is finished and no changes will be done)
        for( let eventName in this.rules.events){
            dlog( "parsing event", eventName, "on", html )            
            
            const callback = this.rules.events[eventName];
            $( `[${eventName}]`, html ).each( (ind, item) => {
                dlog( "component parsing attr", eventName, html );
                // call callback                
                callback(item, eventName )             
                // remove the attribute altogether
                $(item)[0].removeAttribute(eventName)
            })
        }

        dlog("after parsing events", html );

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