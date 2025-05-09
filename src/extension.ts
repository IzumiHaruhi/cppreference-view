import * as vscode from 'vscode';
import axios from 'axios';

const linkCache: { [key: string]: string } = {};
const markdownCache: { [key: string]: string } = {};

async function getLink(text: string) {
    if (text in linkCache) {
        return linkCache[text];
    }
    const url = 'https://api.langsearch.com/v1/web-search';
    const key = 'sk-b909358e07924aa58f31f38cfc3ddd33';
    const { data } = await axios.post(url, { query: `cppreference.com/w/cpp/ ${text}`, count: 1 }, {
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }
    });
    const link = data.data.webPages.value[0].url;
    if (!link.startsWith('https://en.cppreference.com/w/cpp/')) {
        throw new Error('Get link failed');
    }
    const lang = 'zh';
    return linkCache[text] = link.replace('en', lang);
}

async function getMarkdown(link: string) {
    if (link in markdownCache) {
        return markdownCache[link];
    }
    const { data: content } = await axios(link);
    const html = content.match(/<!-- bodycontent.*bodycontent -->/s)?.[0];
    const url = 'https://api.html-to-markdown.com/v1/convert';
    const key = 'html2md_V8c7tPaV89y_776PkarTchcf4MCSpUhzmzzCqsE2iStcubjroKJRvzH3_4LPgefUXTVFY4dTmV45ntG3W43tQZZEApKogritKmbxE';
    const { data } = await axios.post(url, { html }, {
        headers: { 'X-API-Key': key, 'Content-Type': 'application/json' }
    });
    return markdownCache[link] = data.markdown;
}

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('cppreference-view.view', () => {
        vscode.window.showInformationMessage('Unfinished.');
    }));
    context.subscriptions.push(vscode.languages.registerHoverProvider('cpp', {
        async provideHover(document, position, token) {
            const range = document.getWordRangeAtPosition(position);
            if (!range) {
                throw new Error('Get range failed');
            }
            const text = document.getText(range);
            const link = await getLink(text);
            const markdown = await getMarkdown(link);
            return new vscode.Hover(markdown);
        }
    }));
}

export function deactivate() { }