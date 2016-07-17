
import { AllJoynDeviceInterfaceConverter } from "../lib/AllJoynDeviceInterfaceConverter";

(async function testAJSchemaRead(): Promise<void> {
    let ajConverter = new AllJoynDeviceInterfaceConverter();
    try {
        let ajInterface = await ajConverter.readAsync("./schemas/A.xml");
        console.log("Converted AJ interface.");
        console.dir(ajInterface);
    } catch (err) {
        console.log(err.message);
    }
})();