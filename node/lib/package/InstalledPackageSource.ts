
import { LocalPackageSource } from "./LocalPackageSource";
import { PackageInfo } from "./PackageInfo";

import * as fs from "mz/fs";
import * as path from "path";

/**
 * Reads package metadata and loads package information from a local directory
 * where OpenT2T packages have been npm-installed.
 */
export class InstalledPackageSource extends LocalPackageSource {
    /**
     * Path to the directory where packages are cached. In order to enable requiring
     * modules in these packages without using relative paths, the path should be a
     * node_modules directory that is included in the search path.
     */
    public readonly cacheDirectory: string;

    /**
     * Creates a new InstalledPackageSource with a specified cache directory.
     *
     * @param {string} cacheDirectory  Path to the directory where packages are
     *     npm-installed.
     */
    constructor(cacheDirectory: string) {
        super(cacheDirectory);
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
        let directoryNames: string[] =
                await LocalPackageSource.getSubdirectoriesAsync(this.cacheDirectory);

        for (let i = 0; i < directoryNames.length; i++) {
            let packageName: string = directoryNames[i];
            if (packageName.startsWith("@")) {
                let subdirectoryNames: string[] = await LocalPackageSource.getSubdirectoriesAsync(
                        path.join(this.cacheDirectory, packageName));

                for (let j = 0; j < subdirectoryNames.length; j++) {
                    let subPackageName = packageName + "/" + subdirectoryNames[j];
                    let packageInfo: PackageInfo | null =
                            await this.getPackageInfoAsync(subPackageName);
                    if (packageInfo) {
                        packageInfos.push(packageInfo);
                    }
                }
            } else {
                let packageInfo: PackageInfo | null =
                        await this.getPackageInfoAsync(packageName);
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
        let packageJsonPath: string = path.join(this.cacheDirectory, name, "package.json");

        let packageJsonContents: string;
        try {
            packageJsonContents = await fs.readFile(packageJsonPath, "utf8");
        } catch (error) {
            console.warn("Failed to read package.json for package '" + name + "': " + error.message);
            return null;
        }

        let packageJson: any;
        try {
            packageJson = JSON.parse(packageJsonContents);
        } catch (error) {
            console.warn("Failed to parse package.json for package '" + name + "': " + error.message);
            return null;
        }

        if (!packageJson.opent2t) {
            // Not an OpenT2T translator package. Just return null with no warning.
            return null;
        }

        let packageInfo: PackageInfo | null;
        try {
            packageInfo = PackageInfo.parse(packageJson);
        } catch (error) {
            console.warn("Failed to parse package.json package '" + name + "': " + error.message);
            return null;
        }

        return packageInfo;
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
}
