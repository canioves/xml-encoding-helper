import * as fs from "fs";

export function getEncondingFromFile(filePath: string): string | null {
    try {
        const fdNumber = fs.openSync(filePath, "r");
        const buffer = Buffer.alloc(256);
        fs.readSync(fdNumber, buffer, 0, 256, 0);
        fs.closeSync(fdNumber);

        const header = buffer.toString("ascii");
        const match = header.match(/<\?xml[^>]*encoding=["']([^"']+)["']/i);

        if (match && match[1]) {
            console.log(match[1]);
            return match[1];
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}