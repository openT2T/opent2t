
import { AllJoynConverter } from "../lib/AllJoynConverter";

function testAllJoynType(type) {
    let ajConverter = new AllJoynConverter();
    try {
        let schema = ajConverter.allJoynTypeToJsonSchema(type);
        console.log("\"" + type + "\" => " + JSON.stringify(schema, null, 2));
    } catch (err) {
        console.log(err.stack || err.message);
    }
}

testAllJoynType("(ss)");
testAllJoynType("(s(is))");
testAllJoynType("as");
testAllJoynType("a{ss}");
testAllJoynType("a(ss)");
testAllJoynType("a{s(is)}");
testAllJoynType("a{s(i(ss))}");

(async function testAJSchemaRead(): Promise<void> {
    let ajConverter = new AllJoynConverter();
    try {
        let ajInterface = await ajConverter.readAsync("./schemas/A.xml");
        console.log("Converted AJ interface.");
        console.log(JSON.stringify(ajInterface, null, "  "));
    } catch (err) {
        console.log(err.stack || err.message);
    }
})();

