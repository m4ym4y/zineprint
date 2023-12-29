const path = require('path')
module.exports = {
  entry: {
    index: './index.js',
    'pdf.worker': 'pdfjs-dist/build/pdf.worker.mjs'
  },
  mode: 'none',
  output: {
    path: path.resolve(__dirname, './build'),
    filename: '[name].bundle.js'
  }
}
