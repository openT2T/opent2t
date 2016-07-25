// Tests for the DeviceAccessor class
// using AVA test runner from https://github.com/avajs/ava

import test from "ava";
import { TestContext } from "ava";
import { Schema } from "jsonschema";

import {
    DeviceAccessor,
    ITranslator,
} from "../lib";

// Move working directory from /build/test back to /test.
process.chdir("../../test");

const deviceInterfaceA = "org.opent2t.test.A";
const deviceInterfaceB = "org.opent2t.test.B";

test("Device A property get", async t => {
    let translatorA: ITranslator = require("../../test/translators/tA.js");
    let deviceA = translatorA.createDevice({});
    let propA1Value = await DeviceAccessor.getPropertyAsync(deviceA, deviceInterfaceA, "propA1");
    t.is(propA1Value, 123);
});

test("Device A property set", async t => {
    let translatorA: ITranslator = require("../../test/translators/tA.js");
    let deviceA = translatorA.createDevice({});
    await DeviceAccessor.setPropertyAsync(deviceA, deviceInterfaceA, "propA2", "test2");
    let propA2Value = await DeviceAccessor.getPropertyAsync(deviceA, deviceInterfaceA, "propA2");
    t.is(propA2Value, "test2");
});

test("Device A method call + notification", async t => {
    let translatorA: ITranslator = require("../../test/translators/tA.js");
    let deviceA = translatorA.createDevice({});
    let methodCalled: boolean = false;
    DeviceAccessor.addPropertyListener(deviceA, deviceInterfaceA, "signalA", (message: string) => {
        methodCalled = true;
    });
    await DeviceAccessor.invokeMethodAsync(deviceA, deviceInterfaceA, "methodA1", []);
    t.true(methodCalled);
});

test("Device AB property get (interface A)", async t => {
    let translatorAB: ITranslator = require("../../test/translators/tAB.js");
    let deviceAB = translatorAB.createDevice({});
    let propA1Value = await DeviceAccessor.getPropertyAsync(deviceAB, deviceInterfaceA, "propA1");
    t.is(propA1Value, 123);
});

test("Device AB property get (interface B)", async t => {
    let translatorAB: ITranslator = require("../../test/translators/tAB.js");
    let deviceAB = translatorAB.createDevice({});
    let propA1Value = await DeviceAccessor.getPropertyAsync(deviceAB, deviceInterfaceB, "propA1");
    t.is(propA1Value, 999);
});

test("Device AB method that throws + notification", async t => {
    let translatorAB: ITranslator = require("../../test/translators/tAB.js");
    let deviceAB = translatorAB.createDevice({});
    let methodCalled: boolean = false;
    DeviceAccessor.addPropertyListener(deviceAB, deviceInterfaceB, "signalB", (message: string) => {
        methodCalled = true;
    });
    t.throws(DeviceAccessor.invokeMethodAsync(deviceAB, deviceInterfaceB, "methodB1", []));
    t.true(methodCalled);
});
