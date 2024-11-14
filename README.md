# Package Version Tracker

[![npm version](https://badge.fury.io/js/package-version-tracker.svg)](https://www.npmjs.com/package/package-version-tracker)

`package-version-tracker` is a command-line interface (CLI) tool that helps track the versions of npm packages in a project. It reads the `package.json` file, analyzes the versions of dependencies, and provides a report, allowing you to keep track of outdated or vulnerable packages easily.

## Why Was This Created?

In large-scale projects, it can become difficult to keep track of the versions of various npm packages and their updates. This tool was created to simplify the process of tracking package versions and generating reports, so developers can easily see when dependencies need to be updated.

The tool helps with:
- **Keeping track of package versions** – Identify which versions of your dependencies are installed and what version ranges are specified.
- **Generating reports** – The tool generates a CSV report detailing the package name, version, and other important metadata.
- **Automation** – As part of a CI/CD pipeline, this tool can be used to regularly check package versions and ensure they are up to date.

## Features

- Analyzes `package.json` and `node_modules` to list package versions.
- Generates a CSV report for easy reference.
- Provides a simple command-line interface (CLI) for quick use.
- Supports automatic creation of a CSV report based on the current package versions in the project.

## Installation

You can install `package-version-tracker` globally or locally via npm:

### Global Installation
```bash
npm install -g package-version-tracker
```
## Usage

   ```bash
   pvt --help
   ```

   This will display the available options, such as:

   - `-d, --directory <directory>`: Directory containing the package.json file (default: current working directory)
   - `-o, --output <output>`: Output file name for the CSV report (default: `{project-name}_package_version_report.csv`)
   - `-d, --dependencies-only`: Only scan dependencies, exclude dev-dependencies

   ## Examples

   1. Generate a report in the current directory:
      ```bash
      pvt
      ```

   2. Generate a report in a different directory:
      ```bash
      pvt --directory /path/to/project
      ```

   3. Generate a report with only dependency versions (exclude dev-dependencies):
      ```bash
      pvt --dependencies-only
      ```

   4. Generate a report with a custom output file name:
      ```bash
      pvt --output my-report.csv
      ```