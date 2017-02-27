export namespace Utilities {
    export function cloneObject(source: any) {
        if (source === null) {
            return null;
        }

        let target: any;
        let tmpValue: any;
        let key: string;
        let checkType: (anyVar: any) => boolean = function (value) {
            return value === undefined ||
                   value === null ||
                   typeof value === "string" ||
                   typeof value === "number" ||
                   typeof value === "boolean";
        };

        if (checkType(source)) {
            return source; // we are cloning a primitive, so no cloning needed;
        }

        if (source.constructor === Array) {
            target = [];
            for (let i = 0; i < source.length; i++) {
                tmpValue = source[i];
                if (checkType(tmpValue)) {
                    target.push(tmpValue);
                } else {
                    target.push(cloneObject(source[i]));
                }
            }
        } else {
            target = {};
            for (key in source) {
                tmpValue = source[key];
                if (checkType(tmpValue)) {
                    target[key] = tmpValue;
                } else { // it must be an object...
                    target[key] = cloneObject(source[key]); // we won't go to the object nested level...
                }
            }
        }

        return target;
    }
}
