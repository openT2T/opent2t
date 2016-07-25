"use strict";
// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

const EventEmitter = require("events");

/**
 * The translator class does not directly implement any device interfaces, but has
 * one required method for creating a device instance.
 */
class TestTranslatorA {
    createDevice(deviceProps) {
        return new TestDeviceA(deviceProps);
    }
}

// Export an instance of the translator from the module.
module.exports = new TestTranslatorA();

/**
 * This translator device class implements the "org.opent2t.test.A" interface.
 * Since the interface includes a signal (notifiable property), this class
 * extends from the node's built-in event-emitter class.
 */
class TestDeviceA extends EventEmitter {

    constructor(deviceProps) {
        super(); // Construct EventEmitter base

        this._propA1 = 123;
        this._propA2 = "test";
    }

    /**
     * Getter for readonly property A1.
     */
    getPropA1() {
        return this._propA1;
    }

    /**
     * Getter for readwrite property A2.
     */
    getPropA2() {
        return this._propA2;
    }

    /**
     * Getter for readwrite property A2.
     */
    setPropA2(value) {
        this._propA2 = value;
    }

    /**
     * Synchronous method that emits an event.
     */
    methodA1() {
        this.emit("signalA", "methodA1 called");
    }

    /**
     * Asyncronous method that emits an event and then returns true.
     */
    methodA2(param1, param2) {
        return new Promise((resolve, reject) => {
            this.emit("signalA", "methodA2 called");
            resolve(true);
        });
    }
}
