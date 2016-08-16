// In a non-test interface module, this path would be: "opent2t/converters/AllJoynConverter"
var AllJoynSchemaReader = require("../../../build/lib/schema/AllJoynSchemaReader");

module.exports = AllJoynSchemaReader.readThingSchemasFromFile(
    require("path").join(__dirname, "org.opent2t.test.C.xml"))[0];
