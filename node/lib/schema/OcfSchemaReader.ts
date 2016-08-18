
import {
    JsonSchema,     // tslint:disable-line:no-unused-variable
    ThingMethod,    // tslint:disable-line:no-unused-variable
    ThingParameter, // tslint:disable-line:no-unused-variable
    ThingProperty,  // tslint:disable-line:no-unused-variable
    ThingSchema,
} from "../ThingSchema";

import * as fs from "mz/fs";

/**
 * Reads thing schema specifications in OCF RAML+JSON format.
 */
export class OcfSchemaReader {
    public static readThingSchemaFromFiles(ramlFilePath: string): ThingSchema {
        let raml = fs.readFileSync(ramlFilePath, "utf8");

        // TODO: Scan for `!include *.json` lines in the RAML, then load JSON files (sync).
        // TODO: Scan for `$ref` objects in each JSON, then recursively load references (sync).
        // (Both sync and async read implementations may be desirable in difference scenarios.)

        throw new Error("not implemented");
    }

    public static async readThingSchemaFromFilesAsync(
            ramlFilePath: string): Promise<ThingSchema> {
        let raml = await fs.readFile(ramlFilePath, "utf8");

        // TODO: Scan for `!include *.json` lines in the RAML, then load JSON files (async).
        // TODO: Scan for `$ref` objects in each JSON, then recursively load references (async).

        throw new Error("not implemented");
    }

    public static readThingSchema(
            raml: string, json: {[fileName: string]: string}): ThingSchema {
        throw new Error("not implemented");
    }
}
