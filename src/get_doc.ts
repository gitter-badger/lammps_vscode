import { command_docs } from "./lmp_doc";
import { CompletionItem, CompletionList, MarkdownString } from 'vscode';

export function get_doc(find_command: string) {
    return command_docs.find(e => e.command.includes(find_command));
}

export function get_completion_list(CompletionString: string, detail: boolean, enabled: boolean) {

    const completion_List = new CompletionList();

    if (enabled) {

        for (let c of command_docs.values()) {
            for (let c_ix of c.command.values()) {
                var compl_it = new CompletionItem(c_ix);
                compl_it.documentation = new MarkdownString();
                if (detail) {
                    compl_it.detail = c.syntax
                }
                else {
                    compl_it.documentation.appendCodeblock(c.syntax, 'lmps')
                }
                compl_it.documentation.appendMarkdown("[Open documentation](https://lammps.sandia.gov/doc/" + c.html_filename + ")\n")
                compl_it.documentation.appendMarkdown(c.parameters)
                compl_it.documentation.appendMarkdown(" \n" + "--- " + " \n")
                compl_it.documentation.appendText(c.short_description)

                if (CompletionString == 'Syntax') {
                    compl_it.insertText = c.syntax
                }
                completion_List.items.push(compl_it)
            }
        }
    }
    return completion_List
}