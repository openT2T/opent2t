// Tests for the OpenT2T class
// using AVA test runner from https://github.com/avajs/ava

import * as path from "path";
import * as fs from "mz/fs";
import test from "ava";
import { TestContext } from "ava";

import {
    OpenT2T,
    ThingSchema,
    IThingTranslator,
    OpenT2TConstants,
    OpenT2TError,
    Logger
} from "../lib";

const schemaA = "org.opent2t.test.schemas.a";
const schemaB = "org.opent2t.test.schemas.b";
const translatorOne = "org.opent2t.test.translators.one/js/thingTranslator";
const translatorTwo = "org.opent2t.test.translators.two/js/thingTranslator";
const  testLogFileName = "myloggertest.log";

// Adjust for a path that is relative to the /test directory.
function testPath(modulePath: string): any {
    return path.join(__dirname, "../../test", modulePath);
}

test("Missing translator module", async t => {
    let missingTranslatorName = "this_translator_does_not_exist"
    const error: Error = await t.throws(OpenT2T.createTranslatorAsync(missingTranslatorName, {}), OpenT2TError);
    t.true(error.message.startsWith(OpenT2TConstants.MissingTranslator));
    t.true(error.message.endsWith(missingTranslatorName));
});

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

test("JSON.stringify() on OpenT2TError object returns a valid JSON object", async t => {
    let customMessage = "My custom error message";
    let innerErrorMessage = "My Inner Error is a TypeError";
    let innerError = new TypeError(innerErrorMessage);
    let error = new OpenT2TError(400, customMessage, innerError);
    let jsonObjectString = JSON.stringify(error);
    t.true(jsonObjectString.search(customMessage) >= 0);
    t.true(jsonObjectString.search(innerErrorMessage) >= 0);
    t.true(jsonObjectString.search("innerErrorStack") >= 0);
    t.true(jsonObjectString.search(innerError.name) >= 0);
});

test("Logger with default parameters can be instantiated", async t => {
    let logger = new Logger();
    logger.info("Writing default level to default console.");
    logger.debug("writing debug level to default console.");
});

test("Logger with default parameters can log a non-primitive type", async t => {
    let logger = new Logger();
    let myArray: Array<any> = ["firstObject", "secondObject", ["nestedObj1", "nestedObj2"]];
    logger.info("Writing default level to default console.");
    logger.debug("writing debug level to default console.");
    logger.warn("Writing array object to default console", myArray);
});

test("Logger with default parameters can be instantiated multiple times", async t => {
    let logger = new Logger();
    logger.info("Writing default level to default console.");
    logger.debug("writing debug level to default console.");
    let logger2 = new Logger();
    logger.info("2nd Logger - Writing default level to default console");
});

test("Logger can be instantiated with custom file parameter", async t => {
    let logger = new Logger(undefined, testLogFileName) ;
    logger.info("Writing default level to default console + file.");
    logger.warn("writing warn level to default console + file.");
    t.is(logger.getConfiguredTransports().length, 2);
});

test.after("Deleting created log file", async t => {
    let fullPathName = path.join(__dirname, testLogFileName);
    return fs.unlinkSync(fullPathName);
});
