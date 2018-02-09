import { OpenT2TConstants } from "./OpenT2TConstants";
import { OpenT2TErrorData } from "./OpenT2TErrorData";

/**
 * Custom Error class that extends built-in Error.
 */
export class OpenT2TError extends Error {
    public statusCode: number;
    public innerError: Error;

    constructor(statusCode: number, message: string, innerError?: Error, data?: OpenT2TErrorData) {
        if (!message) {
            message = OpenT2TConstants.InternalServerError;
        }

         //**** Format the message if the user provided data */
        // Bad request
        if (data !== undefined && data !== null) {
            if (statusCode == 400) {
                // Invalid resource
                if (message === OpenT2TConstants.InvalidResource) {
                    message = data.provider + ": " + message + " found " + data.attributeId + " '" + data.value + "'";
                    if(data.expected) {
                        message += "; expected " + data.expected;
                    }
                }
            }
            if (statusCode == 401) {
                // Unauthorized
                if (message === OpenT2TConstants.AccessDenied) {
                    message = data.provider + ": " + message;
                    if(data.details) {
                        message += "; " + data.details;
                    }
                }
            }
            if (statusCode == 440) {
                // Value outside range
                if (message === OpenT2TConstants.RangeCheck) {
                    message = data.provider + ": " + message + " found " + data.attributeId + " '" + data.value
                        + " " + data.unit + "'; expected [" + data.min + ", " + data.max + "]";
                }
            }
            if (statusCode == 442) {
                // Device is off
                if (message === OpenT2TConstants.DeviceOff) {
                    message = data.provider + ": " + message;
                }
            }
        }

        super(message);

        // Set the prototype explicitly due to TS breaking change.
        // Based on 
        // (https://github.com/Microsoft/TypeScript-wiki/blob/master/
        // /Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)

        Object.setPrototypeOf(this, OpenT2TError.prototype);

        if (statusCode) {
            this.statusCode = statusCode;
        } else {
            // TODO: Have a better mapping here based perhaps on innerError type
            this.statusCode = 500; // Default to 500 (InternalServerError)
        }

        if (innerError) {
            this.innerError = innerError;
        }

        this.name = "OpenT2TError";
    }

    public toJSON(): OpenT2TError {
    // copy all fields from `this` to an empty object and return it
    let retObj = Object.assign({}, this, {
      message: this.message
    });

    // Copy fields from the inner error if it exists
    if (this.innerError) {
        // convert fields that need converting
        Object.assign(retObj, {
            innerErrorMessage: this.innerError.message,
            innerErrorName: this.innerError.name,
            innerErrorStack: this.innerError.stack,
        });
    }

    return retObj;
  }
}
