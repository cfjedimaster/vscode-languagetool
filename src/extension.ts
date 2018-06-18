'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as rp from 'request-promise';
import * as showdown from 'showdown';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('extension.runLanguageTool', async () => {
        // The code you place here will be executed every time your command is executed

        // get current document text

        let editor = vscode.window.activeTextEditor;
        if(!editor) {
            vscode.window.showErrorMessage('No active editor to check.');
            return;
        }
        console.log('lang',editor.document.languageId);

        let text = editor.document.getText();
        let type = editor.document.languageId;

        // now lets try to remove common MD front matter stuff (and maybe do more later)
        text = prepareText(text, type);

        if(text.length === 0) {
            vscode.window.showErrorMessage('No text to check.');
            return;
        }

        let results = await checkText(text);

        console.log(`[languagetool] i got ${results.length} results`);
        console.log(results);

        // now id make some good html
        let html = generateHTML(results);

        // now render it
        const panel = vscode.window.createWebviewPanel(
            'languageToolResults', // Identifies the type of the webview. Used internally
            "LanguageTool Results", // Title of the panel displayed to the user
            vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
            { } // Webview options. More on these later.
        );
        panel.webview.html = html;

    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}

function prepareText(s:string,type:string):string {
    /*
    lets first remove ---X---
    */
    s = s.replace(/---[\s\S]*---/m,'').trim();
    // todo - more ;)

    //if type is markdown, lets render it to html and then remove it
    if(type === 'markdown') {
        let converter = new showdown.Converter();
        s = converter.makeHtml(s);
        // remove code blocks
        s = s.replace(/<pre><code[\s\S]*?<\/code><\/pre>/mg, '');
        // now remove html
        s = s.replace(/<.*?>/g, '');
    }
    return s;
}

async function checkText(s:string) {
    return new Promise((resolve, reject) => {
        rp({
            uri:'https://languagetool.org/api/v2/check',
            method:'POST',
            form:{
                text:s,
                language:'auto',
                disabledRules:'EN_QUOTES'
            }
        })
        .then(res => {
            resolve(JSON.parse(res).matches);
        })
        .catch(e => {
            console.log('error calling api', e);
            reject(e);
        });

    });

}

function generateHTML(data) {

    /*
    So before release, I decided to simply render all the rules the same. I'm keeping some old bits in
    for review later though...

    let replacementRules = ['MORFOLOGIK_RULE_EN_US','COMMA_COMPOUND_SENTENCE','COMMA_PARENTHESIS_WHITESPACE'];
    */
    let results = '';
    let counter = 0;

    data.forEach(d => {
        counter++;
        let s = '<p><b>'+counter+') '+d.message+'</b><br/>';
        //if(replacementRules.indexOf(d.rule.id) >= 0) {

        // generate highlighted context
        let badword = d.context.text.substr(d.context.offset,d.context.length);
        let sentence = d.context.text.replace(badword, '<b><i>'+badword+'</i></b>');
        s += sentence+'<br/>';
        let replacements:string[] = [];
        d.replacements.forEach(r => {
            replacements.push(r.value);
        });
        s += 'Suggestions: '+replacements.join(',');

        //}
        s += '</p>';
        results += s;
    });

    let content = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
    <h1>LanguageTool Results</h1>
    <p>
    The following results are provided by <a href="https://languagetool.org/">LanguageTool</a>.
    </p>

    <p>
    There were ${data.length} result(s) found:
    </p>

    ${results}

</body>
</html>   
`;

    return content;
}