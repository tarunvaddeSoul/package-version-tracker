# Package Version Tracker

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
