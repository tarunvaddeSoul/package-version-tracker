import { PackageVersionTracker } from '../src/PackageVersionTracker';
import fs from 'fs';

describe('PackageVersionTracker', () => {
    let tracker: PackageVersionTracker;

    beforeEach(() => {
        tracker = new PackageVersionTracker();
    });

    test('should read package.json and return a CSV file path', async () => {
        const filePath = await tracker.readPackageJson();
        expect(filePath).toMatch(/\.csv$/);

        expect(fs.existsSync(filePath)).toBe(true); // Confirm file was created

        // Clean up: delete the created file after the test
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        expect(fs.existsSync(filePath)).toBe(false); // Confirm file was deleted
    });

});
