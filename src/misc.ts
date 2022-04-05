// Packages
import * as vscode from "vscode";

// Misc
import { DefaultStyleIo, Settings, DecorationTypes } from "./settings";

export function initSettings() {
  let workspace = vscode.workspace;
  let configuration = workspace.getConfiguration("todo-in-scope");
  let defaultStyle = configuration.get("defaultStyle") as DefaultStyleIo;
  let settings = new Settings(
    configuration.get("isEnabled"),
    { color: defaultStyle.color, backgroundColor: defaultStyle.backgroundColor, overviewRulerColor: defaultStyle.rulerColor },
    {}
  );
  (configuration.get("keywords") as any[]).forEach(keyword => {
    settings.keywords[keyword.word] = {
      color: keyword.color || defaultStyle.color,
      backgroundColor: keyword.backgroundColor || defaultStyle.backgroundColor,
      overviewRulerColor: keyword.rulerColor || defaultStyle.rulerColor
    };
  });

  return settings;
}

export function applyDecorations(activeEditor: vscode.TextEditor | undefined, settings: Settings) {
  // Return if there are no active editor or settings are disabled
  if (!activeEditor || !settings.isEnabled) {
    return;
  }
  // This will clear all the decoration types
  clearDecorations(settings.tmpDecorationTypes);

  // Receiving regex of current editor for highlighting
  let text = activeEditor.document.getText();
  let keywords = Object.keys(settings.keywords).join("|"); // TODO|NOTE|DEBUG...
  let regexp = new RegExp(`^ {0,}.+(${keywords})(\\(\\w+\\)){0,}:`, "gm");
  let result = text.matchAll(regexp);
  let decorationTypes: DecorationTypes = {};

  // This loop constructs decorationTypes map
  for (let match of result) {
    // Get matches
    let matchIndex = match.index || 0;
    let matchWithComment = match[0];
    let matchedValue = match[1];

    // Get position of matches in editor as range
    let keywordStartPos = matchIndex + matchWithComment.split(matchedValue)[0].length;
    let startPos = activeEditor.document.positionAt(keywordStartPos);
    let endPos = activeEditor.document.positionAt(matchedValue.length + keywordStartPos);
    let range = new vscode.Range(startPos, endPos);

    // Get decoration from settings based on match
    let decorationType = settings.keywords[matchedValue];

    // setDecorations function expects next data:
    // decoration: { ... }<decorationType>, Array<Range>
    // If we don't have already a decoration for specific key - we are adding it
    // If we do have a decoration for specific key - we are adding only new range
    if (!decorationTypes[matchedValue]) {
      decorationTypes[matchedValue] = {
        decoration: vscode.window.createTextEditorDecorationType(decorationType),
        ranges: [range]
      };
    } else {
      decorationTypes[matchedValue].ranges.push(range);
    }
  }
  setDecorations(activeEditor, decorationTypes, settings);
}

export function toggleHighlight(activeEditor: vscode.TextEditor | undefined, settings: Settings) {
  clearDecorations(settings.tmpDecorationTypes);
  settings.isEnabled = !settings.isEnabled;
  if (settings.isEnabled) {
    applyDecorations(activeEditor, settings);
  }
}

function setDecorations(activeEditor: vscode.TextEditor, decorationTypes: DecorationTypes, settings: Settings) {
  // Settings decoration for each decoration type
  Object.keys(decorationTypes).forEach((key) => {
    let decorationType = decorationTypes[key];
    activeEditor.setDecorations(decorationType.decoration, decorationType.ranges);
  });
  // Writing decoration types into settings for further use
  settings.tmpDecorationTypes = decorationTypes;
}

function clearDecorations(decorationTypes: DecorationTypes) {
  Object.keys(decorationTypes).forEach((key) => {
    let decorationType = decorationTypes[key];
    decorationType.decoration.dispose();
  });
}