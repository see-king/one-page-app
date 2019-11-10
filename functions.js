// import { deepMerge, getErrorObject, isNull, _exists, isNothing, parseString, isObject, _default } from "one-page-app/functions";



export function getErrorObject(){
    try { throw Error('') } catch(err) { return err; }
}


export function isNull(value){ return value === null ;}

export function isNothing( value ) { return isNull(value) || !_exists(value) }

// function isString( value ){ return typeof value === 'string'; }

/**
 * I JUST HATE MS EDGE
 * @param {*} value 
 * @param {*} _default 
 */
export function _default( value, _default ){  return isNothing(value) ? _default : value;  }




export function _exists( val ){
    return typeof val !== "undefined";
}

/**
 * Parses string by replacing %%key1%% in it with value of key1 from data object.
 * @param {*} el 
 * @param {*} data 
 */
export function parseString( el, data) {
    if( el.replace ){
        return el.replace(
            /%%(\w*)%%/g ,
            function(m,key){ return data.hasOwnProperty(key) ? data[key] : ""; }
        );
    }
}


export function isObject( val ){
    return typeof val === 'object' && val !== null;
}

export function isArray(val){ return Array.isArray(val)}

/**
 * Merges data object into target recursively, by adding new or replacing target values.
 * @param {*} target 
 * @param {*} data 
 */
export function deepMerge( target, data ){
    if( isArray(data) ){
        if( isArray(target) ){
            // merge two arrays, removing duplicates
            console.log("target", target);
            target = [...new Set([...target ,...data])];
        } else {
            // override with new value
            target = data;
        }
    } else {
        for( let key in data ){
            if( Array.isArray(data[key]) ){
                target[key] = deepMerge( target[key] || [] , data[key] );
            } else 
            if( isObject(data[key] ) ){
                target[key] = deepMerge( target[key] || {}, data[key] );
            } else {
                target[key] = data[key];
            }
        }
    }
    return target;
}