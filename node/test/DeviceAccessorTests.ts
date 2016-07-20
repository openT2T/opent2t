
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
