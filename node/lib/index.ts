
export { IThingTranslator } from "./IThingTranslator";
export { JsonSchema } from "./JsonSchema";
export {
    ThingCharacteristic,
    ThingSchema,
    ThingMethod,
    ThingProperty,
} from "./ThingSchema";

export { OpenT2TError } from "./OpenT2TError";
export { OpenT2TConstants } from "./OpenT2TConstants";
import { OpenT2T } from "./OpenT2T";
export { OpenT2T };
export default OpenT2T;

export * from "./Logger"
export * from "./ILogger"
export * from "./LoggerUtilities"

import { Logger } from "./Logger";
let logger = new Logger();

// Test log statements
logger.error("0");
logger.warn("1");
logger.info("2");
logger.verbose("3");
logger.debug("4");
logger.silly("5");
