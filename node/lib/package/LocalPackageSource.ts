
import { PackageInfo, PackageSchemaInfo, PackageTranslatorInfo } from "./PackageInfo";
import { PackageSource } from "./PackageSource";

import { Parser } from "xml2js";

import * as fs from "mz/fs";
import * as path from "path";

const packagePrefix: string = "opent2t-";

/**
 * Reads package metadata and loads package information from a local source directory.
 *
 * This is complicated because the directory structure doesn't correspond to the
 * packaging structure: There is one package per translator, yet there is one top-level
 * directory per schema.
 *
 * This class supports a git-cloned source directory containing schemas and
 * translators in the same layout as the git repo. While the directory layout is similar
 * to an installed package source, there are important differences:
 *  - The npm-installed source has directories separated (and in some cases duplicated)
 *    across packages, while the git source has all directories merged into a single
 *    tree.
 *  - The npm-installed source has a package.json at the root of each package, that
 *    contains pre-built metadata that makes it unnecessary to scan all subdirectories,
 *    while the git source has a package.json for each translator directory, which is
 *    not actually at the root of the package.
 *
 * Either way, the PackageSource and PackageInfo classes abstract away the directory
 * structure from the rest of the library and consumers of it.
 */
export class LocalPackageSource extends PackageSource {
    /**
     * Merges OpenT2T package information into a package.json object.
     */
    public static mergePackageInfo(packageJson: any, packageInfo: PackageInfo): void {
        packageJson.opent2t = {};

        if (Array.isArray(packageInfo.schemas)) {
            packageJson.opent2t.schemas = {};
            packageInfo.schemas.forEach((schemaInfo: PackageSchemaInfo) => {
                packageJson.opent2t.schemas[schemaInfo.moduleName] = {
                    description: schemaInfo.description,
                };
            });
        }

        if (Array.isArray(packageInfo.translators)) {
            packageJson.opent2t.translators = {};
            packageInfo.translators.forEach((translatorInfo: PackageTranslatorInfo) => {
                packageJson.opent2t.translators[translatorInfo.moduleName] = {
                    description: translatorInfo.description,
                    onboarding: translatorInfo.onboarding,
                    onboardingFlow: translatorInfo.onboardingFlow,
                    onboardingProperties: translatorInfo.onboardingProperties,
                    schemas: translatorInfo.schemas,
                };
            });
        }

        if (packageInfo.onboardingInfo) {
            packageJson.opent2t.onboardingInfo.moduleName = packageInfo.onboardingInfo.moduleName;
            packageJson.opent2t.onboardingInfo.schemas = packageInfo.onboardingInfo.schemas;
        }
    }

    /**
     * Gets all subdirectories (not files) under a directory.
     */
    protected static async getSubdirectoriesAsync(directoryPath: string): Promise<string[]> {
        let directoryNames: string[] = [];
        let childNames: string[] = await fs.readdir(directoryPath);

        for (let i = 0; i < childNames.length; i++) {
            if ((await fs.stat(path.join(directoryPath, childNames[i]))).isDirectory()) {
                directoryNames.push(childNames[i]);
            }
        }

        return directoryNames;
    }

    /**
     * Derive the name of an OpenT2T package.
     *
     * @param {string} name  Reverse-dns style name of an OpenT2T component
     * @param {string} type  Package type such as "translator" or "onboarding"
     * @returns {string} Derived NPM package name.
     */
    private static derivePackageName(name: string, type: string): string {
        return packagePrefix + type + "-" + name.replace(/\./g, "-");
    }

    /**
     * Path to the directory where packages are cached. In order to enable requiring
     * modules in these packages without using relative paths, the path should be a
     * node_modules directory that is included in the search path.
     */
    public readonly sourceDirectory: string;

    /**
     * Creates a new LocalPackageSource with a specified cache or source directory.
     *
     * @param {string} cacheDirectory  Path to the directory where packages are
     *     npm-installed, or path to the root of a cloned OpenT2T source repo.
     */
    constructor(sourceDirectory: string) {
        super();
        this.sourceDirectory = sourceDirectory;
    }

    /**
     * Gets information about all OpenT2T packages currently available from the source.
     * CAUTION: This is a potentially slow operation.
     *
     * @returns {Promise<PackageInfo[]>} An array of package information
     * objects, or an empty array if the cache is empty
     */
    public async getAllPackageInfoAsync(): Promise<PackageInfo[]> {
        let packageInfos: PackageInfo[] = [];
        let packageInfo: PackageInfo | null;

        let directoryNames: string[] =
                await LocalPackageSource.getSubdirectoriesAsync(this.sourceDirectory);

        for (let i = 0; i < directoryNames.length; i++) {
            // Top level directories could be schema or onboarding directories.
            packageInfo = await this.loadSchemaPackageInfoAsync(directoryNames[i]);
            if (!packageInfo) {
                packageInfo = await this.loadOnboardingPackageInfoAsync(directoryNames[i]);
            }

            if (packageInfo) {
                packageInfos.push(packageInfo);
            }

            let subdirectoryNames: string[] =
                    await LocalPackageSource.getSubdirectoriesAsync(
                        path.join(this.sourceDirectory, directoryNames[i]));

            for (let j = 0; j < subdirectoryNames.length; j++) {
                // Second level directories could be translator directories.
                packageInfo = await this.loadTranslatorPackageInfoAsync(
                        directoryNames[i], subdirectoryNames[j]);
                if (packageInfo) {
                    packageInfos.push(packageInfo);
                }
            }
        }

        return packageInfos;
    }

    /**
     * Gets information about an OpenT2T package from the source
     * (potentially without downloading the whole package).
     *
     * @param {string} name  Name of the package
     * @returns {(Promise<PackageInfo | null)} Information about the requested
     * package, or null if the requested package is not found at the source
     */
    public async getPackageInfoAsync(name: string): Promise<PackageInfo | null> {
        const schemaPackagePrefix: string = packagePrefix + "schema-";
        const translatorPackagePrefix: string = packagePrefix + "translator-";
        const onboardingPackagePrefix: string = packagePrefix + "onboarding-";

        if (name.startsWith(schemaPackagePrefix)) {
            let schemaName: string =
                    name.substr(schemaPackagePrefix.length).replace(/-/g, ".");
            return await this.loadSchemaPackageInfoAsync(schemaName);
        } else if (name.startsWith(translatorPackagePrefix)) {
            let translatorName: string =
                    name.substr(translatorPackagePrefix.length).replace(/-/g, ".");
            // Search for a directory with a subdirectory matching the translator name.
            // Unfortunately the parent directory (schema name) a translator is under might
            // not be known ahead of time, so this search is required.
            let directoryNames: string[] = await LocalPackageSource.getSubdirectoriesAsync(
                    this.sourceDirectory);
            for (let i = 0; i < directoryNames.length; i++) {
                let subdirectoryNames: string[] = await LocalPackageSource.getSubdirectoriesAsync(
                        path.join(this.sourceDirectory, directoryNames[i]));
                if (subdirectoryNames.indexOf(translatorName) >= 0) {
                    return await this.loadTranslatorPackageInfoAsync(
                            directoryNames[i], translatorName);
                }
            }
            return null;
        } else if (name.startsWith(onboardingPackagePrefix)) {
            let onboardingName: string =
                    name.substr(onboardingPackagePrefix.length).replace(/-/g, ".");
            return await this.loadOnboardingPackageInfoAsync(onboardingName);
        } else {
            // TODO: Scan all package.json files to find one with matching package name??
            return null;
        }
    }

    /**
     * Copies a package to a target directory.
     *
     * @param {string} name  Name of the package
     * @param {string} targetDirectory  Directory where the package is to be copied
     */
    public copyPackageAsync(name: string, targetDirectory: string): Promise<void> {
        throw new Error("Not implemented.");
    }

    /**
     * Load schema package information from a schema directory.
     */
    private async loadSchemaPackageInfoAsync(schemaName: string): Promise<PackageInfo | null> {
        // By convention there is a .js file with the same name as the schema directory,
        // so the module path is just the name/name. Note schemas are not required to
        // have a package.json that enables them to be packaged separately; they may only
        // be packaged along with translators. In that case NO schema package info will
        // be loaded here.
        let schemaModulePath = schemaName + "/" + schemaName;
        let schemaPackageJsonPath = schemaName + "/package.json";

        if (!(await fs.exists(path.join(this.sourceDirectory, schemaModulePath + ".js"))) ||
                !(await fs.exists(path.join(this.sourceDirectory, schemaPackageJsonPath)))) {
            // The requested schema package was not found.
            return null;
        }

        let packageJson: any = await this.loadJsonAsync(schemaPackageJsonPath);
        return {
            description: packageJson.description,
            name: packageJson.name,
            onboardingInfo: null,
            schemas: [{
                moduleName: schemaModulePath,
            }],
            translators: [],
            version: packageJson.version,
        };
    }

    /**
     * Load translator package information from package.json and manifest.xml files
     * in a translator directory.
     */
    private async loadTranslatorPackageInfoAsync(
            schemaName: string, translatorName: string): Promise<PackageInfo | null> {
        // By convention there is a thingTranslator.js file under a "js" directory,
        // under a directory with the translator name, under the schema directory.
        // And there should be manifest.xml and package.json files alongside it.
        let translatorModulePath = schemaName + "/" + translatorName + "/js/thingTranslator";
        let translatorManifestPath = schemaName + "/" + translatorName + "/js/manifest.xml";
        let translatorPackageJsonPath = schemaName + "/" + translatorName + "/js/package.json";

        if (!(await fs.exists(path.join(this.sourceDirectory, translatorModulePath + ".js"))) ||
                !(await fs.exists(path.join(this.sourceDirectory, translatorManifestPath))) ||
                !(await fs.exists(path.join(this.sourceDirectory, translatorPackageJsonPath)))) {
            // The requested translator package was not found.
            return null;
        }

        let packageJson: any = await this.loadJsonAsync(translatorPackageJsonPath);
        let manifestXml: any = await this.loadXmlAsync(translatorManifestPath);
        let manifestXmlRoot: any = manifestXml && manifestXml.manifest;

        if (!packageJson || !manifestXmlRoot) {
            return null;
        }

        // Parse schema info from the manifest.
        let schemaInfos: any[] = [];
        let schemaModulePaths: string[] = [];
        if (Array.isArray(manifestXmlRoot.schemas) &&
                manifestXmlRoot.schemas.length === 1 &&
                Array.isArray(manifestXmlRoot.schemas[0].schema)) {
            let schemaElements = manifestXmlRoot.schemas[0].schema;

            let mainSchemas = schemaElements.filter(
                    (schemaElement: any) => schemaElement.$ && schemaElement.$.main === "true");
            if (mainSchemas.length > 0) {
                // If one or more of the schemas are marked as "main", ignore the others.
                // Otherwise use all of them.
                schemaElements = mainSchemas;
            }

            schemaElements.forEach((schemaElement: any) => {
                let schemaId: string = schemaElement.$.id;
                if (schemaId) {
                    // By convention the schema module file and its parent directory
                    // both match the name of the schema.
                    let schemaModulePath: string = schemaId + "/" + schemaId;
                    schemaModulePaths.push(packageJson.name + "/" + schemaModulePath);
                    schemaInfos.push({
                        moduleName: schemaModulePath,
                    });
                }
            });
        }

        // Parse onboarding info from the manifest.
        let onboardingModulePath: string = "";
        let onboardingProperties: any = {};
        let onboardingFlowElements: any[] = [];
        if (Array.isArray(manifestXmlRoot.onboarding) &&
                manifestXmlRoot.onboarding.length === 1) {
            let onboardingElement = manifestXmlRoot.onboarding[0];
            let onboardingId = onboardingElement.$.id;
            if (onboardingId) {
                // By convention the onboarding module is in a package whose name is derived
                // from the onboarding id.
                let onboardingPackageName: string =
                        LocalPackageSource.derivePackageName(onboardingId, "onboarding");
                onboardingModulePath = onboardingPackageName + "/" + onboardingId + "/js/thingOnboarding";

                if (Array.isArray(onboardingElement.arg)) {
                    onboardingElement.arg.forEach((argElement: any) => {
                        let argName: string = argElement.$.name;
                        let argValue: string = argElement.$.value;
                        if (argName) {
                            onboardingProperties[argName] = (argValue || "");
                        }
                    });
                }

                if (Array.isArray(onboardingElement.onboardflow)) {
                    onboardingElement.onboardflow.forEach((onboardFlowElement: any) => {
                        let flowElements: any[] = [];
                        let onboardFlowName: string = onboardFlowElement.$.name;
                        if (Array.isArray(onboardFlowElement.flow)) {
                            onboardFlowElement.flow.forEach((flowElement: any) => {
                                let descriptionProperties: any = {};
                                flowElement.description.forEach((descriptionElement: any) => {
                                    descriptionProperties[descriptionElement.$.language] = descriptionElement._;
                                }); // <description>
                                flowElements.push({
                                    descriptions: descriptionProperties,
                                    name: flowElement.arg[0].$.name,
                                    type: flowElement.$.type,
                                });
                            }); // <flow>
                        }
                        onboardingFlowElements.push({
                            flow: flowElements,
                            name: onboardFlowName,
                        });
                    }); // <onboardflow>
                }
            }
        }

        return {
            description: packageJson.description,
            name: packageJson.name,
            onboardingInfo: null,
            schemas: schemaInfos,
            translators: [{
                moduleName: translatorModulePath,
                onboarding: onboardingModulePath,
                onboardingFlow: onboardingFlowElements,
                onboardingProperties: onboardingProperties,
                schemas: schemaModulePaths,
            }],
            version: packageJson.version,
        };
    }

    private async loadOnboardingPackageInfoAsync(
        onboardingName: string): Promise<PackageInfo | null> {

        // By convention there is package.json files under 'js' directory. 
        let onboardingManifestPath = onboardingName + "/js/manifest.xml";
        let onboardinPackageJsonPath = onboardingName + "/js/package.json";
        let translatorModulePath = onboardingName + "/js/thingOnboarding";

        if (!(await fs.exists(path.join(this.sourceDirectory, translatorModulePath + ".js"))) ||
            !(await fs.exists(path.join(this.sourceDirectory, onboardingManifestPath))) ||
            !(await fs.exists(path.join(this.sourceDirectory, onboardinPackageJsonPath)))) {
            // The requested onboarding package was not found.
            return null;
        }

        let packageJson: any = await this.loadJsonAsync(onboardinPackageJsonPath);
        let manifestXml: any = await this.loadXmlAsync(onboardingManifestPath);
        let manifestXmlRoot: any = manifestXml && manifestXml.manifest;

        if (!packageJson || !manifestXmlRoot) {
            return null;
        }

        // Parse schema info from the manifest.
        let schemaInfos: any[] = [];
        let schemaModulePaths: string[] = [];
        if (Array.isArray(manifestXmlRoot.schemas) &&
                manifestXmlRoot.schemas.length == 1 &&
                Array.isArray(manifestXmlRoot.schemas[0].schema)) {
            let schemaElements = manifestXmlRoot.schemas[0].schema;
           // TODO: Will onboarding schemas also have 'main' schema concept ?

            schemaElements.forEach((schemaElement: any) => {
                let schemaId: string = schemaElement.$.id;
                if (schemaId) {
                    // By convention the schema module file and its parent directory
                    // both match the name of the schema.
                    let schemaModulePath: string = packageJson.name + "/" + schemaId + "/" + schemaId;
                    schemaModulePaths.push(schemaModulePath);
                    schemaInfos.push({
                        moduleName: schemaModulePath
                    });
                }
            });
        }

        return {
            description: packageJson.description,
            name: packageJson.name,
            onboardingInfo: {
                moduleName: translatorModulePath,
                schemas: schemaModulePaths },
            schemas: schemaInfos,
            translators: [],
            version: packageJson.version,
        };
    }

    /**
     * Reads a file and returns the contents parsed as JSON, or null if reading or parsing failed.
     */
    private async loadJsonAsync(jsonFilePath: string): Promise<any> {
        let jsonString: string;
        try {
            jsonString = await fs.readFile(
                    path.join(this.sourceDirectory, jsonFilePath), "utf8");
        } catch (error) {
            console.warn("Failed to read file '" + jsonFilePath + "': " + error.message);
            return null;
        }

        let json: any;
        try {
            json = JSON.parse(jsonString);
        } catch (error) {
            console.warn("Failed to parse file '" + jsonFilePath + "': " + error.message);
            return null;
        }

        return json;
    }

    /**
     * Reads a file and returns the contents parsed as XML, or null if reading or parsing failed.
     */
    private async loadXmlAsync(xmlFilePath: string): Promise<any> {
        let xmlString: string;
        try {
            xmlString = await fs.readFile(
                    path.join(this.sourceDirectory, xmlFilePath), "utf8");
        } catch (error) {
            console.warn("Failed to read file '" + xmlFilePath + "': " + error.message);
            return null;
        }

        return await new Promise<any>((resolve, reject) => {
            new Parser({
                async: true,
            }).parseString(xmlString, (error: Error, xml: any) => {
                if (error) {
                    console.warn("Failed to parse file '" + xmlFilePath + "': " + error.message);
                    resolve(null);
                } else {
                    resolve(xml);
                }
            });
        });
    }
}
