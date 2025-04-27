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
                // Tabs advance to the next tab stop (e.g., if tabSize is 4, column 2 becomes 4)
                column = Math.ceil((column + 1) / tabSize) * tabSize;
            }
            else {
                // Spaces and other characters advance by 1 column
                column++;
            }
        }
        return column;
    };
    // Command to handle Tab key for indenting comments
    const alignCommentOnTab = vscode.commands.registerCommand('vhdlCommentAligner.alignCommentOnTab', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'vhdl') {
            return; // Only process VHDL files
        }
        const position = editor.selection.active;
        const line = editor.document.lineAt(position.line);
        const text = line.text;
        const commentIndex = text.indexOf('--');
        // Check if there's a comment and the cursor is before --
        if (commentIndex === -1 || position.character > commentIndex) {
            // If no comment or cursor is after --, let the default Tab behavior occur
            vscode.commands.executeCommand('tab');
            return;
        }
        const config = vscode.workspace.getConfiguration('vhdlCommentAligner');
        const commentColumn = config.get('commentColumn', 95); // Default to 95
        const tabSize = vscode.workspace.getConfiguration('editor').get('tabSize', 4); // Default to 4 if not set
        // Calculate the visual column position of --
        const currentCommentPosition = getVisualColumn(text, commentIndex, tabSize);
        // Check if the comment is already at or beyond the target column
        const targetColumn = commentColumn - 1; // Convert to 0-based
        if (currentCommentPosition >= targetColumn) {
            // Let the default Tab behavior occur if already at or beyond the target
            vscode.commands.executeCommand('tab');
            return;
        }
        // Split the line into non-comment and comment parts
        const beforeComment = text.substring(0, commentIndex);
        const commentText = text.substring(commentIndex).trim();
        const trimmedBeforeComment = beforeComment.trimEnd();
        const trimmedLength = getVisualColumn(trimmedBeforeComment, trimmedBeforeComment.length, tabSize);
        // Calculate spaces needed to reach the target column from the end of the trimmed non-comment part
        const spacesNeeded = targetColumn - trimmedLength;
        const spaces = ' '.repeat(spacesNeeded);
        const newLineText = trimmedBeforeComment + spaces + commentText;
        // Apply the edit, replacing the entire line
        editor.edit(editBuilder => {
            const lineRange = line.range;
            editBuilder.replace(lineRange, newLineText);
        }).then(() => {
            // Move the cursor to the new indent position (where -- now starts)
            const newPosition = new vscode.Position(position.line, trimmedBeforeComment.length + spacesNeeded);
            editor.selection = new vscode.Selection(newPosition, newPosition);
        });
    });
    // Command to handle Backspace key for de-indenting comments
    const deIndentCommentOnBackspace = vscode.commands.registerCommand('vhdlCommentAligner.deIndentCommentOnBackspace', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'vhdl') {
            return; // Only process VHDL files
        }
        const position = editor.selection.active;
        const line = editor.document.lineAt(position.line);
        const text = line.text;
        const commentIndex = text.indexOf('--');
        // Check if there's a comment and the cursor is before --
        if (commentIndex === -1 || position.character > commentIndex) {
            // If no comment or cursor is after --, let the default Backspace behavior occur
            vscode.commands.executeCommand('deleteLeft');
            return;
        }
        const config = vscode.workspace.getConfiguration('vhdlCommentAligner');
        const commentColumn = config.get('commentColumn', 95); // Default to 95
        const tabSize = vscode.workspace.getConfiguration('editor').get('tabSize', 4); // Default to 4 if not set
        // Calculate the visual column position of --
        const currentCommentPosition = getVisualColumn(text, commentIndex, tabSize);
        // Check if the comment is past the target column
        const targetColumn = commentColumn - 1; // Convert to 0-based
        if (currentCommentPosition <= targetColumn) {
            // If not past the target column, let the default Backspace behavior occur
            vscode.commands.executeCommand('deleteLeft');
            return;
        }
        // Split the line into non-comment and comment parts
        const beforeComment = text.substring(0, commentIndex);
        const commentText = text.substring(commentIndex).trim();
        const trimmedBeforeComment = beforeComment.trimEnd();
        const trimmedLength = getVisualColumn(trimmedBeforeComment, trimmedBeforeComment.length, tabSize);
        // De-indent to the target column
        const spacesNeeded = targetColumn - trimmedLength;
        const spaces = ' '.repeat(spacesNeeded);
        const newLineText = trimmedBeforeComment + spaces + commentText;
        // Apply the edit, replacing the entire line
        editor.edit(editBuilder => {
            const lineRange = line.range;
            editBuilder.replace(lineRange, newLineText);
        }).then(() => {
            // Move the cursor to the new indent position (where -- now starts)
            const newPosition = new vscode.Position(position.line, trimmedBeforeComment.length + spacesNeeded);
            editor.selection = new vscode.Selection(newPosition, newPosition);
        });
    });
    // Register the commands
    context.subscriptions.push(alignCommentOnTab);
    context.subscriptions.push(deIndentCommentOnBackspace);
    // Notify user that the extension is active
    vscode.window.showInformationMessage('VHDL Comment Aligner activated!');
}
function deactivate() { }
//# sourceMappingURL=extension.js.map