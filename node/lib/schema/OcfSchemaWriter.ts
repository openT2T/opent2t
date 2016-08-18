
import {
    JsonSchema,     // tslint:disable-line:no-unused-variable
    ThingMethod,    // tslint:disable-line:no-unused-variable
    ThingParameter, // tslint:disable-line:no-unused-variable
    ThingProperty,  // tslint:disable-line:no-unused-variable
    ThingSchema,
} from "../ThingSchema";

import * as fs from "mz/fs";

/**
 * Reads and writes device interface specifications in OCF RAML+JSON format.
 */
export class OcfConverter {
    public static async writeThingSchemaToFilesAsync(
            thingSchema: ThingSchema, ramlFilePath: string): Promise<void> {
        let ramlAndJson: { raml: string, json: {[fileName: string]: string}} =
                await OcfConverter.writeThingSchema(thingSchema);
        await fs.writeFile(ramlFilePath, ramlAndJson.raml, "utf8");

        // TODO: Write each of the JSON files to the same directory as the raml file.
    }

    public static writeThingSchema(
            thingSchema: ThingSchema): { raml: string, json: {[fileName: string]: string}} {
        throw new Error("not implemented");
    }
}
