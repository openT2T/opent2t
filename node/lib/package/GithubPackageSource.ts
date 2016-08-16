
import { PackageInfo } from "./PackageInfo";
import { PackageSource } from "./PackageSource";

/**
 * Acquires OpenT2T packages from a GitHub repo.
 *
 * To acquire from multiple repos and/or paths, use a PackageSourceUnion.
 */
export class GithubPackageSource extends PackageSource {
    public readonly repo: string;
    public readonly path: string;
    public readonly ref: string;

    constructor(repo: string, path: string, ref: string) {
        super();
        this.repo = repo;
        this.path = path;
        this.ref = ref || "master";
    }

    /**
     * Gets information about an OpenT2T package from the source
     * (potentially without downloading the whole package).
     *
     * @param {string} name  Name of the package
     * @returns {(Promise<PackageInfo | null)} Information about the requested
     * package, or null if the requested package is not found at the source
     */
    public getPackageInfoAsync(name: string): Promise<PackageInfo | null> {
        // TODO: Download package.json from github.com/repo/path
        throw new Error("Not implemented.");
    }

    /**
     * Downloads or copies a package to a target (cache) directory.
     *
     * @param {string} name  Name of the package
     * @param {string} targetDirectory  Directory where the package is to be extracted
     */
    public copyPackageAsync(name: string, targetDirectory: string): Promise<void> {
        // TODO: Check name prefix for package type (translator or onboarding)
        // TODO: Download all package files from GitHub
        throw new Error("Not implemented.");
    }
}
