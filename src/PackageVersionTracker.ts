import * as fs from 'fs-extra';
import * as path from 'path';
import * as csv from 'fast-csv';
import * as semver from 'semver';
import * as http from 'http';
import * as https from 'https';
import { Logger, LogLevel } from './logger';

export class PackageVersionTracker {
    private projectName: string;
    private report: Array<{
        packageName: string;
        currentVersion: string;
        lastChecked: string;
        latestVersion: string;
        updateNeeded: boolean;
        notes: string;
        type: 'dependency' | 'devDependency';
    }>;

    private readonly logger = Logger.getInstance();

    constructor(
        private directory: string = process.cwd(),
        private outputFile: string = `${path.basename(process.cwd())}_package_version_report.csv`,
        private dependenciesOnly: boolean = false
    ) {
        this.projectName = path.basename(this.directory);
        this.report = [];
    }

    public async readPackageJson(): Promise<string> {
        try {
            const packageJsonPath = path.join(this.directory, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                throw new Error(`package.json file not found in ${this.directory}`);
            }

            const packageJson = await fs.readJSON(packageJsonPath);

            if (!packageJson.dependencies && !packageJson.devDependencies) {
                throw new Error('Invalid package.json file: no dependencies or devDependencies found');
            }

            await this.processPackages(packageJson.dependencies, 'dependency');
            if (!this.dependenciesOnly) {
                await this.processPackages(packageJson.devDependencies, 'devDependency');
            }

            return await this.generateCSVReport();
        } catch (error: any) {
            this.logger.log(LogLevel.Error, 'Error reading package.json:', error);
            throw new Error(`Could not read package.json: ${error.message}`);
        }
    }


    private async processPackages(
        packages: Record<string, string>,
        type: 'dependency' | 'devDependency'
    ): Promise<void> {
        const totalPackages = Object.keys(packages).length;
        let processedPackages = 0;
        for (const [packageName, version] of Object.entries(packages)) {
            const latestVersion = await this.getLatestVersion(packageName);
            const updateNeeded = latestVersion && this.isSemverUpdateAvailable(version, latestVersion);
            this.report.push({
                packageName,
                currentVersion: version,
                lastChecked: new Date().toISOString(),
                latestVersion: latestVersion || 'Unknown',
                updateNeeded: !!updateNeeded,
                notes: updateNeeded ? `Update available: ${latestVersion}` : '',
                type,
            });
            processedPackages++;
            this.logger.log(LogLevel.Info, `[${processedPackages}/${totalPackages}] Processed ${packageName}`);
        }
    }

    private isSemverUpdateAvailable(currentVersion: string, latestVersion: string): boolean {
        try {
            return semver.gt(latestVersion, currentVersion);
        } catch (error) {
            // If the version string cannot be parsed by semver, assume an update is available
            return true;
        }
    }

    private async getLatestVersion(packageName: string): Promise<string | null> {
        try {
            const registryUrl = `https://registry.npmjs.org/${packageName}`;
            const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
                https.get(registryUrl, resolve).on('error', reject);
            });

            if (response.statusCode === 200) {
                const data = await new Promise<any>((resolve, reject) => {
                    let body = '';
                    response.on('data', (chunk) => { body += chunk.toString(); });
                    response.on('end', () => { resolve(JSON.parse(body)); });
                    response.on('error', reject);
                });
                return data['dist-tags'].latest;
            } else {
                return null;
            }
        } catch (error) {
            return null;
        }
    }

    // Generates CSV report in the current directory
    public async generateCSVReport(): Promise<string> {
        const filePath = path.join(this.directory, this.outputFile);
        const csvStream = csv.format({
            headers: [
                'Package',
                'Current Version',
                'Last Checked',
                'Latest Version',
                'Update Needed',
                'Notes',
                'Type'
            ]
        });

        // Create write stream to CSV file
        const writeStream = fs.createWriteStream(filePath);
        csvStream.pipe(writeStream);

        // Add report data to CSV
        for (const row of this.report) {
            // Map row properties to match CSV headers exactly
            csvStream.write({
                'Package': row.packageName,
                'Current Version': row.currentVersion,
                'Last Checked': row.lastChecked,
                'Latest Version': row.latestVersion,
                'Update Needed': row.updateNeeded ? 'Yes' : 'No',
                'Notes': row.notes,
                'Type': row.type
            });
        }

        csvStream.end();

        // Return file path for reference
        return new Promise((resolve, reject) => {
            writeStream.on('finish', () => resolve(filePath));
            writeStream.on('error', reject);
        });
    }
}