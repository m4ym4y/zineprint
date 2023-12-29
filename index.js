import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { jsPDF } from 'jspdf'

pdfjsLib.GlobalWorkerOptions.workerSrc = "./build/pdf.worker.bundle.js"

async function pageToCanvas(page, scale = 5) {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const renderContext = { canvasContext: ctx, viewport: viewport }

  canvas.height = viewport.height
  canvas.width = viewport.width

  await page.render(renderContext).promise
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

function constructPage(left, right) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = left.width + right.width
  canvas.height = Math.max(left.height, right.height)

  ctx.putImageData(left, 0, 0)
  ctx.putImageData(right, left.width, 0)
  return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

document.getElementById('submit').addEventListener('click', async ev => {
  ev.preventDefault()
  const file = document.getElementById('file').files[0]
  if (!file) {
    return
  }

  const reader = new FileReader()
  reader.onload = async function () {
    const bytes = new Uint8Array(reader.result)
    const loadPdf = getDocument(bytes)
    const pdf = await loadPdf.promise

    const previewCanvas = document.getElementById('preview')
    const previewCtx = previewCanvas.getContext('2d')

    const imageData = []
    for (let i = 1; i <= pdf.numPages; ++i) {
      const page = await pdf.getPage(i)
      imageData.push(await pageToCanvas(page))

      const previewPage = await pageToCanvas(page, 0.5)
      previewCtx.putImageData(previewPage, 0, 0)
    }

    let leftPage = 0
    let rightPage = imageData.length - 1
    const pages = []
    const flippedParity = document.getElementById('backwards').checked ? 0 : 1

    while (leftPage < rightPage) {
      if (leftPage % 2 === flippedParity) {
        pages.push(constructPage(imageData[leftPage], imageData[rightPage])) 
      } else {
        pages.push(constructPage(imageData[rightPage], imageData[leftPage])) 
      }
      ++leftPage
      --rightPage
    }

    // love that I'm using both PDFjs and jsPDF
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "in",
      format: "letter"
    })
    for (let i = 0; i < pages.length; ++i) {
      doc.addImage(pages[i], 0, 0, 11, 8.5, `page_${i}`, 'NONE', 0)
      doc.addPage("letter", "landscape")
    }
    doc.deletePage(pages.length + 1)
    doc.save('output.pdf')
  }

  reader.readAsArrayBuffer(file)
})
