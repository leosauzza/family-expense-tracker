import canvas from 'canvas';

/**
 * Canvas factory for pdf.js in Node.js environment
 */
export class NodeCanvasFactory {
  create(width, height) {
    const canvasInstance = canvas.createCanvas(width, height);
    const context = canvasInstance.getContext('2d');
    return {
      canvas: canvasInstance,
      context
    };
  }

  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}
