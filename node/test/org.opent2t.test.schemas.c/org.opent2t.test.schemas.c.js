// In a non-test interface module, this path would be: "opent2t/schema/OcfSchemaReader"
var OcfSchemaReader = require("../../build/lib/schema/OcfSchemaReader");
var path = require("path");
module.exports = OcfSchemaReader.readThingSchemaFromFilesAsync(
    path.join(__dirname, path.basename(__filename, ".js") + ".raml"));
