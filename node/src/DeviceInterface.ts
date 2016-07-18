
import { Schema } from "jsonschema";

export abstract class DeviceCharacteristic {
    public readonly name: string;
    public readonly description?: string;
}

export class DeviceInterface extends DeviceCharacteristic {
    public readonly version: string;
    public readonly properties: DeviceProperty[];
    public readonly methods: DeviceMethod[];
}

export class DeviceProperty extends DeviceCharacteristic {
    public readonly canRead: boolean;
    public readonly canWrite: boolean;
    public readonly canNotify: boolean;
    public readonly propertyType: Schema;
}

export class DeviceMethod extends DeviceCharacteristic {
    public readonly parameters: DeviceParameter[];
}

export class DeviceParameter extends DeviceCharacteristic {
    public readonly parameterType: Schema;
    public readonly isOut: boolean;
}
