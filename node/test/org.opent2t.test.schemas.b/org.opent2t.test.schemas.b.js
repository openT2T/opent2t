// In a non-test interface module, this path would be: "opent2t/schema/AllJoynSchemaReader"
var AllJoynSchemaReader = require("../../build/lib/schema/AllJoynSchemaReader");
var path = require("path");
module.exports = AllJoynSchemaReader.readThingSchemasFromFile(
    path.join(__dirname, path.basename(__filename, ".js") + ".xml"))[0];
