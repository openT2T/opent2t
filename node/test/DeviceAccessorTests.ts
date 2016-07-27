// Tests for the DeviceAccessor class
// using AVA test runner from https://github.com/avajs/ava

import * as path from "path";
import test from "ava";
import { TestContext } from "ava";
import { Schema } from "jsonschema";

import {
    DeviceAccessor,
    DeviceInterface,
    ITranslator,
} from "../lib";

// Adjust for a path that is relative to the /test directory.
function testPath(modulePath: string): any {
    return path.join("../../test", modulePath);
}

test("Load interface A", async t => {
    let deviceInterfaceA: DeviceInterface = await
            DeviceAccessor.getInterfaceAsync(testPath("./@opent2t/test-a"), "InterfaceA");
    t.is(typeof deviceInterfaceA, "object") && t.truthy(deviceInterfaceA);
    t.is(deviceInterfaceA.name, "InterfaceA");
    t.true(Array.isArray(deviceInterfaceA.properties) && deviceInterfaceA.properties.length > 0);
    t.true(Array.isArray(deviceInterfaceA.methods) && deviceInterfaceA.methods.length > 0);

    // Extended testing on interface loading should be done by the converter tests.
});

test("Load interface B", async t => {
    let deviceInterfaceB: DeviceInterface = await
            DeviceAccessor.getInterfaceAsync(testPath("./@opent2t/test-b"), "InterfaceB");
    t.is(typeof deviceInterfaceB, "object") && t.truthy(deviceInterfaceB);
    t.is(deviceInterfaceB.name, "InterfaceB");
    t.true(Array.isArray(deviceInterfaceB.properties) && deviceInterfaceB.properties.length > 0);
    t.true(Array.isArray(deviceInterfaceB.methods) && deviceInterfaceB.methods.length > 0);

    // Extended testing on interface loading should be done by the converter tests.
});

test("Device A property get", async t => {
    let deviceA: ITranslator = await DeviceAccessor.createTranslatorAsync(
            testPath("./@opent2t/test-a"), "TranslatorA", {});
    t.is(typeof deviceA, "object") && t.truthy(deviceA);
    let propA1Value = await DeviceAccessor.getPropertyAsync(deviceA, "InterfaceA", "propA1");
    t.is(propA1Value, 123);
});

test("Device A property set", async t => {
    let deviceA: ITranslator = await DeviceAccessor.createTranslatorAsync(
            testPath("./@opent2t/test-a"), "TranslatorA", {});
    t.is(typeof deviceA, "object") && t.truthy(deviceA);
    await DeviceAccessor.setPropertyAsync(deviceA, "InterfaceA", "propA2", "test2");
    let propA2Value = await DeviceAccessor.getPropertyAsync(deviceA, "InterfaceA", "propA2");
    t.is(propA2Value, "test2");
});

test("Device A method call + notification", async t => {
    let deviceA: ITranslator = await DeviceAccessor.createTranslatorAsync(
            testPath("./@opent2t/test-a"), "TranslatorA", {});
    t.is(typeof deviceA, "object") && t.truthy(deviceA);
    let methodCalled: boolean = false;
    DeviceAccessor.addPropertyListener(deviceA, "InterfaceA", "signalA", (message: string) => {
        methodCalled = true;
    });
    await DeviceAccessor.invokeMethodAsync(deviceA, "InterfaceA", "methodA1", []);
    t.true(methodCalled);
});

test("Device AB property get (interface A)", async t => {
    let deviceAB: ITranslator = await DeviceAccessor.createTranslatorAsync(
            testPath("./@opent2t/test-b"), "TranslatorAB", {});
    t.is(typeof deviceAB, "object") && t.truthy(deviceAB);
    let propA1Value = await DeviceAccessor.getPropertyAsync(deviceAB, "InterfaceA", "propA1");
    t.is(propA1Value, 123);
});

test("Device AB property get (interface B)", async t => {
    let deviceAB: ITranslator = await DeviceAccessor.createTranslatorAsync(
            testPath("./@opent2t/test-b"), "TranslatorAB", {});
    t.is(typeof deviceAB, "object") && t.truthy(deviceAB);
    let propA1Value = await DeviceAccessor.getPropertyAsync(deviceAB, "InterfaceB", "propA1");
    t.is(propA1Value, 999);
});

test("Device AB method that throws + notification", async t => {
    let deviceAB: ITranslator = await DeviceAccessor.createTranslatorAsync(
            testPath("./@opent2t/test-b"), "TranslatorAB", {});
    t.is(typeof deviceAB, "object") && t.truthy(deviceAB);
    let methodCalled: boolean = false;
    DeviceAccessor.addPropertyListener(deviceAB, "InterfaceB", "signalB", (message: string) => {
        methodCalled = true;
    });
    t.throws(DeviceAccessor.invokeMethodAsync(deviceAB, "InterfaceB", "methodB1", []));
    t.true(methodCalled);
});
