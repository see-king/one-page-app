import { _exists, isNull, _default } from "./functions";

var _dom = function ( struc ){
    
    this.structure = _default(struc, {});
    this.result = null;

    
    /*constructor( struc ){
        struc = _default(struc, {});
        this.structure = struc;
        this.result = null;
    }*/

    this.build = function(){
        const el = document.createElement( this.structure["tag"] );
        
        // add attributes, if any
        if( _exists( this.structure["attributes"] ) ){
            for( var ind in this.structure["attributes"] ){
                el.setAttribute( ind, this.structure["attributes"][ind] );
            }
        }

        // if inner html is set, set it
        if( _exists( this.structure["innerHTML"] ) ){
            el.innerHTML = this.structure["innerHTML"];
        } else 
        if( _exists( this.structure["childObjects"] ) ){
            for( var ind in this.structure["childObjects"] ){
                el.append( this.structure["childObjects"][ind] );
            }
        } else         
        // add children, if any
        if( _exists( this.structure["children"] ) ){
            for( var ind in this.structure["children"] ){
                let child = _dom.get( this.structure["children"][ind] );
                el.append(child);
            }
        }

        this.result = el;
    }


    this.fromTemplate = function(){
        const el = document.querySelector( this.structure.template );
        this.result = isNull(el) ? _dom.get({tag:"div", innerHTML: `Error: template '${this.structure.template}' not found`}) : el.cloneNode(true);
    }

    this._ = function(){
        if( _exists( this.structure.template ) ){
            this.fromTemplate();
        } else {
            this.build();
        }
        return this.result;
    }

    
}

_dom.get = function( data = null ){

    // static call
    if( _exists(data) ){
        let el = new _dom(data);
        return el._();
    }
    
    return null;
}

_dom.parseHtml = function( el, data) {
    if( el.replace ){
        return el.replace(
            /%%(\w*)%%/g ,
            function(m,key){ return data.hasOwnProperty(key) ? data[key] : ""; }
        );
    }
}


export default _dom;