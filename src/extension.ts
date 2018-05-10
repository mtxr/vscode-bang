'use strict';
import { exec as execOriginal } from 'child_process';

type DescriptorOutput = string | null;

interface ShellOutput {
    stdout: DescriptorOutput;
    stderr: DescriptorOutput;
}

const exec = (cmd: string): Promise<ShellOutput> => new Promise((resolve, reject) => {
    execOriginal(cmd, (error, stdout, stderr) => {
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

async function insertText(text: string, forceCreate = false) {
    const editor = await getOrCreateEditor(forceCreate);
    editor.edit((edit) => {
        editor.selections.forEach((cursor) => edit.insert(cursor.active, text));
    });
}

function parseCommand(command: string) {
    if (window.activeTextEditor) {
        return command.replace(/([^\\])%/g, `$1${window.activeTextEditor.document.uri.fsPath}`);
    }
    return command;
}

export function activate(context: ExtensionContext) {

    context.subscriptions.push(commands.registerCommand('bang.runCommand', async() => {
        const command = await window.showInputBox({
            prompt: 'Shell command',
            placeHolder: '! ls %',
        });
        if (!command) { return; }
        const { stdout } = await exec(parseCommand(command));
        if (!stdout) { return; }
        insertText(stdout);
    }));
}
