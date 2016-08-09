"use strict";
// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

const EventEmitter = require("events");

/**
 * This translator class implements two interfaces: "org.opent2t.test.B"
 * and "org.opent2t.test.C". Since those interfaces do not have any conflicting
 * member names, they are both implemented directly.
 */
class TestTranslatorBC extends EventEmitter {

    constructor(deviceProps) {
        super(); // Construct EventEmitter base

        this._propA1 = 999;
        this._propB2 = "BBB";
        this._propC1 = "CCC";
    }

    /**
     * Getter for readonly property A1.
     */
    getPropA1() {
        // Note this property's name conflicts with the declaration in interface A.
        // When the same property is called via interface B, it can return a different value.
        return this._propA1;
    }

    /**
     * Async getter for readwrite property B2.
     */
    getPropB2() {
        // OpenT2T allows any properties and methods to be either synchronous or asyncronous.
        // This property is async for testing and demonstration purposes.
        return new Promise((resolve, reject) => {
            resolve(this._propA2);
        });
    }

    /**
     * Async setter for readwrite property B2.
     */
    setPropB2(value) {
        return new Promise((resolve, reject) => {
            this._propA2 = value;
            resolve();
        });
    }

    /**
     * Synchronous method that emits an event.
     */
    methodB1() {
        this.emit("signalB", "methodB1 called");
    }

    /**
     * Asyncronous method that emits an event and then returns true.
     */
    methodB2(param1, param2) {
        return new Promise((resolve, reject) => {
            this.emit("signalB", "methodB2 called");
            resolve(true);
        });
    }

    /**
     * Getter for readonly property C1.
     */
    getPropC1() {
        return this._propC1;
    }
}

// Export the translator from the module.
module.exports = TestTranslatorBC;
