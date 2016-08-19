// Tests for the AllJoynSchemaReader and AllJoynSchemaWriter classes
// using AVA test runner from https://github.com/avajs/ava

import * as path from "path";
import test from "ava";
import { TestContext } from "ava";

import { ThingSchema, JsonSchema } from "../lib";
import { AllJoynSchemaReader, AllJoynSchemaWriter } from "../lib/schema";

// Requires modules relative to the /test directory.
function requireTest(modulePath: string): any {
    return require(path.join(__dirname, "../../test", modulePath));
}

// Test that an AllJoyn schema type code can be converted to a JSON schema and back.
function testAllJoynTypeRoundTrip(t: TestContext, allJoynType: string, expectedSchema: JsonSchema) {
    let schema: JsonSchema = AllJoynSchemaReader.allJoynTypeToJsonSchema(allJoynType);
    t.deepEqual(schema, expectedSchema);
    let convertedType: string = AllJoynSchemaWriter.jsonSchemaToAllJoynType(schema);
    t.is(convertedType, allJoynType);
}

test("AllJoyn type <-> JSON schema: s", t => {
    testAllJoynTypeRoundTrip(t, "s", {
        "type": "string"
    });
});
test("AllJoyn type <-> JSON schema: as", t => {
    testAllJoynTypeRoundTrip(t, "as", {
        "type": "array",
        "items": {
            "type": "string"
        }
    });
});
test("AllJoyn type <-> JSON schema: (ss)", t => {
    testAllJoynTypeRoundTrip(t, "(ss)", {
        "type": "array",
        "items": [
            {
                "type": "string"
            },
            {
                "type": "string"
            }
        ]
    });
});
test("AllJoyn type <-> JSON schema: (s(is))", t => {
    testAllJoynTypeRoundTrip(t, "(s(is))", {
        "type": "array",
        "items": [
            {
                "type": "string"
            },
            {
                "type": "array",
                "items": [
                    {
                        "type": "integer",
                        "minimum": -2147483648,
                        "maximum": 2147483647
                    },
                    {
                        "type": "string"
                    }
                ]
            }
        ]
    });
});
test("AllJoyn type <-> JSON schema: a{ss}", t => {
    testAllJoynTypeRoundTrip(t, "a{ss}", {
        "type": "object",
        "additionalProperties": {
            "type": "string"
        }
    });
});
test("AllJoyn type <-> JSON schema: a(ss)", t => {
    testAllJoynTypeRoundTrip(t, "a(ss)", {
        "type": "array",
        "items": {
            "type": "array",
            "items": [
                {
                    "type": "string"
                },
                {
                    "type": "string"
                }
            ]
        }
    });
});
test("AllJoyn type <-> JSON schema: a{s(is)}", t => {
    testAllJoynTypeRoundTrip(t, "a{s(is)}", {
        "type": "object",
        "additionalProperties": {
            "type": "array",
            "items": [
                {
                    "type": "integer",
                    "minimum": -2147483648,
                    "maximum": 2147483647
                },
                {
                    "type": "string"
                }
            ]
        }
    });
});
test("AllJoyn type <-> JSON schema: a{s(i(ss))}", t => {
    testAllJoynTypeRoundTrip(t, "a{s(i(ss))}", {
        "type": "object",
        "additionalProperties": {
            "type": "array",
            "items": [
                {
                    "type": "integer",
                    "minimum": -2147483648,
                    "maximum": 2147483647
                },
                {
                    "type": "array",
                    "items": [
                        {
                            "type": "string"
                        },
                        {
                            "type": "string"
                        }
                    ]
                }
            ]
        }
    });
});

test("AllJoyn schema <-> ThingSchema: A", async t => {
    let thingSchema: ThingSchema = await requireTest(
            "./org.opent2t.test.schemas.a/org.opent2t.test.schemas.a");

    t.is(typeof thingSchema, "object");
    t.is(thingSchema.name, "org.opent2t.test.schemas.a");
    t.truthy(thingSchema.description);
    t.is(thingSchema.properties.length, 3);
    t.is(thingSchema.methods.length, 2);
    t.is(typeof thingSchema.properties[0], "object");
    t.is(thingSchema.properties[0].name, "propA1");
    t.is(typeof thingSchema.methods[0], "object");
    t.is(thingSchema.methods[0].name, "methodA1");

    let ajXml = AllJoynSchemaWriter.writeThingSchemas([thingSchema]);

    // Verify the written XML by parsing it again and comparing to the
    // already-verified object model.
    let thingSchemas2: ThingSchema[] =
            AllJoynSchemaReader.readThingSchemas(ajXml);
    t.deepEqual(thingSchemas2, [thingSchema]);
});
