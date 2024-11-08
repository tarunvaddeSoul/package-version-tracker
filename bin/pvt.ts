#!/usr/bin/env node

import { Command } from 'commander';
import { PackageVersionTracker } from '../src/PackageVersionTracker';
import { Logger, LogLevel } from '../src/logger';
import * as path from 'path';

const program = new Command();

// Configure command-line options
program
  .name('pvt')
  .description('Package Version Tracker CLI')
  .version('1.0.0')
  .option('-d, --directory <directory>', 'Directory containing package.json', process.cwd())
  .option('-o, --output <output>', 'Output CSV file name', '{project-name}_package_version_report.csv')
  .option('--dependencies-only', 'Only scan dependencies (exclude devDependencies)')
  .parse(process.argv);

const options = program.opts();

// Main function
async function main() {
    const logger = Logger.getInstance();

    // Resolve directory and output file path
    const directory = path.resolve(options.directory);
    const outputFile = options.output.replace('{project-name}', path.basename(directory));
    const dependenciesOnly = options.dependenciesOnly || false;

    const tracker = new PackageVersionTracker(directory, outputFile, dependenciesOnly);

    try {
        logger.log(LogLevel.Info, 'Reading package.json...');
        const reportFilePath = await tracker.readPackageJson();

        logger.log(LogLevel.Info, `Report saved to ${reportFilePath}`);
    } catch (error) {
        logger.log(LogLevel.Error, 'Error:', error);
    }
}

main();
