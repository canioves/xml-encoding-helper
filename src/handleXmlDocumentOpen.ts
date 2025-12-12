import * as vscode from "vscode";
import { getEncondingFromFile } from "./getEncodingFromFile";
import { reopenWithCorrectEncoding } from "./reopenWithCorrectEncoding";

export async function handleXmlDocumentOpen(document: vscode.TextDocument, processedFiles: Set<string>): Promise<void> {
    const filePath = document.uri.fsPath;
    const fileName = document.fileName.toLowerCase();

    if (processedFiles.has(filePath) || document.uri.scheme !== "file" || (!fileName.endsWith(".xml") && !fileName.endsWith(".xsd"))) {
        return;
    }

    processedFiles.add(filePath);

    try {
        const detectedEncoding = getEncondingFromFile(filePath);

        if (detectedEncoding && detectedEncoding !== "utf-8") {
            await reopenWithCorrectEncoding(document, detectedEncoding);
        }
    } catch (error: unknown) {
        console.error(`Something went wrong: ${error}`);
    }
}
