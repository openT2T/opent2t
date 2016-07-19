/// <reference path="../typings/index.d.ts" />

import { AllJoynConverter } from "../lib/AllJoynConverter";
import { TypeScriptConverter } from "../lib/TypeScriptConverter";

import * as fs from "fs";
import * as path from "path";

(async function test(): Promise<void> { try {

function testAllJoynTypeToJsonSchema(type: string) {
    let ajConverter = new AllJoynConverter();
    let schema = ajConverter.allJoynTypeToJsonSchema(type);
    console.log("\"" + type + "\" => " + JSON.stringify(schema, null, 2));
}

testAllJoynTypeToJsonSchema("(ss)");
testAllJoynTypeToJsonSchema("(s(is))");
testAllJoynTypeToJsonSchema("as");
testAllJoynTypeToJsonSchema("a{ss}");
testAllJoynTypeToJsonSchema("a(ss)");
testAllJoynTypeToJsonSchema("a{s(is)}");
testAllJoynTypeToJsonSchema("a{s(i(ss))}");

async function testAllJoynSchemaToTypeScript(schemaFilePath: string, outDirPath: string, display: boolean) {
    let ajConverter = new AllJoynConverter();
    let deviceInterface = await ajConverter.readAsync(schemaFilePath);
    if (display) {
        console.log("AllJoyn schema to DeviceInterface:");
        console.log(JSON.stringify(deviceInterface, null, "  "));
    }

    let tsConverter = new TypeScriptConverter();
    await tsConverter.writeAsync(deviceInterface, outDirPath);
    let ts = fs.readFileSync(path.join(outDirPath, deviceInterface.name + ".ts"), "utf8");
    if (display) {
        console.log("DeviceInterface to TypeScript:");
        console.log(ts);
    }
}

let outDirPath = "./out";
if (!fs.statSync(outDirPath)) fs.mkdirSync(outDirPath);
await testAllJoynSchemaToTypeScript("./schemas/A.xml", outDirPath, true);
await testAllJoynSchemaToTypeScript("./schemas/B.xml", outDirPath, false);
await testAllJoynSchemaToTypeScript("./schemas/C.xml", outDirPath, false);

} catch (err) {
    console.log(err.stack || err.message);
}})();
