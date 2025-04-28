"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = require("vscode");
function activate(context) {
    // Helper function to calculate the visual column position of a character index
    const getVisualColumn = (lineText, charIndex, tabSize) => {
        let column = 0;
        for (let i = 0; i < charIndex; i++) {
            if (lineText[i] === '\t') {
                column = Math.ceil((column + 1) / tabSize) * tabSize;
            }
            else {
                column++;
            }
        }
        return column;
    };
    // Function to update the context key based on cursor position
    const updateCursorContext = () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'vhdl') {
            vscode.commands.executeCommand('setContext', 'vhdlCommentAligner.cursorBeforeComment', false);
            return;
        }
        let isBeforeComment = false;
        for (const selection of editor.selections) {
            const line = editor.document.lineAt(selection.active.line);
            const text = line.text;
            const commentIndex = text.indexOf('--');
            // Check if cursor is immediately before --
            if (commentIndex !== -1 && selection.active.character === commentIndex) {
                isBeforeComment = true;
                break;
            }
        }
        vscode.commands.executeCommand('setContext', 'vhdlCommentAligner.cursorBeforeComment', isBeforeComment);
    };
    // Update context key on selection or editor change
    context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(updateCursorContext), vscode.window.onDidChangeActiveTextEditor(updateCursorContext));
    // Initial update of context key
    updateCursorContext();
    // Command to handle Tab key for indenting comments
    const alignCommentOnTab = vscode.commands.registerCommand('vhdlCommentAligner.alignCommentOnTab', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'vhdl') {
            return;
        }
        const config = vscode.workspace.getConfiguration('vhdlCommentAligner');
        const tabStop = config.get('tabStop', 100);
        const tabSize = vscode.workspace.getConfiguration('editor').get('tabSize', 4);
        const targetColumn = tabStop - 1; // Convert to 0-based for internal calculations
        await editor.edit(editBuilder => {
            const newSelections = [];
            for (const selection of editor.selections) {
                const line = editor.document.lineAt(selection.active.line);
                const text = line.text;
                const commentIndex = text.indexOf('--');
                // Skip if there's no comment or the cursor is not immediately before --
                if (commentIndex === -1 || selection.active.character !== commentIndex) {
                    newSelections.push(selection);
                    continue;
                }
                // Calculate the visual column position of --
                const currentCommentPosition = getVisualColumn(text, commentIndex, tabSize);
                // Skip if the comment is already at or beyond the target column
                if (currentCommentPosition >= targetColumn) {
                    newSelections.push(selection);
                    continue;
                }
                // Split the line into non-comment and comment parts
                const beforeComment = text.substring(0, commentIndex);
                const commentText = text.substring(commentIndex).trim();
                const trimmedBeforeComment = beforeComment.trimEnd();
                const trimmedLength = getVisualColumn(trimmedBeforeComment, trimmedBeforeComment.length, tabSize);
                // Calculate spaces needed to reach the target column
                const spacesNeeded = targetColumn - trimmedLength;
                const spaces = ' '.repeat(spacesNeeded);
                const newLineText = trimmedBeforeComment + spaces + commentText;
                // Replace the line
                const lineRange = line.range;
                editBuilder.replace(lineRange, newLineText);
                // Update the cursor position to just before the -- (at targetColumn, which is tabStop - 1)
                const newPosition = new vscode.Position(line.lineNumber, trimmedBeforeComment.length + spacesNeeded);
                newSelections.push(new vscode.Selection(newPosition, newPosition));
            }
            // Update all cursor positions after the edit
            editor.selections = newSelections;
        });
        // Ensure the context key is updated after the edit to prevent cursor movement
        updateCursorContext();
    });
    // Command to handle Backspace key for de-indenting comments
    const deIndentCommentOnBackspace = vscode.commands.registerCommand('vhdlCommentAligner.deIndentCommentOnBackspace', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'vhdl') {
            return;
        }
        const config = vscode.workspace.getConfiguration('vhdlCommentAligner');
        const tabStop = config.get('tabStop', 100);
        const tabSize = vscode.workspace.getConfiguration('editor').get('tabSize', 4);
        const targetColumn = tabStop - 1; // Convert to 0-based for internal calculations
        let shouldHandle = false;
        const newSelections = [];
        for (const selection of editor.selections) {
            const line = editor.document.lineAt(selection.active.line);
            const text = line.text;
            const commentIndex = text.indexOf('--');
            // Skip if there's no comment or the cursor is not immediately before --
            if (commentIndex === -1 || selection.active.character !== commentIndex) {
                newSelections.push(selection);
                continue;
            }
            // Calculate the visual column position of --
            const currentCommentPosition = getVisualColumn(text, commentIndex, tabSize);
            // Only handle de-indentation if the comment is past the target column
            if (currentCommentPosition > targetColumn) {
                shouldHandle = true;
                // Split the line into non-comment and comment parts
                const beforeComment = text.substring(0, commentIndex);
                const commentText = text.substring(commentIndex).trim();
                const trimmedBeforeComment = beforeComment.trimEnd();
                const trimmedLength = getVisualColumn(trimmedBeforeComment, trimmedBeforeComment.length, tabSize);
                // De-indent to the target column
                const spacesNeeded = targetColumn - trimmedLength;
                const spaces = ' '.repeat(spacesNeeded);
                const newLineText = trimmedBeforeComment + spaces + commentText;
                // Replace the line
                const lineRange = line.range;
                editor.edit(editBuilder => {
                    editBuilder.replace(lineRange, newLineText);
                });
                // Update the cursor position to just before the tab stop (so -- starts at tabStop)
                const newPosition = new vscode.Position(line.lineNumber, trimmedBeforeComment.length + spacesNeeded);
                newSelections.push(new vscode.Selection(newPosition, newPosition));
            }
            else {
                // If at or before the target column, let the default Backspace behavior occur
                newSelections.push(selection);
            }
        }
        // Update all cursor positions after the edit
        editor.selections = newSelections;
        // If we didn't handle the Backspace, execute the default Backspace command
        if (!shouldHandle) {
            return vscode.commands.executeCommand('deleteLeft');
        }
    });
    // Register the commands
    context.subscriptions.push(alignCommentOnTab);
    context.subscriptions.push(deIndentCommentOnBackspace);
    // Notify user that the extension is active
    vscode.window.showInformationMessage('VHDL Comment Aligner activated!');
}
function deactivate() { }
//# sourceMappingURL=extension.js.map