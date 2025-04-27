import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Helper function to calculate the visual column position of a character index
    const getVisualColumn = (lineText: string, charIndex: number, tabSize: number): number => {
        let column = 0;
        for (let i = 0; i < charIndex; i++) {
            if (lineText[i] === '\t') {
                column = Math.ceil((column + 1) / tabSize) * tabSize;
            } else {
                column++;
            }
        }
        return column;
    };

    // Command to handle Tab key for indenting comments with multi-line cursors
    const alignCommentOnTab = vscode.commands.registerCommand('vhdlCommentAligner.alignCommentOnTab', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'vhdl') {
            return; // Only process VHDL files
        }

        const config = vscode.workspace.getConfiguration('vhdlCommentAligner');
        const commentColumn = config.get<number>('commentColumn', 95); // Default to 95
        const tabSize = vscode.workspace.getConfiguration('editor').get<number>('tabSize', 4); // Default to 4
        const targetColumn = commentColumn - 1; // Convert to 0-based

        // Process each selection (cursor)
        editor.edit(editBuilder => {
            const newSelections: vscode.Selection[] = [];

            for (const selection of editor.selections) {
                const line = editor.document.lineAt(selection.active.line);
                const text = line.text;
                const commentIndex = text.indexOf('--');

                // Skip if there's no comment or the cursor is after --
                if (commentIndex === -1 || selection.active.character > commentIndex) {
                    newSelections.push(selection); // Keep the cursor unchanged
                    continue;
                }

                // Calculate the visual column position of --
                const currentCommentPosition = getVisualColumn(text, commentIndex, tabSize);

                // Check if the comment is already at or beyond the target column
                if (currentCommentPosition >= targetColumn) {
                    newSelections.push(selection); // Keep the cursor unchanged
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

                // Update the cursor position to the start of the comment (just before --)
                const newPosition = new vscode.Position(line.lineNumber, trimmedBeforeComment.length + spacesNeeded);
                newSelections.push(new vscode.Selection(newPosition, newPosition));
            }

            // Update all cursor positions after the edit
            editor.selections = newSelections;
        }).then(success => {
            if (!success) {
                // If the edit failed, fall back to default Tab behavior
                vscode.commands.executeCommand('tab');
            }
        });
    });

    // Command to handle Backspace key for de-indenting comments with multi-line cursors
    const deIndentCommentOnBackspace = vscode.commands.registerCommand('vhdlCommentAligner.deIndentCommentOnBackspace', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'vhdl') {
            return; // Only process VHDL files
        }

        const config = vscode.workspace.getConfiguration('vhdlCommentAligner');
        const commentColumn = config.get<number>('commentColumn', 95); // Default to 95
        const tabSize = vscode.workspace.getConfiguration('editor').get<number>('tabSize', 4); // Default to 4
        const targetColumn = commentColumn - 1; // Convert to 0-based

        let editApplied = false;

        // Process each selection (cursor)
        editor.edit(editBuilder => {
            const newSelections: vscode.Selection[] = [];

            for (const selection of editor.selections) {
                const line = editor.document.lineAt(selection.active.line);
                const text = line.text;
                const commentIndex = text.indexOf('--');

                // Skip if there's no comment or the cursor is after --
                if (commentIndex === -1 || selection.active.character > commentIndex) {
                    newSelections.push(selection); // Keep the cursor unchanged
                    continue;
                }

                // Calculate the visual column position of --
                const currentCommentPosition = getVisualColumn(text, commentIndex, tabSize);

                // Debug logging to understand why Backspace might not work
                console.log(`Line ${line.lineNumber + 1}: Comment at visual column ${currentCommentPosition}, Target: ${targetColumn}`);

                // Check if the comment is past the target column
                if (currentCommentPosition <= targetColumn) {
                    console.log(`Line ${line.lineNumber + 1}: Comment already at or before target column, skipping.`);
                    newSelections.push(selection); // Keep the cursor unchanged
                    continue;
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

                // Replace the line
                const lineRange = line.range;
                editBuilder.replace(lineRange, newLineText);
                editApplied = true;

                // Update the cursor position to the start of the comment (just before --)
                const newPosition = new vscode.Position(line.lineNumber, trimmedBeforeComment.length + spacesNeeded);
                newSelections.push(new vscode.Selection(newPosition, newPosition));
            }

            // Update all cursor positions after the edit
            editor.selections = newSelections;
        }).then(success => {
            if (!success || !editApplied) {
                // If the edit failed or no changes were applied, fall back to default Backspace behavior
                console.log('No edits applied, falling back to default Backspace behavior.');
                vscode.commands.executeCommand('deleteLeft');
            }
        });
    });

    // Register the commands
    context.subscriptions.push(alignCommentOnTab);
    context.subscriptions.push(deIndentCommentOnBackspace);

    // Notify user that the extension is active
    vscode.window.showInformationMessage('VHDL Comment Aligner activated!');
}

export function deactivate() {}