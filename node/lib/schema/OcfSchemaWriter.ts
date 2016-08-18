
import { JsonSchema } from "../JsonSchema"; // tslint:disable-line:no-unused-variable
import {
    ThingMethod,    // tslint:disable-line:no-unused-variable
    ThingParameter, // tslint:disable-line:no-unused-variable
    ThingSchema,
} from "../ThingSchema";

import * as fs from "mz/fs";

export = OcfSchemaWriter;

/**
 * Writes thing schema specifications in OCF RAML+JSON format.
 */
class OcfSchemaWriter {
    public static async writeThingSchemaToFilesAsync(
            thingSchema: ThingSchema, ramlFilePath: string): Promise<void> {
        let ramlAndJson: { raml: string, json: {[fileName: string]: string}} =
                await OcfSchemaWriter.writeThingSchema(thingSchema);
        await fs.writeFile(ramlFilePath, ramlAndJson.raml, "utf8");

        // TODO: Write each of the JSON files to the same directory as the raml file.
    }

    public static writeThingSchema(
            thingSchema: ThingSchema): { raml: string, json: {[fileName: string]: string}} {
        throw new Error("not implemented");
    }
}
