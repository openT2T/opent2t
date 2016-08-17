// Tests for the *PackageCache classes
// using AVA test runner from https://github.com/avajs/ava

import * as path from "path";
import test from "ava";

import {
    PackageSource,
    PackageInfo,
} from "../lib/package";

let testPackageSource = PackageSource.createLocalPackageSource(path.join(__dirname, "../../test"));
const testPackageOne = "opent2t-translator-org-opent2t-test-translators-one";
const testPackageTwo = "opent2t-translator-org-opent2t-test-translators-two";
const testSchemaA = "org.opent2t.test.schemas.a";
const testSchemaB = "org.opent2t.test.schemas.b";
const testTranslatorOne = "org.opent2t.test.translators.one";
const testTranslatorTwo = "org.opent2t.test.translators.two";

test("Get package A info", async t => {
    let packageInfo: PackageInfo | null = await testPackageSource.getPackageInfoAsync(testPackageOne);
    t.is(typeof packageInfo, "object");
    t.not(packageInfo, null);
    if (packageInfo) {
        t.is(packageInfo.name, testPackageOne);
        t.is(typeof packageInfo.version, "string");
        t.true(packageInfo.version.indexOf(".") > 0);
        t.is(typeof packageInfo.description, "string");

        t.true(Array.isArray(packageInfo.schemas));
        t.is(packageInfo.schemas.length, 1);
        t.is(typeof packageInfo.schemas[0], "object");
        t.is(packageInfo.schemas[0].moduleName, testSchemaA + "/" + testSchemaA);

        t.true(Array.isArray(packageInfo.translators));
        t.is(packageInfo.translators.length, 1);
        t.is(typeof packageInfo.translators[0], "object");
        t.is(packageInfo.translators[0].moduleName,
                testSchemaA + "/" + testTranslatorOne + "/js/thingTranslator");
        t.true(Array.isArray(packageInfo.translators[0].schemas));
        t.is(packageInfo.translators[0].schemas.length, 1);
        t.is(packageInfo.translators[0].schemas[0],
            testPackageOne + "/" + testSchemaA + "/" + testSchemaA);

        t.is(typeof packageInfo.translators[0].onboarding, "string");
        t.is(typeof packageInfo.translators[0].onboardingProperties, "object");
    }
});

test("Get package B info", async t => {
    let packageInfo: PackageInfo | null = await testPackageSource.getPackageInfoAsync(testPackageTwo);
    t.is(typeof packageInfo, "object");
    t.not(packageInfo, null);
    if (packageInfo)
    {
        t.is(packageInfo.name, testPackageTwo);
        t.is(typeof packageInfo.version, "string");
        t.true(packageInfo.version.indexOf(".") > 0);
        t.is(typeof packageInfo.description, "string");

        t.true(Array.isArray(packageInfo.schemas));
        t.is(packageInfo.schemas.length, 2);
        t.is(typeof packageInfo.schemas[0], "object");
        t.is(packageInfo.schemas[0].moduleName, testSchemaA + "/" + testSchemaA);
        t.is(typeof packageInfo.schemas[1], "object");
        t.is(packageInfo.schemas[1].moduleName, testSchemaB + "/" + testSchemaB);

        t.true(Array.isArray(packageInfo.translators));
        t.is(packageInfo.translators.length, 1);

        t.is(typeof packageInfo.translators[0], "object");
        t.is(packageInfo.translators[0].moduleName,
                testSchemaB + "/" + testTranslatorTwo + "/js/thingTranslator");
        t.true(Array.isArray(packageInfo.translators[0].schemas));
        t.is(packageInfo.translators[0].schemas.length, 2);
        t.is(packageInfo.translators[0].schemas[0],
                testPackageTwo + "/" + testSchemaA + "/" + testSchemaA);
        t.is(packageInfo.translators[0].schemas[1],
                testPackageTwo + "/" + testSchemaB + "/" + testSchemaB);
    }
});

test("Get all packages info", async t => {
    t.truthy(testPackageSource.getAllPackageInfoAsync);
    if (testPackageSource.getAllPackageInfoAsync) {
        let allPackageInfo: PackageInfo[] = await testPackageSource.getAllPackageInfoAsync();
        t.true(Array.isArray(allPackageInfo));
        t.is(allPackageInfo.length, 2);
        t.is(typeof allPackageInfo[0], "object");
        t.is(allPackageInfo[0].name, testPackageOne);
        t.is(typeof allPackageInfo[0], "object");
        t.is(allPackageInfo[1].name, testPackageTwo);
    }
});
