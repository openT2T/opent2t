"use strict";
// This code uses ES2015 syntax that requires at least Node.js v4.
// For Node.js ES2015 support details, reference http://node.green/

const EventEmitter = require("events");

/**
 * This translator class implements two interfaces: "InterfaceA"
 * and "InterfaceB". But since those interfaces have some conflicting
 * member names, only A is implemented directly while B is delegated to
 * an inner helper class.
 */
class TestTranslatorAB extends EventEmitter {

    constructor(deviceProps) {
        super(); // Construct EventEmitter base

        this.B = new InnerB(this);
        this._propA1 = 123;
        this._propA2 = "AAA";
    }

    /**
     * When present, the `as` method is called to request an object from the device
     * that implements the requested interface. If no `as` method is present, the device
     * is assumed to implement all interfaces directly.
     */
    as(interfaceName) {
        if (interfaceName == "InterfaceA") {
            // This device object directly implements interface A.
            return this;
        } else if (interfaceName == "InterfaceB") {
            // Interface B is delegated to an instance of the helper class.
            return this.B;
        } else {
            // A null return value indicates an unknown/unimplemented interface.
            return null;
        }
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
     * Setter for readwrite property A2.
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
        // OpenT2T allows any properties and methods to be either synchronous or asyncronous.
        // This method is async for testing and demonstration purposes.
        return new Promise((resolve, reject) => {
            this.emit("signalA", "methodA2 called");
            resolve(true);
        });
    }
}

class InnerB extends EventEmitter {
    constructor(outer) {
        super(); // Construct EventEmitter base

        // Keep a reference to the outer device object in case there is some state
        // or functionality shared by both interfaces.
        this._outer = outer;

        this._propA1 = 999;
        this._propB2 = "BBB";
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
     * Synchronous method that emits an event and then throws an error.
     */
    methodB1() {
        // Note since signalB is declared in interface B, the corresponding events must
        // be emitted from the event-emitter subclass that also implements interface B.
        this.emit("signalB", "methodB1 called");
        throw new Error("Intentional error!");
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
}

// Export the translator from the module.
module.exports = TestTranslatorAB;
