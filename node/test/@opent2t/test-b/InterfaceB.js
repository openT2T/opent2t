// In a non-test translator, this module path would be: "opent2t/converters/AllJoynConverter"
var AllJoynConverter = require("../../../build/lib/converters/AllJoynConverter");

module.exports = AllJoynConverter.readDeviceInterfacesFromFile(
    require("path").join(__dirname, "B.xml"))[0];
