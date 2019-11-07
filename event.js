import {dlog} from './op.app.js'
import {  _exists,  _default } from "./functions";
/**
 * Simple event reactor 
 * kudos to 
 */

export class Event{
    constructor(name){
        this.name = name;
        this.callbacks = [];
    }

    registerCallback (callback) {
        this.callbacks.push(callback);
    }
}

export class Reactor{

    constructor(){
        this.events = {};
    }
    

    registerEvent(eventName) {
        var event = new Event(eventName);
        this.events[eventName] = event;
    }

    dispatchEvent(eventName, eventArgs) {
        this.events[eventName].callbacks.forEach(function (callback) {
            callback(eventArgs);
        });
    };

    addEventListener (eventName, callback) {
        dlog(  Object.keys( this.events ) );
        if( _exists(this.events[eventName])){
            this.events[eventName].registerCallback(callback);
        }
        else{
            dlog(`Event not found: [${eventName}] `, this.events  );            
        }

    };
}