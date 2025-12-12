import * as vscode from "vscode";
import { handleXmlDocumentOpen } from "./handleXmlDocumentOpen";


export function activate(context: vscode.ExtensionContext): void {
    const processedFiles = new Set<string>();

    const disposable = vscode.workspace.onDidOpenTextDocument(async (document: vscode.TextDocument) => {
        setTimeout(async () => {
            await handleXmlDocumentOpen(document, processedFiles);
        }, 400);
    });

    const closeDisposable = vscode.workspace.onDidCloseTextDocument((document: vscode.TextDocument) => {
        const filePath = document.uri.fsPath;
        if (processedFiles.has(filePath)) {
            processedFiles.delete(filePath);
        }
    });

    vscode.window.visibleTextEditors.forEach((editor, index) => {
        setTimeout(() => {
            handleXmlDocumentOpen(editor.document, processedFiles);
        }, 1000 + index * 600);
    });

    context.subscriptions.push(disposable, closeDisposable);
}

export function deactivate(): void {}

