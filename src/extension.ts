'use strict';
import { exec as execOriginal } from 'child_process';

type DescriptorOutput = string | null;

interface ShellOutput {
    stdout: DescriptorOutput;
    stderr: DescriptorOutput;
}

const currentFileRegEx = /([^\\])%/g;
let lastCommand: string | undefined = undefined;

const exec = (cmd: string): Promise<ShellOutput> => new Promise((resolve, reject) => {
    const cwd = workspace.workspaceFolders && workspace.workspaceFolders.length > 0 ? workspace.workspaceFolders[0].uri.fsPath : undefined;
    execOriginal(cmd, { cwd }, (error, stdout, stderr) => {
        if (error) { return reject(error); }
        return resolve({ stdout: stdout && stdout.toString(), stderr: stderr && stderr.toString() });
    });
});

import {
    ExtensionContext,
    window,
    commands,
    TextEditor,
    workspace
} from 'vscode';

async function getOrCreateEditor(forceCreate = false): Promise<TextEditor> {
    if (forceCreate || !window.activeTextEditor) {
        const doc = await workspace.openTextDocument({ language: 'sql' });
        await window.showTextDocument(doc, 1, false);
    }
    return window.activeTextEditor as TextEditor;
}
function parseCommand(command: string) {
    if (!window.activeTextEditor) {
        return [command];
    }
    const editor = window.activeTextEditor;
    command = command.replace(currentFileRegEx, `$1${editor.document.uri.fsPath}`);
    if (editor.selections.length > 0) {
        return editor.selections
           .map((selection) => editor.document.getText(selection).length > 0
                ? `echo "${(editor as TextEditor).document.getText(selection)}" | ${command}`
                : command
            );
    }
    return [command];
}

async function run (insert = false) {
    const command = await window.showInputBox({
        value: lastCommand,
        prompt: 'Shell command',
        placeHolder: '! ls %',
    });
    if (!command) { return; }

    lastCommand = command;

    parseCommand(command).forEach(async (cmd, index) => {
        try {
            const { stdout } = await exec(cmd);
            if (!stdout) { return; }
            if (!insert || !stdout) { return; }
            const editor = await getOrCreateEditor();
            editor.edit((edit) => {
                edit.replace((editor as TextEditor).selections[index], stdout);
            });
        } catch(e) {
            window.showErrorMessage(e.message ? (e as Error).message : e.toString());
        }
    });
}

export function activate(context: ExtensionContext) {
    context.subscriptions.push(commands.registerCommand('bang.runCommand', () => run()));
    context.subscriptions.push(commands.registerCommand('bang.runCommandAndInsert', () => run(true)));
}
