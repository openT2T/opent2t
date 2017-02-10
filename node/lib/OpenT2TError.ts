
/**
 * Custom Error class that extends built-in Error.
 */
export class OpenT2TError extends Error {
    statusCode: number;
    innerError: Error;
 
    constructor(statusCode: number, message: string, innerError?:Error) {
        super(message);

       // Set the prototype explicitly due to TS breaking change.
       // Based on 
       // (https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work)
        
        Object.setPrototypeOf(this, OpenT2TError.prototype);

        if (statusCode){
            this.statusCode = statusCode;
        }
        else
        {
            // TODO: Have a better mapping here based perhaps on innerError type
            this.statusCode = 500; // Default to 500 (InternalServerError)
        }

        if (innerError){
            this.innerError = innerError;
        }

        this.name = "OpenT2TError";
    }
}