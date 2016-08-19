// Tests for the OcfSchemaReader and OcfSchemaWriter classes
// using AVA test runner from https://github.com/avajs/ava

import * as path from "path";
import test from "ava";
import { TestContext } from "ava";

import { ThingSchema, JsonSchema } from "../lib";
import { OcfSchemaReader } from "../lib/schema";

// Requires modules relative to the /test directory.
function requireTest(modulePath: string): any {
    return require(path.join(__dirname, "../../test", modulePath));
}

const schemaName = "org.opent2t.test.schemas.c";
const schemaUri = "http://schemas.opentranslatorstothings.org/" + schemaName + "#";

test("OCF schema -> ThingSchema: C", async t => {
    let thingSchema: ThingSchema = await requireTest(
            "./org.opent2t.test.schemas.c/org.opent2t.test.schemas.c");

    t.is(typeof thingSchema, "object");
    t.is(thingSchema.name, "org.opent2t.test.schemas.c");
    t.truthy(thingSchema.description);
    t.is(thingSchema.properties.length, 0);
    t.is(thingSchema.methods.length, 2);

    t.is(typeof thingSchema.methods[0], "object");
    t.is(thingSchema.methods[0].name, "getThermostatResURI");

    t.is(thingSchema.methods[0].parameters.length, 1);
    t.is(typeof thingSchema.methods[0].parameters[0].parameterType, "object");
    t.truthy(thingSchema.methods[0].parameters[0].parameterType);
    t.is(thingSchema.methods[0].parameters[0].isOut, true);
    t.is(thingSchema.methods[0].parameters[0].parameterType.id, schemaUri);

    t.is(typeof thingSchema.methods[1], "object");
    t.is(thingSchema.methods[1].name, "postThermostatResURI");
    t.is(thingSchema.methods[1].parameters.length, 2);

    t.is(thingSchema.methods[1].parameters[0].isOut, false);
    t.is(typeof thingSchema.methods[1].parameters[0].parameterType, "object");
    t.truthy(thingSchema.methods[1].parameters[0].parameterType);
    t.is(thingSchema.methods[1].parameters[0].parameterType.id, schemaUri);

    t.is(thingSchema.methods[1].parameters[1].isOut, true);
    t.is(typeof thingSchema.methods[1].parameters[1].parameterType, "object");
    t.truthy(thingSchema.methods[1].parameters[1].parameterType);
    t.is(thingSchema.methods[1].parameters[1].parameterType.id, schemaUri);

    // Check that referenced schemas were resolved.
    // The temperature.type property comes from the referenced oic.r.temperature schema.
    let valueSchema: any = thingSchema.methods[1].parameters[1].parameterType;
    t.truthy(
            valueSchema.definitions &&
            valueSchema.definitions[schemaName] &&
            valueSchema.definitions[schemaName].properties &&
            valueSchema.definitions[schemaName].properties.ambientTemperature);
    let ambientTemperature = valueSchema.definitions[schemaName].properties.ambientTemperature;
    t.truthy(ambientTemperature.properties &&
            ambientTemperature.properties.temperature &&
            ambientTemperature.properties.temperature.type === "number");
});
