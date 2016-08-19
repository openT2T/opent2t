// In a non-test interface module, this path would be: "opent2t/schema/AllJoynSchemaReader"
var AllJoynSchemaReader = require("../../build/lib/schema/AllJoynSchemaReader");
var path = require("path");
module.exports = AllJoynSchemaReader.readThingSchemasFromFileAsync(
    path.join(__dirname, path.basename(__filename, ".js") + ".xml")).then(schemas => schemas[0]);
