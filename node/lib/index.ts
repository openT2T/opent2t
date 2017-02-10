
export { IThingTranslator } from "./IThingTranslator";
export { JsonSchema } from "./JsonSchema";
export {
    ThingCharacteristic,
    ThingSchema,
    ThingMethod,
    ThingProperty,
} from "./ThingSchema";

import { OpenT2T } from "./OpenT2T";
export { OpenT2T };
export default OpenT2T;

export * from "./Logger"
export * from "./ILogger"
export * from "./LoggerUtilities"

import { Logger } from "./Logger";
//let logger = new Logger();

Logger.error("0");
Logger.warn("1");
Logger.info("2");
Logger.verbose("3");
Logger.debug("4");
Logger.silly("5");

