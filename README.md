VHDL Comment Aligner
The VHDL Comment Aligner is a Visual Studio Code extension designed to automatically align VHDL comments (starting with --) to a configurable tab stop. This extension enhances productivity for VHDL developers by ensuring consistent comment alignment, especially in large codebases.
Features

Automatic Comment Alignment: Aligns VHDL comments to a user-defined tab stop (default: column 100) when the Tab key is pressed immediately before a -- comment.
De-indentation with Backspace: De-indents comments to the tab stop when Backspace is pressed immediately before a -- comment, if the comment is past the tab stop.
Multi-Line Support: Works with single or multi-line cursors, aligning or de-indenting multiple comments at once.
Preserves Normal Tab/Backspace Behavior: Normal Tab and Backspace functionality remains unaffected outside of VHDL comments.
Configurable Tab Stop: Customize the alignment column via the vhdlCommentAligner.tabStop setting (minimum: 100).

Requirements

Visual Studio Code version 1.85.0 or higher.
This extension is designed for VHDL files (.vhd).

Extension Settings
This extension contributes the following settings:

vhdlCommentAligner.tabStop: The column number where VHDL comments should be aligned (1-based). Default is 100, with a minimum value of 100.

To configure the tab stop:

Go to File > Preferences > Settings (or press Ctrl+,).
Search for vhdlCommentAligner.
Update the Tab Stop value as desired.

Usage

Open a VHDL file (.vhd) in VS Code.
Place your cursor immediately before a -- comment:signal a : std_logic;| -- comment


Press Tab:
If the comment is before the tab stop, it will be indented to the configured column (e.g., 100):signal a : std_logic;                                                                                  | -- comment


The cursor will remain just before the -- (e.g., at column 99).


Press Backspace:
If the comment is past the tab stop, it will be de-indented to the tab stop.
If the comment is at or before the tab stop, normal Backspace behavior applies, deleting characters to the left.


For multi-line comments, use multi-cursors (e.g., Alt+Click on Windows/Linux, Option+Click on macOS) to align multiple comments at once.

Known Issues

None reported yet. If you encounter any issues, please report them on the GitHub repository.

Release Notes
0.0.2

Fixed Backspace functionality to support multi-line selections, ensuring selected text across multiple lines is deleted as expected.

0.0.1
Initial release of VHDL Comment Aligner:

Added support for aligning VHDL comments to a configurable tab stop.
Implemented Tab and Backspace functionality for indentation and de-indentation.
Supported multi-line cursor operations.
Ensured normal Tab/Backspace behavior outside of comments.

License
This extension is licensed under the MIT License.

Enjoy!
