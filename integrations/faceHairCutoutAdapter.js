(function () {
  const SUPPORTED_IMAGE_TYPE = /^image\/(png|jpeg|webp)$/i;
  const DEFAULT_LIBRARY_MODULE_URL =
    'https://cdn.jsdelivr.net/gh/jeanmicheldewez-ux/face-hair-cutout-js@main/src/index.js';
  const DEFAULT_SEGMENTER_MODEL =
    'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite';
  const MAX_INPUT_DIMENSION = 1280;
  const CUTOUT_OPTIONS = {
    maxWidth: 480,
    maxHeight: 640,
    topPaddingRatio: 0.25,
    sidePaddingRatio: 0.14,
    bottomPaddingRatio: 0.14,
    inputScaleRatio: 0.75,
    outputFit: 'contain',
    outputTrimTopRatio: 0.07,
    outputTrimBottomRatio: 0,
    debugCrop: false,
    keepCategoryIndexes: [1, 3],
    accessoryCategoryIndexes: [5],
    accessoryFaceExpansionRatio: 0.18,
    chinMarginRatio: 0.06,
    bottomFeatherRatio: 0.025
  };

  let modulePromise = null;

  function getLibrary() {
    return window.FaceHairCutoutJS ||
      window.FaceHairCutout ||
      window.faceHairCutout ||
      window.faceHairCutoutJs ||
      null;
  }

  function getProcessor(library) {
    if (!library) return null;
    if (typeof library === 'function') return library;

    return library.extractFaceHair ||
      library.extractFaceAndHair ||
      library.extract ||
      library.processImage ||
      library.process ||
      library.cutout ||
      null;
  }

  function getModuleUrl() {
    return window.DANCING5_FACE_HAIR_CUTOUT_MODULE_URL || DEFAULT_LIBRARY_MODULE_URL;
  }

  async function getLibraryModule() {
    if (!modulePromise) {
      modulePromise = import(getModuleUrl());
    }
    return modulePromise;
  }

  function closeTask(task) {
    if (!task) return;
    if (typeof task.close === 'function') {
      task.close();
    } else if (typeof task.delete === 'function') {
      task.delete();
    }
  }

  function closeTasks(tasks) {
    if (!tasks || typeof tasks !== 'object') return;
    closeTask(tasks.segmenter);
    closeTask(tasks.faceLandmarker);
  }

  function get2d(canvas) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D canvas is unavailable.');
    return context;
  }

  async function createScaledImageSource(file) {
    const image = await createImageBitmap(file);
    const sourceWidth = image.width || 0;
    const sourceHeight = image.height || 0;
    const longestSide = Math.max(sourceWidth, sourceHeight);

    if (!sourceWidth || !sourceHeight || longestSide <= MAX_INPUT_DIMENSION) {
      return {
        source: image,
        close() {
          if (typeof image.close === 'function') image.close();
        }
      };
    }

    const scale = MAX_INPUT_DIMENSION / longestSide;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sourceWidth * scale));
    canvas.height = Math.max(1, Math.round(sourceHeight * scale));
    get2d(canvas).drawImage(image, 0, 0, canvas.width, canvas.height);
    if (typeof image.close === 'function') image.close();

    return {
      source: canvas,
      close() {}
    };
  }

  async function processWithEsmLibrary(file) {
    const library = await getLibraryModule();
    if (!library || typeof library.createCutoutTasks !== 'function' || typeof library.cutoutFaceHair !== 'function') {
      throw new Error('The face-hair-cutout-js module did not expose createCutoutTasks and cutoutFaceHair.');
    }

    const imageSource = await createScaledImageSource(file);
    let tasks = null;
    try {
      tasks = await library.createCutoutTasks({
        segmenterModelPath: DEFAULT_SEGMENTER_MODEL
      });
      return library.cutoutFaceHair(imageSource.source, tasks, CUTOUT_OPTIONS);
    } finally {
      closeTasks(tasks);
      imageSource.close();
    }
  }

  function readImageSize(dataUrl) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({
        width: image.naturalWidth || image.width || 0,
        height: image.naturalHeight || image.height || 0
      });
      image.onerror = () => reject(new Error('The extracted PNG could not be read.'));
      image.src = dataUrl;
    });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('The extracted PNG could not be read.'));
      reader.readAsDataURL(blob);
    });
  }

  function canvasToDataUrl(canvas) {
    if (typeof canvas.toDataURL !== 'function') return null;
    return canvas.toDataURL('image/png');
  }

  async function imageDataToDataUrl(imageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d').putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }

  async function normalizeResult(result) {
    if (!result) {
      throw new Error('Extraction failed: no cutout was returned.');
    }

    let dataUrl = null;
    let width = result.width || 0;
    let height = result.height || 0;

    if (typeof result === 'string') {
      dataUrl = result;
    } else if (result.dataUrl || result.dataURL || result.pngDataUrl || result.pngDataURL) {
      dataUrl = result.dataUrl || result.dataURL || result.pngDataUrl || result.pngDataURL;
    } else if (result.blob instanceof Blob) {
      dataUrl = await blobToDataUrl(result.blob);
    } else if (result instanceof Blob) {
      dataUrl = await blobToDataUrl(result);
    } else if (result.canvas instanceof HTMLCanvasElement) {
      dataUrl = canvasToDataUrl(result.canvas);
      width = width || result.canvas.width;
      height = height || result.canvas.height;
    } else if (result instanceof HTMLCanvasElement) {
      dataUrl = canvasToDataUrl(result);
      width = width || result.width;
      height = height || result.height;
    } else if (result.imageData instanceof ImageData) {
      dataUrl = await imageDataToDataUrl(result.imageData);
      width = width || result.imageData.width;
      height = height || result.imageData.height;
    } else if (result instanceof ImageData) {
      dataUrl = await imageDataToDataUrl(result);
      width = width || result.width;
      height = height || result.height;
    }

    if (!dataUrl || !/^data:image\/png;base64,/i.test(dataUrl)) {
      throw new Error('Extraction failed: the library did not return a transparent PNG data URL.');
    }

    if (!width || !height) {
      const size = await readImageSize(dataUrl);
      width = size.width;
      height = size.height;
    }

    return {
      dataUrl,
      width,
      height,
      metadata: result && typeof result === 'object' ? (result.metadata || result.meta || {}) : {}
    };
  }

  async function processUploadedFaceImage(file) {
    if (!file || !SUPPORTED_IMAGE_TYPE.test(file.type || '')) {
      throw new Error('Invalid file. Choose a PNG, JPG, or WebP image.');
    }

    const library = getLibrary();
    const processor = getProcessor(library);

    try {
      const result = processor
        ? await processor.call(library, file, {
          output: 'dataUrl',
          mimeType: 'image/png',
          transparent: true
        })
        : await processWithEsmLibrary(file);
      return normalizeResult(result);
    } catch (error) {
      const message = String(error && (error.message || error) || '');
      if (/no face|face.*not.*detect|detect.*face/i.test(message)) {
        throw new Error('No face detected. Try a clearer front-facing portrait.');
      }
      if (/failed to fetch dynamically imported module|import.*module|createCutoutTasks|cutoutFaceHair/i.test(message)) {
        throw new Error(`The face-hair-cutout-js library is not loaded: ${message || 'module import failed.'}`);
      }
      throw new Error(`Extraction failed: ${message || 'the cutout could not be created.'}`);
    }
  }

  window.FaceHairCutoutAdapter = {
    isLoaded() {
      return !!getProcessor(getLibrary()) || !!getModuleUrl();
    },
    processUploadedFaceImage
  };
}());
