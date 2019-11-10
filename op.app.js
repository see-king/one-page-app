import { Reactor } from "./event.js" // simple event reactor
import $ from 'jquery';
import { onePageRouter } from "./router.js"
import { deepMerge, getErrorObject, _exists, _default } from "./functions";
/**
 * Simple one page app class.
 * Receives list of routes and controllers (controllers must be preloaded)
 * Catches clicks on 'a' elements with data-link attribute and uses their href attribute as internal links.
 * Pushes the route url to history.
 * Requires .htaccess (or whatever) redirect to index file.
 * @author Alex Kogan
 */

export default class onePageApp extends Reactor {


    constructor(el, params) {
        params = _default(params, {});

        dlog("constructing", el, params);
        // call Reactor constructor
        super();

        // cache
        this._CACHE = {};

        // list of created controller instances
        this.controllers = {};

        // merge into default params
        this.params = deepMerge(
            {
                routerParams: {
                    // change this to any string to remove this string from beginning of the URI
                    // e.g. if www.example.com/path/to/app/ then set baseRoute to "/path/to/app" (leave the trailing slash out)
                    baseRoute: ""
                },

                routes: {
                    "/": {
                        controller: "onePageController",
                        method: "index"
                    }
                },

                controllers: {
                    // default: onePageController // just a default controller
                },

                parseOnce: [ 
                    /**
                     * list of selectors to parse once the app is on and running.
                     * Add all elements that need to be parsed outside app target element (e.g. navs, side modules etc)
                     */
                ],

                modules: {
                    /**
                     * Items like:
                     *  selector : { controller: cname, method: mname }
                     * 
                     * e.g.: 
                     * "#nav" : { controller: Navigation, method: index }
                     * 
                     * method must return a Promise with resulting html as result parameter.
                     * 
                     * The result of Promise will replace the contents of selector.
                     */
                },

                // add more handlers by passing params['eventHandlers'] object to constructor
                eventHandlers: {
                    "a[data-link]": {
                        event: "click",
                        handler: this.fireLink.bind(this)
                    }
                }
            },
            params);

        // set the DEBUG flag from params    
        onePageApp.debug = _exists(this.params.debug) ? this.params.debug : true;

        // register internal events
        this.registerEvent("controllerHtmlSet");
        this.registerEvent("routeNotFound");
        this.registerEvent("goingToRoute");
        this.registerEvent("routeChanged");


        this.target = el;

        this.currentRoute = null;
        this.router = new onePageRouter(this.params.routes, this.params.routerParams);

        this.init();
    }

    init() {

        // parse elements to parse once 
        for( let ind in this.params.parseOnce ){
            const el = $(this.params.parseOnce[ind]);
            dlog("parsing once", this.params.parseOnce[ind] );
            this.parseHtml( el );
            this.parseModules( el )
        }

        // parse target
        // this.parseHtml(this.target);

        // hang event listener to window popstate
        window.addEventListener('popstate', this.onPopStateChange.bind(this) )

        // go to current url        
        this.goTo(location.pathname, false);

    }

    onPopStateChange(){
        const newUrl = location.pathname;
        dlog("history go to", newUrl);
        this.goTo(newUrl, false); // state push not necessary, browser have already done it
    }



    parseModules( el ){
        // handle modules
        for (let ind in this.params.modules) {
            const _module = this.params.modules[ind];
            dlog("checking module", ind, _module, "on", el );
            if( _exists(_module.controller) && _exists(_module.method) ){                
                $(ind, $(el) ).each( (i, item) => {
                    dlog("parsing module", _module, "on", item);

                    // callback receives two variables:
                    // target - the complete scope where the parsing takes place
                    // item - the item found by parsing the target with this.params.modules array
                    this.callControllerMethod(_module.controller, _module.method, { target: el, item: item } )
                    // no .then() clause - the module works on target by itself                    
                    .catch( res => dlog("Error parsing module", _module, res ) )
                })
            }
        }
    }

    /**
     * Parses given piece of HTML and handles all app-related elements there.
     * @param {*} el 
     */
    parseHtml(el) {
        // handle events
        for (let ind in this.params.eventHandlers) {
            const item = this.params.eventHandlers[ind];            
            $(ind, el).each( (i, target) => {
                // looks like when using jquery on(), the listeners go off after detaching-reattaching element,
                // and we use cached rendered DOM with attached listeners, so it's better to use addEventListener
                // instead of parsing the element before reattaching it back to the page DOM.
                target.addEventListener(item.event, item.handler )
            })             
        }
    }

    /**
     * Fires an internal link
     * @param {*} ev 
     */
    fireLink(ev) {
        // stop link from default behavior
        ev.stopPropagation();
        ev.preventDefault();
        dlog([ev.currentTarget]);
        const href = ev.currentTarget.getAttribute('href');

        this.goTo(href);

    }


    /**
     * Fetches the route by passed href and changes the current route, if found.
     * If route not found, a "route not found" event is triggered.
     * @param {*} href 
     * @param {*} pushState boolean, whether to push the new state or not
     */
    goTo(href, pushState ) {
        pushState = _default(pushState, true); //


        // push url to history to simulate actual URL change
        if( pushState ){
            this.pushState( href );
        }

        // match route
        const route = this.router.matchRoute(href);

        if (!route) {
            this.dispatchEvent("routeNotFound");
            dlog("route not found", href);
        } else {
            this.dispatchEvent("goingToRoute");
            dlog("going to ", href);
            this.changeRoute(route);
        }
    }

    /**
     * Returns a promise made out of controller's result (must return promise)     
     * @param {*} controller controller name
     * @param {*} method method name     
     * @param {*} params additional data to pass to controller
     */
    callControllerMethod(cname, mname, params) {

        const controller = this.getController(cname);
        const method = _exists(mname) ? mname : "index"; // index is default method

        // call given method (params, event-to-call-once-html-is-set)
        return new Promise((resolve, reject) => {

            if (controller) {
                dlog(`calling method ${mname} of controller ${cname}`);
                controller[method](params, "controllerHtmlSet", params)
                    .then((res) => resolve(res))
                    .catch(err => reject(err))

            } else {
                // TODO: handle error                
                reject(`Controller not found ${cname}`)
            }
        }
        );


    }


    /**
     * Changes current route
     * @param {*} route this must be the result or router.matchRoute() function
     */
    changeRoute(route) {
        dlog("goTo", route);


        // update route in app
        this.currentRoute = route;

        const cname = route.controller;
        const method = _exists(route.method) ? route.method : "index";

        this.callControllerMethod(cname, method, route.params ) // pass route params to controller
            .then(
                html => {

                    dlog("controller returned html", html);

                    // replace app contents
                    dlog("target", this.target, $(this.target));
                    $(this.target, document).html(html);

                    this.dispatchEvent("routeChanged");
                    // parse new html
                    // this.parseHtml(this.target);                    
                }
            )
            .catch(err => dlog(err));
    }

    /**
     * Pushes url to history
     * @param {*} url 
     */
    pushState( url ){
        dlog("pushing state", url);
        window.history.pushState( {}, "", url ); 
    }

    /**
     * Returns instance of a controller by its index in params.controllers object.
     * Instances are stored in app.controllers object. 
     * If controller instance hasn't beed added to app.controllers yet, it is created.
     * @param {*} controllerIndex 
     */
    getController(controllerIndex) {
        dlog("fetching controller", controllerIndex);
        // if controller hasn't been created, create it.
        if (!_exists(this.controllers[controllerIndex])) {

            // get controller constructor from contollers list in params
            const controllerConstructor = this.params.controllers[controllerIndex];

            if (controllerConstructor !== false) {
                this.controllers[controllerIndex] = new controllerConstructor(this); // inject app
            } else {
                return false;
            }
        }

        return this.controllers[controllerIndex];
    }

    /**
     * Stores value in app cache under index key
     * @param {*} index 
     * @param {*} value 
     */
    cacheIt(index, value) {
        this._CACHE[index] = value;
    }

    /**
     * Creates a promise and tries to fetch item from app cache by index. 
     * If not found, callback function is called as a promise and its result is returned as resolve.
     * @param {*} index 
     * @param {*} callback must return promise
     * @param {*} data any data to pass to callback
     */
    cache(index, callback, data) {

        if (_exists(this._CACHE[index])) {
            // simple promise return
            return new Promise( resolve => resolve(this._CACHE[index]));
        }

        // cache not found
        return new Promise((resolve, reject) => {
            if (!_exists(callback)) {
                reject("Callback not passed");
            }

            // callback is also a promise. its return is
            callback(data).then(
                (value) => {
                    // store the value
                    this.cacheIt(index, value);

                    // parse the value
                    this.parseHtml(value);

                    // return the value to caller
                    resolve(value)
                }
            ).catch( err => reject(err) ) // catch error
        });
    }
}

/**
 * Log to console if configured to do so.
 * Set onePageApp.debug to true if output needed, to false -- if not.
 */
export function dlog() {
    if (onePageApp.debug) {
        // trace output
        const err = getErrorObject();
        const chunks = err.stack.split("at ");
        // dlog([err]);
        // dlog( "backtrace", chunks );
        const trace = /([^\.\/\)]+\.*[js]*:\d+:\d+)/gm.exec(chunks[3]);

        if (trace) {

            // add script name and line:position            
            const values = Array.from(arguments);
            values.push(">>>" + trace[0]);

            console.log.apply(null, values);
        } else {
            // for browsers that don't do it the same way as Chrome
            console.log.apply(null, arguments);
        }
    }
}
