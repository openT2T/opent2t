// Tests for the *PackageCache classes
// using AVA test runner from https://github.com/avajs/ava

import test from "ava";

import {
    PackageSource,
    PackageInfo,
} from "../lib/packaging";

let testPackageSource = PackageSource.createLocalPackageSource("../../test");
const testPackageA = "@opent2t/test-a";
const testPackageB = "@opent2t/test-b";

test("Get package A info", async t => {
    let packageInfo: PackageInfo | null = await testPackageSource.getPackageInfoAsync(testPackageA);
    t.is(typeof packageInfo, "object");
    if (packageInfo)
    {
        t.is(packageInfo.name, testPackageA);
        t.is(typeof packageInfo.version, "string");
        t.true(packageInfo.version.indexOf(".") > 0);
        t.is(typeof packageInfo.description, "string");

        t.true(Array.isArray(packageInfo.interfaces));
        t.is(packageInfo.interfaces.length, 1);
        t.is(typeof packageInfo.interfaces[0], "object");
        t.is(packageInfo.interfaces[0].moduleName, "InterfaceA");
        t.is(typeof packageInfo.interfaces[0].description, "string");

        t.true(Array.isArray(packageInfo.translators));
        t.is(packageInfo.translators.length, 1);
        t.is(typeof packageInfo.translators[0], "object");
        t.is(packageInfo.translators[0].moduleName, "TranslatorA");
        t.is(typeof packageInfo.translators[0].description, "string");
        t.true(Array.isArray(packageInfo.translators[0].interfaces));
        t.is(packageInfo.translators[0].interfaces.length, 1);
        t.is(packageInfo.translators[0].interfaces[0], testPackageA + "/InterfaceA");

        t.is(typeof packageInfo.translators[0].onboarding, "string");
        t.is(typeof packageInfo.translators[0].onboardingProperties, "object");
    }
});

test("Get package B info", async t => {
    let packageInfo: PackageInfo | null = await testPackageSource.getPackageInfoAsync(testPackageB);
    t.is(typeof packageInfo, "object");
    if (packageInfo)
    {
        t.is(packageInfo.name, "@opent2t/test-b");
        t.is(typeof packageInfo.version, "string");
        t.true(packageInfo.version.indexOf(".") > 0);
        t.is(typeof packageInfo.description, "string");

        t.true(Array.isArray(packageInfo.interfaces));
        t.is(packageInfo.interfaces.length, 2);
        t.is(typeof packageInfo.interfaces[0], "object");
        t.is(packageInfo.interfaces[0].moduleName, "InterfaceB");
        t.is(typeof packageInfo.interfaces[1], "object");
        t.is(packageInfo.interfaces[1].moduleName, "InterfaceC");

        t.true(Array.isArray(packageInfo.translators));
        t.is(packageInfo.translators.length, 2);

        t.is(typeof packageInfo.translators[0], "object");
        t.is(packageInfo.translators[0].moduleName, "TranslatorAB");
        t.true(Array.isArray(packageInfo.translators[0].interfaces));
        t.is(packageInfo.translators[0].interfaces.length, 2);
        t.is(packageInfo.translators[0].interfaces[0], testPackageA + "/InterfaceA");
        t.is(packageInfo.translators[0].interfaces[1], testPackageB + "/InterfaceB");

        t.is(typeof packageInfo.translators[1], "object");
        t.is(packageInfo.translators[1].moduleName, "TranslatorBC");
        t.true(Array.isArray(packageInfo.translators[1].interfaces));
        t.is(packageInfo.translators[1].interfaces.length, 2);
        t.is(packageInfo.translators[1].interfaces[0], testPackageB + "/InterfaceB");
        t.is(packageInfo.translators[1].interfaces[1], testPackageB + "/InterfaceC");
    }
});

test("Get all packages info", async t => {
    t.truthy(testPackageSource.getAllPackageInfoAsync);
    if (testPackageSource.getAllPackageInfoAsync) {
        let allPackageInfo: PackageInfo[] = await testPackageSource.getAllPackageInfoAsync();
        t.true(Array.isArray(allPackageInfo));
        t.is(allPackageInfo.length, 2);
        t.is(typeof allPackageInfo[0], "object");
        t.is(allPackageInfo[0].name, testPackageA);
        t.is(typeof allPackageInfo[0], "object");
        t.is(allPackageInfo[1].name, testPackageB);
    }
});
