
const EventEmitter = require('events');

export default new TestTranslatorABC();

class TestTranslatorABC {
    createDevice(deviceProps) {
        return new TestDeviceABC(deviceProps);
    }
}

class TestDeviceABC extends EventEmitter {
    constructor(deviceProps) {
        this.props = deviceProps;
        this.C = new InnerC(this);
    }
    as(interfaceName) {
        if (interfaceName == "org.opent2t.test.C") {
            return this.C;
        }
        else {
            return this;
        }
    }
    methodA1() {
    }
    methodA2(param1, param2) {
        return true;
    }
    methodB1() {
    }
    methodB2(param1) {
    }
}

class InnerC extends EventEmitter {
    constructor(outer) {
        this.outer = outer;
    }
    methodB1() {
    }
    methodC2(param1, param2) {
        return true;
    }
}
