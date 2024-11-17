import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { execSync } from 'child_process';
import { Logger, LogLevel } from './logger';

export class UnusedPackagesDetector {
    private readonly logger = Logger.getInstance();
    private usedPackages: Set<string> = new Set();
    private allDependencies: Set<string> = new Set();
    private unusedPackages: string[] = [];

    // Essential development packages that shouldn't be considered unused
    private readonly essentialDevPackages = new Set([
        'typescript',
        'ts-node',
        'jest',
        'ts-jest',
        '@types/node',
        '@types/jest'
    ]);

    constructor(private directory: string = process.cwd()) { }

    public async detectUnusedPackages(): Promise<string[]> {
        try {
            await this.loadAllDependencies();
            await this.scanSourceFiles();
            await this.scanConfigFiles();
            this.markEssentialPackages();
            this.analyzeUsage();
            return this.unusedPackages;
        } catch (error: any) {
            this.logger.log(LogLevel.Error, 'Error detecting unused packages:', error);
            throw error;
        }
    }

    public async uninstallUnusedPackages(): Promise<void> {
        try {
            const unusedPackages = await this.detectUnusedPackages();
            if (unusedPackages.length === 0) {
                this.logger.log(LogLevel.Info, 'No unused packages found.');
                return;
            }

            this.logger.log(LogLevel.Info, `Uninstalling ${unusedPackages.length} unused packages...`);
            const uninstallCommand = `npm uninstall ${unusedPackages.join(' ')}`;
            execSync(uninstallCommand, { cwd: this.directory, stdio: 'inherit' });
            this.logger.log(LogLevel.Info, 'Successfully uninstalled unused packages.');
        } catch (error: any) {
            this.logger.log(LogLevel.Error, 'Error uninstalling unused packages:', error);
            throw error;
        }
    }

    private async loadAllDependencies(): Promise<void> {
        const packageJsonPath = path.join(this.directory, 'package.json');
        const packageJson = await fs.readJSON(packageJsonPath);

        const dependencies = packageJson.dependencies || {};
        const devDependencies = packageJson.devDependencies || {};

        Object.keys(dependencies).forEach(dep => this.allDependencies.add(dep));
        Object.keys(devDependencies).forEach(dep => this.allDependencies.add(dep));
    }

    private async scanSourceFiles(): Promise<void> {
        const sourceFiles = await this.findSourceFiles();

        for (const file of sourceFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                this.analyzeFileImports(content);
            } catch (error) {
                this.logger.log(LogLevel.Warn, `Error analyzing file ${file}:`, error);
            }
        }
    }

    private async findSourceFiles(): Promise<string[]> {
        try {
            const files = await glob('**/*.{js,jsx,ts,tsx}', {
                cwd: this.directory,
                ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/coverage/**'],
                absolute: true
            });
            return files;
        } catch (error) {
            this.logger.log(LogLevel.Error, 'Error finding source files:', error);
            throw error;
        }
    }

    private async scanConfigFiles(): Promise<void> {
        // Common configuration files that might reference packages
        const configFiles = [
            'jest.config.js',
            'jest.config.ts',
            'babel.config.js',
            'babel.config.ts',
            '.eslintrc.js',
            '.eslintrc.json',
            'tsconfig.json'
        ];

        for (const configFile of configFiles) {
            const filePath = path.join(this.directory, configFile);
            if (await fs.pathExists(filePath)) {
                try {
                    if (configFile.endsWith('.json')) {
                        const content = await fs.readJSON(filePath);
                        this.analyzeJsonConfig(content);
                    } else {
                        const content = await fs.readFile(filePath, 'utf-8');
                        this.analyzeFileImports(content);
                    }
                } catch (error) {
                    this.logger.log(LogLevel.Warn, `Error analyzing config file ${configFile}:`, error);
                }
            }
        }
    }

    private analyzeJsonConfig(config: any): void {
        // Handle specific config files
        if (config.preset) {
            this.processImport(config.preset);
        }
        if (config.transform) {
            Object.keys(config.transform).forEach(key => {
                this.processImport(config.transform[key]);
            });
        }
        // Add more config-specific analysis as needed
    }


    private analyzeFileImports(content: string): void {
        try {
            const ast = parse(content, {
                sourceType: 'module',
                plugins: ['typescript', 'jsx'],
            });

            traverse(ast, {
                ImportDeclaration: (path) => {
                    const importSource = path.node.source.value;
                    this.processImport(importSource);
                },
                CallExpression: (path) => {
                    if (t.isIdentifier(path.node.callee, { name: 'require' })) {
                        const argument = path.node.arguments[0];
                        if (t.isStringLiteral(argument)) {
                            this.processImport(argument.value);
                        }
                    }
                }
            });
        } catch (error) {
            // Ignore parsing errors for invalid files
        }
    }

    private processImport(importPath: string): void {
        // Extract the package name from the import path
        const packageName = importPath.split('/')[0];
        if (!packageName.startsWith('.')) {
            // Handle @types packages
            if (packageName.startsWith('@types/')) {
                const basePackage = packageName.replace('@types/', '');
                this.usedPackages.add(basePackage);
                this.usedPackages.add(packageName);
            } else {
                this.usedPackages.add(packageName);
            }
        }
    }

    private markEssentialPackages(): void {
        // Mark essential development packages as used
        for (const pkg of this.essentialDevPackages) {
            if (this.allDependencies.has(pkg)) {
                this.usedPackages.add(pkg);
            }
        }

        // Mark all @types packages as used if their base package is used
        for (const dep of this.allDependencies) {
            if (dep.startsWith('@types/')) {
                const basePackage = dep.replace('@types/', '');
                if (this.usedPackages.has(basePackage)) {
                    this.usedPackages.add(dep);
                }
            }
        }
    }

    private analyzeUsage(): void {
        this.unusedPackages = Array.from(this.allDependencies)
            .filter(dep => !this.usedPackages.has(dep));
    }
}