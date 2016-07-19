
import { DeviceInterface } from "./DeviceInterface";

/**
 * Interface for classes that can read and/or write device interface specifications
 * from/to file(s). The format of the file(s) depends on the subclass implementation.
 */
export interface IDeviceInterfaceConverter {
    /**
     * Reads a device interface specification from a file.
     */
    readAsync?(sourceFilePath: string): Promise<DeviceInterface>;

    /**
     * Writes a device interface specification to a file.
     */
    writeAsync?(deviceInterface: DeviceInterface, targetDirectoryPath: string): Promise<void>;
}
