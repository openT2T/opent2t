
/**
 * Custom Error class that extends built-in Error.
 */
export class OpenT2TConstants {
    // Errors
    public static InternalServerError: string =
        "Unexpected error. Please retry the operation or contact OpenT2T support";

    public static AccessDenied: string = "Access denied";
    public static DeviceNotFound: string  = "Device not found";
    public static HMacSignatureVerificationFailed: string = "Payload signature doesn't match";
    public static InvalidAuthInfoInput: string =
        "Invalid authInfo object. Please provide the existing authInfo object";
    public static InvalidHubId: string = "Invalid hub id";
    public static InvalidResourceId: string = "Invalid resourceId";
    public static MissingTranslator: string = "Cannot find translator module";
    public static MustSubscribeToDevice: string = "Must subscribe to a device";
    public static NotImplemented: string = "Not Implemented";
    public static ResourceNotFound: string = "Resource not found";
    public static UnknownHubSubscribeRequest: string = "Unknown subscription request";
    public static UnknownPlatform: string = "Unknown platform. The requested platform cannot be translated";
}
