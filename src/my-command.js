import sketch from 'sketch'
const UI = require('sketch/ui');
const dialog = require('@skpm/dialog');
const fs = require('@skpm/fs');
const path = require('@skpm/path');
// documentation: https://developer.sketchapp.com/reference/api/

function exportJSON(document, str) {
  // Ask user to pick a file, with a default export name pre-filled.
  let defaultExportPath = 'sketch2vd';
  // TODO: figure out why document.sketbhObject is undefined... it shouldn't be?
  let fileURL = document.sketchObject ? document.sketchObject.fileURL() : '';
  if (fileURL) {
    fileURL = String(fileURL.path());
    const documentName = path.basename(fileURL).replace(/\.[^.]+$/, ''); // Strip extension.
    defaultExportPath = `${documentName}`;
  }

  const rootPath = dialog.showSaveDialog({
    defaultPath: defaultExportPath,
    nameFieldLabel: 'Export directory name:',
    buttonLabel: 'Export',
  });

  if (!rootPath) {
    return;
  }

  // Confirm overwrite.
  if (fs.existsSync(rootPath)) {
    let confirm =
      0 ===
      dialog.showMessageBox(document.sketchObject, {
        type: 'question',
        buttons: ['Overwrite', 'Cancel'],
        title: 'Directory exists, overwrite?',
        message:
          'The output directory you chose already exists. Are you sure you want to overwrite it?\n\n' +
          rootPath,
        icon: NSImage.alloc().initWithContentsOfFile(
          // TODO: replace icon.png with our own custom one
          context.plugin.urlForResourceNamed('icon.png').path()
        ),
      });
    if (!confirm) {
      return;
    }
    // TODO: this doesn't delete the directory if it is non-empty... fix?
    fs.rmdirSync(rootPath);
  }
  fs.mkdirSync(rootPath);

  const vdPath = `${rootPath}/data.json`;
  fs.writeFileSync(vdPath, str);
  NSWorkspace.sharedWorkspace().openFile(vdPath);
  UI.message('✅ Exported!');
}

function floor(num) {
  return Math.floor(num * 100) / 100
}
function toJSON(data, layers) {
  for (let i = 0; i < layers.length; ++i) {
    if (layers[i].layers && layers[i].layers.length) {
      toJSON(data, layers[i].layers)
    }
    let frame = layers[i].frame
    data[layers[i].name] = data[layers[i].name] || {}
    let rectX = floor(frame.x)
    let rectY = floor(frame.y)
    let rectWidth = floor(frame.width)
    let rectHeight = floor(frame.height)
    data[layers[i].name].frame = [rectX, rectY, rectWidth, rectHeight]
    let playerX = floor(rectX + (rectWidth - 100) / 2)
    let playerY = floor(rectY + (rectHeight - 100) / 2)
    data[layers[i].name].playerPos = [playerX, playerY]
  }

}
export default function() {
  let document = require('sketch/dom').getSelectedDocument()
  if (document) {
    let page = document.selectedPage
    let layers = page.layers
    let data = {}
    toJSON(data, layers)
   exportJSON(document, JSON.stringify(data))
  }
}
