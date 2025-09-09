import * as vscode from "vscode";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext): void {
    const processedFiles = new Set<string>();

    const disposable = vscode.workspace.onDidOpenTextDocument(async (document: vscode.TextDocument) => {
        await handleXmlDocumentOpen(document, processedFiles);
    });

    vscode.window.visibleTextEditors.forEach((editor) => {
        handleXmlDocumentOpen(editor.document, processedFiles);
    });

    context.subscriptions.push(disposable);
}

export function deactivate(): void {}

async function handleXmlDocumentOpen(document: vscode.TextDocument, processedFiles: Set<string>): Promise<void> {
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

function getEncondingFromFile(filePath: string): string | null {
    try {
        const fdNumber = fs.openSync(filePath, "r");
        const buffer = Buffer.alloc(256);
        fs.readSync(fdNumber, buffer, 0, 256, 0);
        fs.closeSync(fdNumber);

        const header = buffer.toString("ascii");

        const match = header.match(/<\?xml[^>]*encoding=["']([^"']+)["']/i);

        if (match && match[1]) {
            return match[1];
        }
    } catch (e) {
        console.error(e);
    }
    return null;
}

async function reopenWithCorrectEncoding(document: vscode.TextDocument, encoding: string): Promise<void> {
    const filePath = document.uri.fsPath;

    try {
        const buffer = fs.readFileSync(filePath);

        let correctContent: string;
        try {
            const decoder = new TextDecoder(encoding);
            correctContent = decoder.decode(buffer);
        } catch (decodeError: unknown) {
            correctContent = buffer.toString("binary");
            vscode.window.showWarningMessage(`Encoding ${encoding} is not supported.`);
        }

        const currentContent = document.getText();

        if (currentContent !== correctContent) {
            const editor = vscode.window.visibleTextEditors.find((x) => x.document.uri.toString() === document.uri.toString());

            if (editor) {
                const viewColumn = editor.viewColumn;
                const selection = editor.selection;

                await vscode.commands.executeCommand("workbench.action.closeActiveEditor");

                const newDocument = await vscode.workspace.openTextDocument({
                    content: correctContent,
                    language: document.languageId,
                });

                const newEditor = await vscode.window.showTextDocument(newDocument, viewColumn);
                newEditor.selection = selection;

                vscode.window.showInformationMessage(`Reopened with ${encoding} encoding.`);
            }
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        vscode.window.showErrorMessage(`Something went wrong: ${errorMessage}`);
    }
}
