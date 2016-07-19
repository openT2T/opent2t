
import { IDevice, ITranslator } from "../../lib/ITranslator";
import "../out/org.opent2t.test.A.ts";
import "../out/org.opent2t.test.B.ts";
import "../out/org.opent2t.test.C.ts";

export default class TestTranslatorABC implements ITranslator {
    public createDevice(deviceProps: any): IDevice | Promise<IDevice> {
        return new TestDeviceABC(deviceProps);
    }
}

class TestDeviceABC implements IDevice {
    constructor(deviceProps: any) {
        this.props = deviceProps;
        this.C = new InnerC(this);
    }

    public C: org.opent2t.test.C;

    public props: any;

    as(interfaceName: string): any {
        if (interfaceName == "org.opent2t.test.C") {
            return this.C;
        } else {
            return this;
        }
    }

    public readonly propA1: number;

    public propA2: string;

    public methodA1(): void {
    }

    public methodA2(param1: number, param2: string): boolean {
        return true;
    }

    public addSignalA1Listener(callback: (value: string) => void) {
    }
    public removeSignalA1Listener(callback: (value: string) => void) {
    }

    public readonly propB1: number;

    public propB2: string;

    public methodB1(): void {
    }

    public methodB2(param1: string): void {
    }

    public addSignalBListener(callback: (value: string) => void): void {
    }
    public removeSignalBListener(callback: (value: string) => void): void {
    }
}

class InnerC implements org.opent2t.test.C {
    constructor(outer: TestDeviceABC) {
        this.outer = outer;
    }

    private outer: TestDeviceABC;

    public readonly propB1: number;
    public propC2: string;

    public methodB1(): void {
    }

    public methodC2(param1: number, param2: string): boolean {
        return true;
    }

    public addSignalCListener(callback: (value: string) => void): void {
    }
    public removeSignalCListener(callback: (value: string) => void): void {
    }
}
