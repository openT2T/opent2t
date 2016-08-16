// Tests for the ThingAccessor class
// using AVA test runner from https://github.com/avajs/ava

import * as path from "path";
import test from "ava";
import { TestContext } from "ava";

import {
    ThingAccessor,
    ThingSchema,
    IThingTranslator,
} from "../lib";

// Adjust for a path that is relative to the /test directory.
function testPath(modulePath: string): any {
    return path.join("../../test", modulePath);
}

test("Load schema A", async t => {
    let deviceSchemaA: ThingSchema = await
            ThingAccessor.getSchemaAsync(testPath("./@opent2t/test-a"), "SchemaA");
    t.is(typeof deviceSchemaA, "object") && t.truthy(deviceSchemaA);
    t.is(deviceSchemaA.name, "org.opent2t.test.A");
    t.true(Array.isArray(deviceSchemaA.properties) && deviceSchemaA.properties.length > 0);
    t.true(Array.isArray(deviceSchemaA.methods) && deviceSchemaA.methods.length > 0);

    // Extended testing on schema loading should be done by the schema reader tests.
});

test("Load schema B", async t => {
    let deviceSchemaB: ThingSchema = await
            ThingAccessor.getSchemaAsync(testPath("./@opent2t/test-b"), "SchemaB");
    t.is(typeof deviceSchemaB, "object") && t.truthy(deviceSchemaB);
    t.is(deviceSchemaB.name, "org.opent2t.test.B");
    t.true(Array.isArray(deviceSchemaB.properties) && deviceSchemaB.properties.length > 0);
    t.true(Array.isArray(deviceSchemaB.methods) && deviceSchemaB.methods.length > 0);

    // Extended testing on schema loading should be done by the schema reader tests.
});

test("Thing A property get", async t => {
    let deviceA: IThingTranslator = await ThingAccessor.createTranslatorAsync(
            testPath("./@opent2t/test-a"), "TranslatorA", {});
    t.is(typeof deviceA, "object") && t.truthy(deviceA);
    let propA1Value = await ThingAccessor.getPropertyAsync(deviceA, "SchemaA", "propA1");
    t.is(propA1Value, 123);
});

test("Thing A property set", async t => {
    let deviceA: IThingTranslator = await ThingAccessor.createTranslatorAsync(
            testPath("./@opent2t/test-a"), "TranslatorA", {});
    t.is(typeof deviceA, "object") && t.truthy(deviceA);
    await ThingAccessor.setPropertyAsync(deviceA, "SchemaA", "propA2", "test2");
    let propA2Value = await ThingAccessor.getPropertyAsync(deviceA, "SchemaA", "propA2");
    t.is(propA2Value, "test2");
});

test("Thing A method call + notification", async t => {
    let deviceA: IThingTranslator = await ThingAccessor.createTranslatorAsync(
            testPath("./@opent2t/test-a"), "TranslatorA", {});
    t.is(typeof deviceA, "object") && t.truthy(deviceA);
    let methodCalled: boolean = false;
    ThingAccessor.addPropertyListener(deviceA, "SchemaA", "signalA", (message: string) => {
        methodCalled = true;
    });
    await ThingAccessor.invokeMethodAsync(deviceA, "SchemaA", "methodA1", []);
    t.true(methodCalled);
});

test("Thing AB property get (schema A)", async t => {
    let deviceAB: IThingTranslator = await ThingAccessor.createTranslatorAsync(
            testPath("./@opent2t/test-b"), "TranslatorAB", {});
    t.is(typeof deviceAB, "object") && t.truthy(deviceAB);
    let propA1Value = await ThingAccessor.getPropertyAsync(
            deviceAB, "org.opent2t.test.A", "propA1");
    t.is(propA1Value, 123);
});

test("Thing AB property get (schema B)", async t => {
    let deviceAB: IThingTranslator = await ThingAccessor.createTranslatorAsync(
            testPath("./@opent2t/test-b"), "TranslatorAB", {});
    t.is(typeof deviceAB, "object") && t.truthy(deviceAB);
    let propA1Value = await ThingAccessor.getPropertyAsync(
            deviceAB, "org.opent2t.test.B", "propA1");
    t.is(propA1Value, 999);
});

test("Thing AB method that throws + notification", async t => {
    let deviceAB: IThingTranslator = await ThingAccessor.createTranslatorAsync(
            testPath("./@opent2t/test-b"), "TranslatorAB", {});
    t.is(typeof deviceAB, "object") && t.truthy(deviceAB);
    let methodCalled: boolean = false;
    ThingAccessor.addPropertyListener(
            deviceAB, "org.opent2t.test.B", "signalB", (message: string) => {
        methodCalled = true;
    });
    t.throws(ThingAccessor.invokeMethodAsync(deviceAB, "org.opent2t.test.B", "methodB1", []));
    t.true(methodCalled);
});
