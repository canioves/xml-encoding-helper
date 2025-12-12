import * as vscode from "vscode";
import * as fs from "fs";

export async function reopenWithCorrectEncoding(document: vscode.TextDocument, encoding: string): Promise<void> {
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
                await vscode.commands.executeCommand("workbench.action.closeActiveEditor");
                const newDocument = await vscode.workspace.openTextDocument(document.uri, { encoding: encoding });
                await vscode.window.showTextDocument(newDocument, viewColumn);
                vscode.window.showInformationMessage(`Reopened with ${encoding} encoding.`);
            }
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        vscode.window.showErrorMessage(`Something went wrong: ${errorMessage}`);
    }
}
