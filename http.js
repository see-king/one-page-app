import { _exists, _default } from "./functions";
import $ from "jquery";
export default class http {

    /**
     * Sends a get request to given url, sets resolve and reject as callbacks.
     * Passes given data to both callbacks as second parameter.
     * @param {*} url 
     * @param {*} resolve 
     * @param {*} reject 
     * @param {*} data 
     */
    static get( url, resolve, reject, data = {} ){
        http.promise( url, resolve, reject, data );
    }

    /**
     * Sends a post request to given url, sets resolve and reject as callbacks.
     * Passes given data to both callbacks as second parameter.
     * @param {*} url 
     * @param {*} resolve 
     * @param {*} reject 
     * @param {*} data 
     */
    static post( url, resolve, reject, data = {} ){
        http.promise( url, resolve, reject, data, { type: "post", dataType:"json" } );
    }

    /**
     * Creates promise with passed resolve/reject as callbacks.
     * Passes given data to both callbacks as second parameter.
     * Does NOT return a promise.
     * @param {*} url 
     * @param {*} resolve 
     * @param {*} reject 
     * @param {*} data data to pass to callbacks
     * @param {*} params object with ajax call settings. Override to change.
     */
    static promise ( url, resolve, reject, data = {}, params = { type: "get", dataType: "json" } ){
        // assign url 
        params.url = url;
        // make ajax call
        $.ajax( params )
        .then( (result) => { resolve( result, data ) } )
        .catch( (error) =>  { reject( error, data ) } );
    }

    /**
     * just a simplifying wrapper for $.ajax()
     * Returns an ajax promise. 
     * @param {*} url 
     * @param {*} params 
     */
    static justPromise( url, params ){        
        params = _default( params, { type: "get", dataType: "json" } );        
        params.url = url;
        return $.ajax(params);
    }
}