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

/**
 * packageInfo in below case (testPackageOne) will be as follows. This helps understand better, without going unconscious.
 * In case of OnboardingFlow (Hub translator), the structure is pretty self evident.
 * 
 * {    description: 'Test translator one',
 *       name: 'opent2t-translator-org-opent2t-test-translators-one',
 *        schemas: [ { moduleName: 'org.opent2t.test.schemas.a/org.opent2t.test.schemas.a' } ],
 *        translators: 
 *        [ { moduleName: 'org.opent2t.test.schemas.a/org.opent2t.test.translators.one/js/thingTranslator',
 *            onboarding: 'opent2t-onboarding-org-opent2t-test-onboarding/org.opent2t.test.onboarding/js/thingOnboarding',
 *            onboardingProperties: { prop1: 'value1', prop2: 'value2' },
 *            schemas: [ 'opent2t-translator-org-opent2t-test-translators-one/org.opent2t.test.schemas.a/org.opent2t.test.schemas.a' ] } ],
 *        onboardingFlow: [],
 *        version: '0.1.0' 
 *    }
 */
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

const testHubPackageOne = "opent2t-translator-com-one-hub";
const testHubSchemaOne = "org.opent2t.sample.hub.superpopular";
const testHubOne = "com.one.hub";

test("Get all packages info", async t => {
    t.truthy(testPackageSource.getAllPackageInfoAsync);
    if (testPackageSource.getAllPackageInfoAsync) {
        let allPackageInfo: PackageInfo[] = await testPackageSource.getAllPackageInfoAsync();
        t.true(Array.isArray(allPackageInfo));
        t.is(allPackageInfo.length, 3);
        t.is(typeof allPackageInfo[0], "object");
        t.is(allPackageInfo[0].name, testHubPackageOne);
        t.is(typeof allPackageInfo[1], "object");
        t.is(allPackageInfo[1].name, testPackageOne);
        t.is(typeof allPackageInfo[2], "object");
        t.is(allPackageInfo[2].name, testPackageTwo);
    }
});


test("Get package A info", async t => {
    let packageInfo: PackageInfo | null = await testPackageSource.getPackageInfoAsync(testHubPackageOne);
    t.is(typeof packageInfo, "object");
    t.not(packageInfo, null);
    if (packageInfo) {
        t.is(packageInfo.name, testHubPackageOne);
        t.is(typeof packageInfo.version, "string");
        t.true(packageInfo.version.indexOf(".") > 0);
        t.is(typeof packageInfo.description, "string");

        t.true(Array.isArray(packageInfo.schemas));
        t.is(packageInfo.schemas.length, 1);
        t.is(typeof packageInfo.schemas[0], "object");
        t.is(packageInfo.schemas[0].moduleName, testHubSchemaOne + "/" + testHubSchemaOne);

        t.true(Array.isArray(packageInfo.translators));
        t.is(packageInfo.translators.length, 1);
        t.is(typeof packageInfo.translators[0], "object");
        t.is(packageInfo.translators[0].moduleName,
                testHubSchemaOne + "/" + testHubOne + "/js/thingTranslator");
        t.true(Array.isArray(packageInfo.translators[0].schemas));
        t.is(packageInfo.translators[0].schemas.length, 1);
        t.is(packageInfo.translators[0].schemas[0],
            testHubPackageOne + "/" + testHubSchemaOne + "/" + testHubSchemaOne);

        t.is(typeof packageInfo.translators[0].onboarding, "string");
        t.is(typeof packageInfo.translators[0].onboardingProperties, "object");

        t.is(typeof packageInfo.translators[0].onboardingFlow[0], "object");
        t.is(typeof packageInfo.translators[0].onboardingFlow[0].name, "string");
        t.is(typeof packageInfo.translators[0].onboardingFlow[0].flow[0], "object");
        t.is(typeof packageInfo.translators[0].onboardingFlow[0].flow[0].type, "string");
        t.is(typeof packageInfo.translators[0].onboardingFlow[0].flow[0].name, "string");
        t.is(typeof packageInfo.translators[0].onboardingFlow[0].flow[0].descriptions, "object");
    }
});

const testOnboardingPackageOne = "opent2t-onboarding-org-opent2t-test-onboarding-one";
const testOnboardingPackageDescription = "Test onboarding one";
const testOnboardingSchemaOne = "org.opent2t.test.onboarding.one";
let testOnboardingPackageSource = PackageSource.createLocalPackageSource(path.join(__dirname, "../../test/onboarding"));
/** PackageInfo structure for below test.
 * { description: 'Test onboarding one',
 *  name: 'opent2t-onboarding-org-opent2t-test-onboarding-one',
 *  onboardingInfo: { 
 *                      moduleName: 'org.opent2t.test.onboarding.one/js/thingOnboarding',
 *                      schemas: [ 'opent2t-onboarding-org-opent2t-test-onboarding-one/org.opent2t.test.onboarding.one/org.opent2t.test.onboarding.one' ] 
 *                  },
 *  schemas: [ { moduleName: 'opent2t-onboarding-org-opent2t-test-onboarding-one/org.opent2t.test.onboarding.one' } ],
 *  translators: [],
 *  version: '1.0.0' }
 */
test("Get onboarding One info", async t => {
    let packageInfo: PackageInfo | null = await testOnboardingPackageSource.getPackageInfoAsync(testOnboardingPackageOne);
    t.is(typeof packageInfo, "object");
    t.not(packageInfo, null);
    if (packageInfo) {
        t.is(packageInfo.name, testOnboardingPackageOne);
        t.is(typeof packageInfo.version, "string");
        t.true(packageInfo.version.indexOf(".") > 0);
        t.is(typeof packageInfo.description, "string");
        t.is(packageInfo.description, testOnboardingPackageDescription);
        t.not(typeof packageInfo.onboardingInfo, null);
        t.is(typeof packageInfo.onboardingInfo, "object");
    }
});