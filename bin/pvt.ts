#!/usr/bin/env node

import { Command } from 'commander';
import { PackageVersionTracker } from '../src/PackageVersionTracker';
import { Logger, LogLevel } from '../src/logger';
import * as path from 'path';
import { UnusedPackagesDetector } from '../src/UnusedPackagesDetector';

const program = new Command();

// Configure command-line options
program
    .name('pvt')
    .description('Package Version Tracker CLI')
    .version('1.0.0')
    .option('-d, --directory <directory>', 'Directory containing package.json', process.cwd())
    .option('-o, --output <output>', 'Output CSV file name', '{project-name}_package_version_report.csv')
    .option('--dependencies-only', 'Only scan dependencies (exclude devDependencies)')
    .option('--get-unused', 'Detect unused packages')
    .option('--remove-unused', 'Remove unused packages')
    .parse(process.argv);

const options = program.opts();

// Main function
async function main() {
    const logger = Logger.getInstance();

    // Resolve directory and output file path
    const directory = path.resolve(options.directory);

    try {
        if (options.getUnused || options.removeUnused) {
            const detector = new UnusedPackagesDetector(directory);

            if (options.removeUnused) {
                await detector.uninstallUnusedPackages();
            } else {
                const unusedPackages = await detector.detectUnusedPackages();
                if (unusedPackages.length === 0) {
                    logger.log(LogLevel.Info, 'No unused packages found.');
                } else {
                    logger.log(LogLevel.Info, 'Unused packages:');
                    unusedPackages.forEach(pkg => {
                        logger.log(LogLevel.Info, `- ${pkg}`);
                    });
                }
            }
        } else {
            const outputFile = options.output.replace('{project-name}', path.basename(directory));
            const dependenciesOnly = options.dependenciesOnly || false;

            const tracker = new PackageVersionTracker(directory, outputFile, dependenciesOnly);
            logger.log(LogLevel.Info, 'Reading package.json...');
            const reportFilePath = await tracker.readPackageJson();
            logger.log(LogLevel.Info, `Report saved to ${reportFilePath}`);
        }
    } catch (error) {
        logger.log(LogLevel.Error, 'Error:', error);
        process.exit(1);
    }
}

main();
