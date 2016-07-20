
import test from 'ava';

import {
    AllJoynConverter,
    DeviceInterface,
    TypeScriptConverter
} from "../lib";

// Move from /build/test back to /test
process.chdir("../../test");

test("AllJoyn type to JSON schema: (ss)", t => {
    t.deepEqual(AllJoynConverter.allJoynTypeToJsonSchema("(ss)"), {
        "type": "object",
        "properties": {
            "_0": {
                "type": "string"
            },
            "_1": {
                "type": "string"
            }
        }
    });
});
test("AllJoyn type to JSON schema: (ss)", t => {
    t.deepEqual(AllJoynConverter.allJoynTypeToJsonSchema("(s(is))"), {
        "type": "object",
        "properties": {
            "_0": {
                "type": "string"
            },
            "_1": {
                "type": "object",
                "properties": {
                    "_0": {
                        "type": "integer",
                        "minimum": -2147483648,
                        "maximum": 2147483647
                    },
                    "_1": {
                        "type": "string"
                    }
                }
            }
        }
    });
});
test("AllJoyn type to JSON schema: as", t => {
    t.deepEqual(AllJoynConverter.allJoynTypeToJsonSchema("as"), {
        "type": "array",
        "items": {
            "type": "string"
        }
    });
});
test("AllJoyn type to JSON schema: a{ss}", t => {
    t.deepEqual(AllJoynConverter.allJoynTypeToJsonSchema("a{ss}"), {
        "type": "object",
        "additionalProperties": {
            "type": "string"
        }
    });
});
test("AllJoyn type to JSON schema: a(ss)", t => {
    t.deepEqual(AllJoynConverter.allJoynTypeToJsonSchema("a(ss)"), {
        "type": "array",
        "items": {
            "type": "object",
                "properties": {
                "_0": {
                    "type": "string"
                },
                "_1": {
                    "type": "string"
                }
            }
        }
    });
});
test("AllJoyn type to JSON schema: a{s(is)}", t => {
    t.deepEqual(AllJoynConverter.allJoynTypeToJsonSchema("a{s(is)}"), {
        "type": "object",
        "additionalProperties": {
            "type": "object",
            "properties": {
                "_0": {
                    "type": "integer",
                    "minimum": -2147483648,
                    "maximum": 2147483647
                },
                "_1": {
                    "type": "string"
                }
            }
        }
    });
});
test("AllJoyn type to JSON schema: a{s(i(ss))}", t => {
    t.deepEqual(AllJoynConverter.allJoynTypeToJsonSchema("a{s(i(ss))}"), {
        "type": "object",
        "additionalProperties": {
            "type": "object",
            "properties": {
                "_0": {
                    "type": "integer",
                    "minimum": -2147483648,
                    "maximum": 2147483647
                },
                "_1": {
                    "type": "object",
                    "properties": {
                        "_0": {
                            "type": "string"
                        },
                        "_1": {
                            "type": "string"
                        }
                    }
                }
            }
        }
    });
});

test("AllJoyn schema: A", async t => {
    let deviceInterfaces: DeviceInterface[] =
            await AllJoynConverter.readDeviceInterfacesFromFileAsync("./schemas/A.xml");
    t.true(Array.isArray(deviceInterfaces));
    let deviceInterface: DeviceInterface = deviceInterfaces[0];
    t.is(1, deviceInterfaces.length);
    t.is(typeof deviceInterface, "object");
    t.is(deviceInterface.name, "org.opent2t.test.A");
    t.truthy(deviceInterface.description);
    t.is(deviceInterface.properties.length, 3);
    t.is(deviceInterface.methods.length, 2);
});
