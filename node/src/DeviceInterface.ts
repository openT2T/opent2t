
import { Schema } from "jsonschema";

export class DeviceInterface {
    public readonly id: string;
    public readonly version: string;
    public readonly properties: DeviceProperty[];
    public readonly methods: DeviceMethod[];
}

export abstract class DeviceCharacteristic {
    public readonly name: string;
}

export class DeviceProperty extends DeviceCharacteristic {
    public readonly canRead: boolean;
    public readonly canWrite: boolean;
    public readonly canNotify: boolean;
    public readonly propertyType: Schema;
}

export class DeviceMethod extends DeviceCharacteristic {
    public readonly parameters: DeviceParameter[];
    public readonly returnType: Schema;
}

export class DeviceParameter extends DeviceCharacteristic {
    public readonly parameterType: Schema;
}
