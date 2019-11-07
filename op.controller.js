import { dlog } from "./op.app.js";
import { _exists, _default } from "./functions";
export default class onePageController {

    constructor(_app) {
        this.app = _app;
    }

    index(data, eventToTrigger) {
        data = _default(data, {})

        console.log("method index called", data);

        if (eventToTrigger) {
            dlog("Controller: Triggering event", eventToTrigger);
            this.app.dispatchEvent(eventToTrigger);
        }

    }

    _cache(index, callback, data) {
        return new Promise(
            (resolve, reject) => {
                if (_exists(this.app._CACHE[index])) {
                    // already exists in cache, return it
                    resolve(this.app._CACHE[index])
                } else {
                    // otherwise, use callback to put it in cache and return the result
                    this.app.cache(index, callback, data)
                        .then(
                            (result) => {                                
                                resolve(result);
                            }
                        )
                        .catch((err) => reject(err))
                }
            }
        );
    }

    _cacheIt(index, value) { return this.app.cacheIt(index, value) }
}