// Tests for the OpenT2T class
// using AVA test runner from https://github.com/avajs/ava

import * as path from "path";
import test from "ava";
import { TestContext } from "ava";

import {
    OpenT2T,
    ThingSchema,
    IThingTranslator,
} from "../lib";

const schemaA = "org.opent2t.test.schemas.a";
const schemaB = "org.opent2t.test.schemas.b";
const translatorOne = "org.opent2t.test.translators.one/js/thingTranslator";
const translatorTwo = "org.opent2t.test.translators.two/js/thingTranslator";

// Adjust for a path that is relative to the /test directory.
function testPath(modulePath: string): any {
    return path.join(__dirname, "../../test", modulePath);
}

test("Load schema A", async t => {
    let thingSchemaA: ThingSchema = await OpenT2T.getSchemaAsync(
            testPath("./" + schemaA + "/" + schemaA));
    t.is(typeof thingSchemaA, "object") && t.truthy(thingSchemaA);
    t.is(thingSchemaA.name, schemaA);
    t.true(Array.isArray(thingSchemaA.properties) && thingSchemaA.properties.length > 0);
    t.true(Array.isArray(thingSchemaA.methods) && thingSchemaA.methods.length > 0);

    // Extended testing on schema loading should be done by the schema reader tests.
});

test("Load schema B", async t => {
    let thingSchemaB: ThingSchema = await OpenT2T.getSchemaAsync(
            testPath("./" + schemaB + "/" + schemaB));
    t.is(typeof thingSchemaB, "object") && t.truthy(thingSchemaB);
    t.is(thingSchemaB.name, schemaB);
    t.true(Array.isArray(thingSchemaB.properties) && thingSchemaB.properties.length > 0);
    t.true(Array.isArray(thingSchemaB.methods) && thingSchemaB.methods.length > 0);

    // Extended testing on schema loading should be done by the schema reader tests.
});

test("Thing One property get", async t => {
    let thingOne: IThingTranslator = await OpenT2T.createTranslatorAsync(
            testPath("./" + schemaA + "/" + translatorOne), {});
    t.is(typeof thingOne, "object") && t.truthy(thingOne);
    let propA1Value = await OpenT2T.getPropertyAsync(thingOne, schemaA, "propA1");
    t.is(propA1Value, 123);
});

test("Thing One property set", async t => {
    let thingOne: IThingTranslator = await OpenT2T.createTranslatorAsync(
            testPath("./" + schemaA + "/" + translatorOne), {});
    t.is(typeof thingOne, "object") && t.truthy(thingOne);
    await OpenT2T.setPropertyAsync(thingOne, schemaA, "propA2", "test2");
    let propA2Value = await OpenT2T.getPropertyAsync(thingOne, schemaA, "propA2");
    t.is(propA2Value, "test2");
});

test("Thing One method call + notification", async t => {
    let thingOne: IThingTranslator = await OpenT2T.createTranslatorAsync(
            testPath("./" + schemaA + "/" + translatorOne), {});
    t.is(typeof thingOne, "object") && t.truthy(thingOne);
    let methodCalled: boolean = false;
    OpenT2T.addPropertyListener(thingOne, schemaA, "signalA", (message: string) => {
        methodCalled = true;
    });
    await OpenT2T.invokeMethodAsync(thingOne, schemaA, "methodA1", []);
    t.true(methodCalled);
});

test("Thing Two property get (schema A)", async t => {
    let thingTwo: IThingTranslator = await OpenT2T.createTranslatorAsync(
            testPath("./" + schemaB + "/" + translatorTwo), {});
    t.is(typeof thingTwo, "object") && t.truthy(thingTwo);
    let propA1Value = await OpenT2T.getPropertyAsync(thingTwo, schemaA, "propA1");
    t.is(propA1Value, 123);
});

test("Thing Two property get (schema B)", async t => {
    let thingTwo: IThingTranslator = await OpenT2T.createTranslatorAsync(
            testPath("./" + schemaB + "/" + translatorTwo), {});
    t.is(typeof thingTwo, "object") && t.truthy(thingTwo);
    let propA1Value = await OpenT2T.getPropertyAsync(thingTwo, schemaB, "propA1");
    t.is(propA1Value, 999);
});

test("Thing Two method that throws + notification", async t => {
    let thingTwo: IThingTranslator = await OpenT2T.createTranslatorAsync(
            testPath("./" + schemaB + "/" + translatorTwo), {});
    t.is(typeof thingTwo, "object") && t.truthy(thingTwo);
    let methodCalled: boolean = false;
    OpenT2T.addPropertyListener(
            thingTwo, schemaB, "signalB", (message: string) => {
        methodCalled = true;
    });
    t.throws(OpenT2T.invokeMethodAsync(thingTwo, schemaB, "methodB1", []));
    t.true(methodCalled);
});
