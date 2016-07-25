// Tests for the AllJoynConverter class
// using AVA test runner from https://github.com/avajs/ava

import test from "ava";
import { TestContext } from "ava";
import { Schema } from "jsonschema";

import {
    AllJoynConverter,
    DeviceInterface,
} from "../lib";

// Move working directory from /build/test back to /test.
process.chdir("../../test");

// Test that an AllJoyn schema type code can be converted to a JSON schema and back.
function testAllJoynTypeRoundTrip(t: TestContext, allJoynType: string, expectedSchema: Schema) {
    let schema: Schema = AllJoynConverter.allJoynTypeToJsonSchema(allJoynType);
    t.deepEqual(schema, expectedSchema);
    let convertedType: string = AllJoynConverter.jsonSchemaToAllJoynType(schema);
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

test("AllJoyn schema <-> DeviceInterface: A", async t => {
    let deviceInterfaces: DeviceInterface[] =
            await AllJoynConverter.readDeviceInterfacesFromFileAsync("./schemas/A.xml");

    t.true(Array.isArray(deviceInterfaces));
    t.is(deviceInterfaces.length, 1);
    let deviceInterface: DeviceInterface = deviceInterfaces[0];
    t.is(deviceInterfaces.length, 1);
    t.is("object", typeof deviceInterface, "object");
    t.is(deviceInterface.name, "org.opent2t.test.A");
    t.truthy(deviceInterface.description);
    t.is(deviceInterface.properties.length, 3);
    t.is(deviceInterface.methods.length, 2);
    t.is(typeof deviceInterface.properties[0], "object");
    t.is(deviceInterface.properties[0].name, "propA1");
    t.is(typeof deviceInterface.methods[0], "object");
    t.is(deviceInterface.methods[0].name, "methodA1");

    let ajXml = await AllJoynConverter.writeDeviceInterfacesAsync(deviceInterfaces);

    // Verify the written XML by parsing it again and comparing to the
    // already-verified object model.
    let deviceInterfaces2: DeviceInterface[] =
            await AllJoynConverter.readDeviceInterfacesAsync(ajXml);
    t.deepEqual(deviceInterfaces2, deviceInterfaces);
});
