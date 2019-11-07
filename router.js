import {dlog} from './op.app.js'
import { _exists, _default } from "./functions";

export class onePageRouter {
    
   

    constructor( routes, params ){        

        this.params = 
        Object.assign( 
            {
                baseRoot: ""
            },
            _default( params, {} )
        )
        dlog( "router params: ", this.params)
        this.routes = routes;
    }

    /**
     * Matches passed url to list of routes
     * @param {*} url 
     */
    matchRoute( url ){
        dlog("routing", url);

        // remove base route, if any
        if( this.params.baseRoot != "" && url.indexOf(this.params.baseRoot) === 0 ){
            // remove, if found at the beginning
            url = url.substr( this.params.baseRoot.length )
        }

        // key in routes is a regex for matching the route, without ^ and $
        // e.g. '/some/path/([0-9]+)'
        for( let ind in this.routes ){

            // regex from this route
            const reg = this.rgxFromRoute( ind );

            // match it against the passed value
            const regmatch = reg.exec( url );
            dlog("regex match", url, ind, regmatch);
            if( regmatch ){

                // gather parameters, if any
                // they will be inside the regmatch array
                const params = [];
                for (let i = 1; i < regmatch.length; i++) {
                    params.push(regmatch[i]);
                }

                // fetch copy of the route and add found params to it
                const result =  Object.assign( {}, this.routes[ind] );
                result.params = params;

                // add original url to route
                result.url = url;

                dlog("found route", result );
                return result;
            }
        }

        // not found anything
        return false;
    }

    /**
     * Converts simple route notation into regex by escaping, adding start/end and creating a rgx object 
     */
    rgxFromRoute( route ){
        return new RegExp( "^" + route.replace("\/", "\\\/") + "$" );
    }
}