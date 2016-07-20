
import test from 'ava';

import { AllJoynConverter } from "../lib/AllJoynConverter";
import { TypeScriptConverter } from "../lib/TypeScriptConverter";
import { DeviceInterface } from "../lib/DeviceInterface";

import * as fs from "fs";
import * as path from "path";

// Move from /build/test back to /test
process.chdir("../../test");

let ajConverter = new AllJoynConverter();
let allJoynTypeToJsonSchema = ajConverter.allJoynTypeToJsonSchema.bind(ajConverter);

test("AllJoyn type to JSON schema: (ss)", t => {
    t.deepEqual(allJoynTypeToJsonSchema("(ss)"), {
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
    t.deepEqual(allJoynTypeToJsonSchema("(s(is))"), {
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
    t.deepEqual(allJoynTypeToJsonSchema("as"), {
        "type": "array",
        "items": {
            "type": "string"
        }
    });
});
test("AllJoyn type to JSON schema: a{ss}", t => {
    t.deepEqual(allJoynTypeToJsonSchema("a{ss}"), {
        "type": "object",
        "additionalProperties": {
            "type": "string"
        }
    });
});
test("AllJoyn type to JSON schema: a(ss)", t => {
    t.deepEqual(allJoynTypeToJsonSchema("a(ss)"), {
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
    t.deepEqual(allJoynTypeToJsonSchema("a{s(is)}"), {
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
    t.deepEqual(allJoynTypeToJsonSchema("a{s(i(ss))}"), {
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
    let deviceInterface: DeviceInterface = await ajConverter.readAsync("./schemas/A.xml");
    t.is(typeof deviceInterface, "object");
    t.is(deviceInterface.name, "org.opent2t.test.A");
    t.truthy(deviceInterface.description);
    t.is(deviceInterface.properties.length, 3);
    t.is(deviceInterface.methods.length, 2);
});
