import {getCompletionList, getCommand, commandDoc} from "./doc_fcns";
import {checFilePaths} from './lmps_lint';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	// Register Commands
	context.subscriptions.push(
		vscode.commands.registerCommand('extension.show_docs', () => {
			const web_uri = vscode.Uri.parse("https://lammps.sandia.gov/doc/Manual.html")
			vscode.env.openExternal(web_uri)

		}));

	// Register Hover Provider
	context.subscriptions.push(
		vscode.languages.registerHoverProvider("lmps", {
			provideHover(document, position) {
				const range = document.getWordRangeAtPosition(position, RegExp('[\\w\\/]+(?:[\\t\\s]+[^\#\\s\\t]+)*'))
				const words = document.getText(range)
				return createHover(words)
			}
		}));

	// Register Completions Provider
	context.subscriptions.push(
		vscode.languages.registerCompletionItemProvider("lmps", {
			provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
				const autoConf = vscode.workspace.getConfiguration('lammps.AutoComplete')
				const compl_str:vscode.CompletionList = getCompletionList(autoConf)
				return compl_str
			}
		}));

	// Provide Diagnostics on Open, Save and Text-Changed-Event
	const collection = vscode.languages.createDiagnosticCollection('lmps');
	context.subscriptions.push(
		vscode.workspace.onDidOpenTextDocument(doc => {
			if (doc.languageId == 'lmps') {
				updateDiagnostics(doc, collection);
			}
		}));

	context.subscriptions.push(
		vscode.workspace.onDidSaveTextDocument(doc => {
			if (doc.languageId == 'lmps') {
				updateDiagnostics(doc, collection);
			}
		}));

	context.subscriptions.push(
		vscode.workspace.onDidChangeTextDocument(editor => {
			const c_str: string = editor.contentChanges[0].text
			// Check only when a word was typed out comletely
			const b_trig: boolean = c_str.search(RegExp('[\\n\\s#]')) != -1
			if (b_trig) {
				updateDiagnostics(editor.document, collection);
			}
		}));
}

function get_documentation(snippet: string) {

	const sub_com = snippet.split(RegExp('[\\t\\s]+'));

	// Captures commands with 2 Arguments between 2 Keywords
	let docs:commandDoc|undefined = getCommand(sub_com[0] + ' ' + sub_com[3])	
	if (docs) {
		return docs
	} else {
		// Captures AtC commands with 3 Keywords like "fix_modify AtC control localized_lambda"
		docs = getCommand(sub_com[0] + ' AtC ' + sub_com[2] + ' ' + sub_com[3])
	if (docs) {
		return docs
	} else {
		// Captures AtC commands with 2 Keywords like like "fix_modify AtC output"
		docs = getCommand(sub_com[0] + ' AtC ' + sub_com[2])
	if (docs) {
		return docs
	} else {
		// Captures commands with 1 Arguments between 2 Keywords
		docs = getCommand(sub_com[0] + ' ' + sub_com[2])
	if (docs) {
		return docs
	} else {
		// Captures commands with 2 Arguments
		docs = getCommand(sub_com[0] + ' ' + sub_com[1])
	if (docs) {
		return docs
	} else {
		// Captures commands with 1 Argument
		docs = getCommand(sub_com[0])
	if (docs) {
		return docs
	} else { 
		return undefined }
	}}}}}
}

function createHover(snippet: string) {

	const hover_conf = vscode.workspace.getConfiguration('lammps.Hover')

	if (hover_conf.Enabled) {
		const docs = get_documentation(snippet)
		if (docs) {
			// Constructing the Markdown String to show in the Hover window
			const content = new vscode.MarkdownString()
			if (docs?.short_description) {
				content.appendMarkdown(docs?.short_description + ". [Read more... ](https://lammps.sandia.gov/doc/" + docs?.html_filename + ")\n")
				content.appendMarkdown("\n --- \n")
			}
			if (docs?.syntax) {
				content.appendMarkdown("### Syntax: \n")
				content.appendCodeblock(docs?.syntax, "lmps")
				content.appendMarkdown(docs?.parameters + "\n\n")
			}
			if (docs?.examples && hover_conf.Examples) {
				content.appendMarkdown("### Examples: \n")
				content.appendCodeblock(docs?.examples, "lmps")
			}
			if (docs?.description && hover_conf.Detail == 'Complete') {
				content.appendMarkdown("### Description: \n")
				content.appendText(docs?.description + "\n")
			}
			if (docs?.restrictions && hover_conf.Restrictions) {
				content.appendMarkdown("### Restrictions: \n")
				content.appendText(docs?.restrictions)
			}
			return new vscode.Hover(content)
		}
	}
}

function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
	if (document) {
		let errors: vscode.Diagnostic[] = []
		for (let line_idx = 0; line_idx < document.lineCount; line_idx++) {
			// check lines with a set of functions, which append Diagnostic entries to the errors array
			errors = checFilePaths(document, line_idx, errors)
		}
		collection.set(document.uri, errors)
	} else {
		collection.clear();
	}
}

// this method is called when your extension is deactivated
export function deactivate() { }
