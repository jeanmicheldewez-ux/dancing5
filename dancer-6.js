let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let source;
let analyzerNode;

let audioSessionId = 0;
let renderLoopActive = false;


let thisrun = 0;
let lastrun = 0;
 
let isPlaying = 0;



let trainingData = [];


let network = null;

let flagLearned = 1;
let allPos;
let newDt;

const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

 

// Global variables

let currentModelName = null;
let trainingSettings = {};

let flagPannel = true;

// DOM elements
 
 
const createModelBtn = document.getElementById('create-model-btn');
const trainModelBtn = document.getElementById('train-model-btn');
const saveModelBtn = document.getElementById('save-model-btn');
const saveDataBtn = document.getElementById('save-data-btn');
const downloadModelBtn = document.getElementById('download-model-btn');
const exportModelJsonBtn = document.getElementById('export-model-json-btn');
const importModelJsonBtn = document.getElementById('import-model-json-btn');
const importModelJsonInput = document.getElementById('import-model-json-input');
const loadDemoModelBtn = document.getElementById('load-demo-model-btn');
const modelJsonStatus = document.getElementById('model-json-status');
const avatarStyleSelect = document.getElementById('avatar-style-select');
const avatarHeadPictureControls = document.getElementById('avatar-head-picture-controls');
const avatarHeadPictureSelect = document.getElementById('avatar-head-picture-select');
const avatarHeadPictureInput = document.getElementById('avatar-head-picture-input');
const avatarColorInput = document.getElementById('avatar-color-input');
const avatarThicknessSlider = document.getElementById('avatar-thickness-slider');
const musicReactivitySlider = document.getElementById('music-reactivity-slider');
const motionAmountSlider = document.getElementById('motion-amount-slider');
const backgroundModeSelect = document.getElementById('background-mode-select');
const backgroundColorInput = document.getElementById('background-color-input');
const avatarVisualToggle = document.getElementById('avatar-visual-toggle');
const avatarVisualPanel = document.getElementById('avatar-visual-panel');
const modelManager = document.getElementById('model-manager');
const modelManagerToggle = document.getElementById('model-manager-toggle');
const mainControls = document.getElementById('controls');
const mainControlsToggle = document.getElementById('main-controls-toggle');
const trainingLog = document.getElementById('training-log');

const MODEL_EXPORT_FORMAT_VERSION = 1;
const DEFAULT_DEMO_MODEL_PATH = 'examples/demo-breaker.json';
const DEFAULT_DEMO_MODEL_NAME = 'demo-breaker.json';
const EXAMPLE_MODEL_MANIFEST_PATH = 'examples/models.json';
const EXAMPLE_MODEL_FILES = [
  'demo-breaker.json',
  'demo-disco.json'
];
const LAST_MODEL_STORAGE_KEY = 'Dancing5.lastModelName';
const SETTINGS_STORE_NAME = 'settings';
const LAST_SESSION_SETTINGS_NAME = '__last-session__';
const HEAD_PICTURES_STORAGE_KEY = 'Dancing5.headPictures';
const SELECTED_HEAD_PICTURE_STORAGE_KEY = 'Dancing5.selectedHeadPicture';
const UPLOAD_HEAD_PICTURE_VALUE = '__upload_head_picture__';
const DEFAULT_HEAD_PICTURE = {
  name: 'jmx',
  src: 'pictures/jmx.png',
  builtIn: true
};
const DEFAULT_VISUAL_SETTINGS = {
  avatarStyle: 'robot',
  avatarColor: '#3a5fad',
  avatarThickness: 1,
  musicReactivity: 50,
  motionAmount: 50,
  backgroundMode: 'none',
  backgroundColor: '#000000'
};
let visualSettings = Object.assign({}, DEFAULT_VISUAL_SETTINGS);
const CUSTOM_HEAD_IMAGE = new Image();
let selectedHeadPictureName = DEFAULT_HEAD_PICTURE.name;

function setMainControlsVisible(visible) {
  if (mainControls) mainControls.style.display = visible ? '' : 'none';
  if (visible) {
    if (avatarVisualPanel) avatarVisualPanel.style.display = 'none';
    if (modelManager) modelManager.style.display = 'none';
    if (avatarVisualToggle) avatarVisualToggle.setAttribute('aria-expanded', 'false');
    if (modelManagerToggle) modelManagerToggle.setAttribute('aria-expanded', 'false');
  }
  if (mainControlsToggle) mainControlsToggle.setAttribute('aria-expanded', visible ? 'true' : 'false');
}

function setModelManagerVisible(visible) {
  if (modelManager) modelManager.style.display = visible ? '' : 'none';
  if (visible) {
    if (avatarVisualPanel) avatarVisualPanel.style.display = 'none';
    if (mainControls) mainControls.style.display = 'none';
    if (avatarVisualToggle) avatarVisualToggle.setAttribute('aria-expanded', 'false');
    if (mainControlsToggle) mainControlsToggle.setAttribute('aria-expanded', 'false');
  }
  if (modelManagerToggle) modelManagerToggle.setAttribute('aria-expanded', visible ? 'true' : 'false');
}

function setAvatarVisualPanelVisible(visible) {
  if (avatarVisualPanel) avatarVisualPanel.style.display = visible ? 'flex' : 'none';
  if (visible) {
    if (modelManager) modelManager.style.display = 'none';
    if (mainControls) mainControls.style.display = 'none';
    if (modelManagerToggle) modelManagerToggle.setAttribute('aria-expanded', 'false');
    if (mainControlsToggle) mainControlsToggle.setAttribute('aria-expanded', 'false');
  }
  if (avatarVisualToggle) avatarVisualToggle.setAttribute('aria-expanded', visible ? 'true' : 'false');
  if (visible) flagPannel = false;
}

setModelManagerVisible(false);
setAvatarVisualPanelVisible(false);
setMainControlsVisible(true);

 
const learningRateInput = document.getElementById('learning-rate');
const learningRateValue = document.getElementById('learning-rate-value');

let validation = "sigmoid"; 
let startupDemoLoadStarted = false;
let lastSessionSaveTimer = null;
let sessionAutosaveEnabled = false;

function scheduleLastSessionSave() {
  if (!sessionAutosaveEnabled) return;
  if (lastSessionSaveTimer) clearTimeout(lastSessionSaveTimer);
  lastSessionSaveTimer = setTimeout(async () => {
    try {
      if (currentModelName) await saveModelSettings(currentModelName);
      await saveLastSession();
    } catch (error) {
      console.warn('Could not autosave settings:', error);
    }
  }, 250);
}

function getModelDisplayName(modelName) {
  return String(modelName || '').replace(/\.json$/i, '');
}

function getPictureDisplayName(fileName) {
  return String(fileName || '').replace(/\.(png|jpe?g)$/i, '');
}

function readStoredHeadPictures() {
  try {
    const saved = JSON.parse(localStorage.getItem(HEAD_PICTURES_STORAGE_KEY) || '[]');
    return Array.isArray(saved)
      ? saved.filter(item => item && item.name && item.src)
      : [];
  } catch (error) {
    console.warn('Could not read saved head pictures:', error);
    return [];
  }
}

function writeStoredHeadPictures(pictures) {
  try {
    localStorage.setItem(HEAD_PICTURES_STORAGE_KEY, JSON.stringify(pictures));
  } catch (error) {
    console.warn('Could not save head picture. The image may be too large for localStorage:', error);
    alert('This picture is too large to save locally. Try a smaller PNG or JPG.');
  }
}

function getHeadPictures() {
  const stored = readStoredHeadPictures();
  const byName = new Map([[DEFAULT_HEAD_PICTURE.name, DEFAULT_HEAD_PICTURE]]);
  stored.forEach(item => byName.set(item.name, item));
  return Array.from(byName.values());
}

function rememberSelectedHeadPicture(name) {
  try {
    localStorage.setItem(SELECTED_HEAD_PICTURE_STORAGE_KEY, name);
  } catch (error) {
    console.warn('Could not save selected head picture:', error);
  }
}

function setCustomHeadPicture(name) {
  const pictures = getHeadPictures();
  const picture = pictures.find(item => item.name === name) || DEFAULT_HEAD_PICTURE;
  selectedHeadPictureName = picture.name;
  CUSTOM_HEAD_IMAGE.src = picture.src;
  rememberSelectedHeadPicture(selectedHeadPictureName);
  if (avatarHeadPictureSelect) avatarHeadPictureSelect.value = selectedHeadPictureName;
}

function populateHeadPictureSelect() {
  if (!avatarHeadPictureSelect) return;

  const previousValue = selectedHeadPictureName || DEFAULT_HEAD_PICTURE.name;
  avatarHeadPictureSelect.innerHTML = '';

  getHeadPictures().forEach(picture => {
    const option = document.createElement('option');
    option.value = picture.name;
    option.textContent = picture.name;
    avatarHeadPictureSelect.appendChild(option);
  });

  const uploadOption = document.createElement('option');
  uploadOption.value = UPLOAD_HEAD_PICTURE_VALUE;
  uploadOption.textContent = 'UPLOAD';
  uploadOption.className = 'avatar-head-upload-option';
  avatarHeadPictureSelect.appendChild(uploadOption);

  const hasPrevious = Array.from(avatarHeadPictureSelect.options).some(option => option.value === previousValue);
  avatarHeadPictureSelect.value = hasPrevious ? previousValue : DEFAULT_HEAD_PICTURE.name;
}

function initializeHeadPictureSelect() {
  populateHeadPictureSelect();
  let savedName = DEFAULT_HEAD_PICTURE.name;
  try {
    savedName = localStorage.getItem(SELECTED_HEAD_PICTURE_STORAGE_KEY) || DEFAULT_HEAD_PICTURE.name;
  } catch (error) {
    console.warn('Could not read selected head picture:', error);
  }
  setCustomHeadPicture(savedName);
}

function saveUploadedHeadPicture(file) {
  if (!file) return;
  if (!/^image\/(png|jpeg)$/.test(file.type)) {
    alert('Please choose a PNG or JPG picture.');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const name = getPictureDisplayName(file.name) || 'custom-head';
    const pictures = readStoredHeadPictures().filter(item => item.name !== name);
    pictures.push({ name, src: reader.result });
    writeStoredHeadPictures(pictures);
    selectedHeadPictureName = name;
    populateHeadPictureSelect();
    setCustomHeadPicture(name);
    if (avatarStyleSelect) {
      avatarStyleSelect.value = 'myHead';
      readVisualSettingsFromControls();
    }
  };
  reader.onerror = () => alert('The picture could not be loaded.');
  reader.readAsDataURL(file);
}
 
// learningRateInput.addEventListener('input', updateLearningRateDisplay);

// function updateLearningRateDisplay() {
 
  // learningRateValue.textContent = parseFloat(learningRateInput.value).toFixed(4);
// }

/////////////////////////////


// À mettre une fois à l'init du canvas, avant tout drawRobotBoy
const dpr = window.devicePixelRatio || 1;
canvasElement.width  = canvasElement.clientWidth  * dpr;
canvasElement.height = canvasElement.clientHeight * dpr;
canvasCtx.scale(dpr, dpr);

function clearAvatarCanvas() {
  canvasCtx.save();
  canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.restore();
}

// Get the DOM elements
const learnTimeInput = document.getElementById('learn-time');
const learnTimeValue = document.getElementById('learn-time-value');
  let timeLearn = 7;
 
// Update learning time display
 learnTimeInput.addEventListener('input', updateLearnTimeDisplay);

function updateLearnTimeDisplay() {
  // Get the input value in minutes
  const learnTimeMinutes = parseFloat(learnTimeInput.value);
  let timeString = '';
   timeLearn = 0; // Result in seconds

  // Handle the different ranges based on thirds
  const maxMinutes = 1440;
  const firstThird = maxMinutes / 3; // 480 minutes
  const secondThird = 2 * maxMinutes / 3; // 960 minutes

  if (learnTimeMinutes <= firstThird) {
    // First third: map value to seconds (1-59 seconds)
    const mappedValue = mapValue(learnTimeMinutes, 0, firstThird, 1, 59);
    timeString = `${mappedValue}s`;
    timeLearn = mappedValue;
  } else if (learnTimeMinutes <= secondThird) {
    // Second third: map value to minutes (1-59 minutes)
    const mappedValue = mapValue(learnTimeMinutes, firstThird, secondThird, 1, 59);
    timeString = `${mappedValue}m`;
    timeLearn = mappedValue * 60;
  } else {
    // Last third: map value to hours (1-24 hours)
    const mappedValue = mapValue(learnTimeMinutes, secondThird, maxMinutes, 1, 24);
    timeString = `${mappedValue}h`;
    timeLearn = mappedValue * 3600;
  }

  // Update the displayed value
  learnTimeValue.textContent = timeString;
  scheduleLastSessionSave();
  //console.log('Result Value in Seconds:', timeLearn); // Log result value in seconds for debugging
}

// Utility function to map a value from one range to another
function mapValue(value, inMin, inMax, outMin, outMax) {
  return Math.floor(((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin);
}

// Set initial display value
updateLearnTimeDisplay();



////////////////////////////////

const validationSelect = document.getElementById('validation-select');
  const validations = ['sigmoid', 'tanh', 'relu', 'leaky-relu', 'softmax'];

// Populate validation select options
function populateValidationOptions() {

  validations.forEach(validation => {
    const option = document.createElement('option');
    option.value = validation;
    option.textContent = validation;
    validationSelect.appendChild(option);
  });
}

// Call the function to populate the select element
populateValidationOptions();

// Handle validation select change
validationSelect.addEventListener('change', updateValidationSelection);

function updateValidationSelection(event) {
  validation = event.target.value;
  scheduleLastSessionSave();
}
//////////////////////////////////

 

var trainSelect = document.getElementById('train-select');
trainSelect.addEventListener('change', updateDataSelection);

function updateDataSelection(event) {
  const selectedData= trainSelect.value;

    loadTrainData(selectedData);
 
 }

 
function loadTrainData(tID) {
	const trainId = parseInt(tID, 10);
    const transaction = db.transaction(['datas'], 'readonly');
    const objectStore = transaction.objectStore('datas');
    const request = objectStore.get(trainId);

    request.onsuccess = function(event) {
        const data = event.target.result;
        if (data) {
            trainingData = data.data;
			dataName = data.name;
			
          console.log('Training data loaded:', trainingData);			
			document.getElementById('moncount').textContent = trainingData.length;

        } else {
            console.error('Training data not found.');
        }
    };

    request.onerror = function(event) {
        console.error('Error loading training data:', event.target.errorCode);
    };
}
 
 
////////////

const hiddenLayersContainer = document.getElementById('hidden-layers-container');


function populateHiddenLayerOptions() {
  hiddenLayersContainer.style.display = 'flex';
  hiddenLayersContainer.style.gap = '10px';

  for (let i = 1; i <= 4; i++) {
    const hiddenLayerDiv = document.createElement('div');
    hiddenLayerDiv.className = `hidden-layer hidden-layer-${i}`;

 

    const select = document.createElement('select');
    select.id = `hidden-layer-${i}`;
    for (let j = 0; j <= 128; j++) {
      const option = document.createElement('option');
      option.value = j;
      option.textContent = j;
      select.appendChild(option);
    }

 
    hiddenLayerDiv.appendChild(select);
    hiddenLayersContainer.appendChild(hiddenLayerDiv);
  }
}

// Call the function to populate hidden layer options
populateHiddenLayerOptions();


 let hiddenLayers = []; 
    // Update hidden layer configuration on change
    document.getElementById('hidden-layers-container').addEventListener('change', updateHiddenLayers);

function updateHiddenLayers() {
      const hiddenLayerSelects = document.querySelectorAll('#hidden-layers-container select');
        hiddenLayers = [];
      hiddenLayerSelects.forEach(select => {
        const value = parseInt(select.value, 10);
        if (value > 0) {
          hiddenLayers.push(value);
        }
      });
      console.log('Updated Hidden Layers:', hiddenLayers); // For debugging
      // Assuming a global `network` object to set hidden layers
      if (typeof network !== 'undefined' && network !== null) {
      // network.hiddenLayers = hiddenLayers;
      }
      scheduleLastSessionSave();
} 


// Event listeners
  createModelBtn.addEventListener('click', createNewModel);
  saveModelBtn.addEventListener('click', saveModel);  
  if (exportModelJsonBtn) exportModelJsonBtn.addEventListener('click', exportCurrentModelJson);
  if (importModelJsonBtn && importModelJsonInput) {
    importModelJsonBtn.addEventListener('click', () => importModelJsonInput.click());
    importModelJsonInput.addEventListener('change', importModelJsonFile);
  }
  if (loadDemoModelBtn) loadDemoModelBtn.addEventListener('click', loadDemoModelJson);
  if (avatarVisualToggle && avatarVisualPanel) {
    avatarVisualToggle.addEventListener('click', () => {
      setAvatarVisualPanelVisible(avatarVisualPanel.style.display === 'none');
    });
  }
  if (modelManagerToggle && modelManager) {
    modelManagerToggle.addEventListener('click', () => {
      setModelManagerVisible(modelManager.style.display === 'none');
    });
  }
  if (mainControlsToggle && mainControls) {
    mainControlsToggle.addEventListener('click', () => {
      setMainControlsVisible(mainControls.style.display === 'none');
    });
  }
  
   saveDataBtn.addEventListener('click', saveData); 
  
//  .addEventListener('click', saveDataModel);
// trainModelBtn.addEventListener('click', trainModel);

 
// downloadModelBtn.addEventListener('click', downloadModel);
// modelSelect.addEventListener('change', selectModel);
 
// function init() {
  // loadModels();
  // updateModelSelect();
// }

// init();

function onResults(results) {
    if (!results.poseLandmarks) {
       // console.log('No pose landmarks detected');
        return;
    }
	 
	
    let okpos = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];  
    let len = okpos.length;
    allPos = [];
    let flagNan = false;
	
	let tete = 0;
	let pied =0;
	
    for (let i = 0; i < len; i++) {
        let landmark = results.poseLandmarks[okpos[i]];

        // Check if landmark.x or landmark.y is NaN
        if (isNaN(landmark.x) || isNaN(landmark.y) || isNaN(landmark.z )) {
            //console.log(`NaN detected at landmark ${okpos[i]}:`, landmark);
            flagNan = true;
            break; // Optionally break if you want to stop processing further landmarks
        }
		
		if( i ==0 )tete = landmark.y;
		else if( i == 12 ) pied = landmark.y;
		
		
		//if( pied == 0 && tete == 0)


        allPos.push(landmark);
    }
	
	
	if(tete <= 0 || pied >= 1 || pied <= 0 || tete >= 1){  allPos = [];  return; }

    if (flagNan) {
        console.log('One or more landmarks contain NaN values.');
        return; // Exit the function if NaN is detected
    }
	
    thisrun++;
}


const pose = new Pose({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`
});


pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: true,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    num_poses: 2
});

pose.onResults(onResults);

async function processVideoFrame() {  
    if(isVideo)
	{
		if (!videoPlayer.paused && !videoPlayer.ended) {
		  if(flagLearned == 0 && isVideo == true)  await pose.send({ image: videoPlayer });
		//    console.log("vizvideau");
			visualize(); // Call visualize function for drawing xoxo
			requestAnimationFrame(processVideoFrame);
		}  		
	}
	else
	{
		  if (!audioPlayer.paused && !audioPlayer.ended) {
 

		}  		
			visualize(); // Call visualize function for drawing xoxo
			requestAnimationFrame(processVideoFrame);		 

		
	}


}

// Check if AudioContext is running and resume it if needed
document.body.addEventListener('click', () => {
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            console.log(`AudioContext resumed after user gesture. State: ${audioContext.state}`);
        });
    }
});


let dataArray;
	

function mapval(value, fromMin, fromMax, toMin, toMax) {
    let percentage = (value - fromMin) / (fromMax - fromMin);
    return Number(toMin + percentage * (toMax - toMin));
}
 
 
let isMicrophoneActive = false;
let microphoneStream = null; 

let analyzer = null;
let gainNode = null;
let micAnalysisGainNode = null;
let lastAudioLevelLogAt = 0;
let soundMeterBars = [];
 
 
// Track if analysis loop is running
let analysisLoopActive = false;
 
 
// Initialize or reset audio context
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function resumeAudioContext(context, label) {
  if (!context) return Promise.resolve();

  console.log(`${label || 'AudioContext'} state: ${context.state}`);

  if (context.state === 'suspended') {
    return context.resume().then(() => {
      console.log(`${label || 'AudioContext'} resumed. State: ${context.state}`);
    });
  }

  return Promise.resolve();
}

function initSoundMeter() {
  const meter = document.getElementById("monsound");
  if (!meter) return;

  meter.innerHTML = '';
  soundMeterBars = [];

  for (let i = 0; i < 64; i++) {
    const bar = document.createElement('span');
    bar.style.display = 'block';
    bar.style.width = '2px';
    bar.style.height = '1px';
    bar.style.backgroundColor = '#00ff66';
    bar.style.opacity = '0.7';
    meter.appendChild(bar);
    soundMeterBars.push(bar);
  }
}

function updateSoundMeter(frequencyData) {
  if (!soundMeterBars.length) initSoundMeter();
  if (!soundMeterBars.length || !frequencyData) return;

  for (let i = 0; i < 64; i++) {
    const value = frequencyData[i] || 0;
    const height = Math.max(1, Math.round((value / 255) * 20));
    const hot = value > 170;
    soundMeterBars[i].style.height = `${height}px`;
    soundMeterBars[i].style.backgroundColor = hot ? '#ff2200' : '#00ff66';
  }
}

function setHumanSelectorControlsVisible(visible) {
  const controls = document.getElementById('human-selector-controls');
  if (controls) controls.style.display = visible ? '' : 'none';

  if (!visible) {
    resetHumanSelectionState();
    clearHumanOverlay();
    if (humanOverlayCanvas) humanOverlayCanvas.style.display = 'none';
  }
}

function setMicCheckboxChecked(checked) {
  const micCheckbox = document.getElementById("mic");
  if (micCheckbox) micCheckbox.checked = checked;
}
// Keep track of all media elements that have been connected
let connectedMediaElements = new Map();
let currentMediaElement = null;

// Initialize media element source
function initVideoAudio(mediaPlayer) {
  if (!mediaPlayer) {
    console.error("No media element provided");
    return;
  }

  // Initialize audio context if needed
  const context = initAudioContext();
  
  // Ensure context is running
  resumeAudioContext(context, 'Media AudioContext');

  // Check if this media element is already connected
  if (connectedMediaElements.has(mediaPlayer)) {
    console.log("Using existing connection for media element");
    const existingSource = connectedMediaElements.get(mediaPlayer);
    
    // Clean up previous connections but keep the source
    if (analyzer) {
      analyzer.disconnect();
    }
    if (gainNode) {
      gainNode.disconnect();
    }
    
    // Set current media element and source
    currentMediaElement = mediaPlayer;
    source = existingSource;
    
    // Initialize analyzer with the existing source
    initAnalyzer(source);
    return;
  }

  // Clean up any previous audio connections
  cleanupAudio();
  
  // Create new connection
  try {
    source = context.createMediaElementSource(mediaPlayer);
    // Store this connection for future reference
    connectedMediaElements.set(mediaPlayer, source);
    currentMediaElement = mediaPlayer;
   //  console.log("Created new MediaElementSource:", source);
    
    // Initialize analyzer with the new source
    initAnalyzer(source);
  } catch (error) {
    console.error("Error creating media source:", error);
    cleanupAudio();
  }
}

function cleanupAudio() {
  audioSessionId++;
  analysisLoopActive = false;
  renderLoopActive = false;

  if (analyzer) {
    try { analyzer.disconnect(); } catch(e) {}
    analyzer = null;
  }

  if (gainNode) {
    try { gainNode.disconnect(); } catch(e) {}
    gainNode = null;
  }

  if (micAnalysisGainNode) {
    try { micAnalysisGainNode.disconnect(); } catch(e) {}
    micAnalysisGainNode = null;
  }

  // Important: do not disconnect MediaElementSource here.
  // It can break reuse of <audio>/<video>.
  source = null;

  if (microphoneStream) {
    microphoneStream.getTracks().forEach(track => track.stop());
    microphoneStream = null;
  }

  currentMediaElement = null;
}


// When you want to completely clean resources (like when your app is closing)
function destroyAudioContext() {
  cleanupAudio();
  connectedMediaElements.clear();
  if (audioContext) {
    audioContext.close().then(() => {
    //  console.log("Audio context closed");
      audioContext = null;
    });
  }
}

// Modified initAnalyzer function
function initAnalyzer(source) {
  if (!source) {
    console.error("Cannot initialize analyzer: No source provided");
    return;
  }
  
  // Stop previous analysis loop
  analysisLoopActive = false;
  
  // Short delay to ensure previous loop is stopped
  setTimeout(() => {
    if (analyzer) analyzer.disconnect();
    if (gainNode) gainNode.disconnect();
    if (micAnalysisGainNode) micAnalysisGainNode.disconnect();
    micAnalysisGainNode = null;
    
    console.log(`AudioContext state before analyser setup: ${audioContext.state}`);

    analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 512;
    analyzer.smoothingTimeConstant = 0.785;
    
    gainNode = audioContext.createGain();
    gainNode.gain.value = 1;
    
    // Connect new nodes. Microphone gets analysis gain only, never speaker output.
    if (isMicrophoneActive) {
      micAnalysisGainNode = audioContext.createGain();
      micAnalysisGainNode.gain.value = 4;
      source.connect(micAnalysisGainNode);
      micAnalysisGainNode.connect(analyzer);
      console.log(`Microphone analyser connected with analysis gain ${micAnalysisGainNode.gain.value}`);
    } else {
      source.connect(analyzer);
      console.log("Media analyser connected");
    }
    
    // Only connect to output if NOT microphone
    if (!isMicrophoneActive) {
      analyzer.connect(gainNode);
      gainNode.connect(audioContext.destination);
      console.log("Audio connected to output (non-microphone source)");
    } else {
      console.log("Microphone input - NOT connecting to output to prevent feedback");
    }
    
    // Start the analysis loop
    analysisLoopActive = true;
    console.log("Meyda/analyser loop started");
    analyzeAudio();
  }, 100);
}




let lastBeatTime2 = 0;
let lastBeatTime = 0;

let lastBeat = 0;

let beatFlag = 0;

function analyzeAudio() {
  // Only continue if the loop is active and analyzer exists
  if (!analysisLoopActive || !analyzer) {
    console.log("Analysis loop stopped or analyzer not available");
    return; // Exit the loop
  }

  try {
    let dataArray = new Uint8Array(analyzer.frequencyBinCount);
    analyzer.getByteFrequencyData(dataArray);

    // Debug info - show what we're getting from the analyzer
    const sum = dataArray[0] + dataArray[10] + dataArray[20] + dataArray[30] + dataArray[40]+"";
	
	
	 let lowEnergy = 0;
            for (let i = 2; i < 5; i++) {
              lowEnergy += dataArray[i];
            }
            lowEnergy /= 3;

            const now = performance.now();
            const threshold = (isMicrophoneActive ? 14 : 160) / getMusicReactivityFactor();

            if (lowEnergy > threshold && now - lastBeatTime > 220) {
             //console.log("BEAT!", lowEnergy);
			  lastBeat = now - lastBeatTime; 
			  if(lastBeat > 1000)lastBeat = 1000;
              lastBeatTime = now;
			  beatFlag = 1;
            }

			
		let highEnergy = 0;
		
			
		for (let i = 6; i <= 15; i++) {
		  highEnergy += dataArray[i];
		}
		highEnergy /= 8;

	 
		const threshold2 = (isMicrophoneActive ? 12 : 140) / getMusicReactivityFactor();

		if (highEnergy > threshold2 && now - lastBeatTime2 > 270) {
		 // console.log("HIGH BEAT!", highEnergy);
		 
		  lastBeat = now - lastBeatTime; 
		  if(lastBeat > 1000)lastBeat = 1000;
		 
		  lastBeatTime2 = now;
		  
		  beatFlag = 1;
		  
		  
		}	
	
	
    updateSoundMeter(dataArray);
    if (isMicrophoneActive && now - lastAudioLevelLogAt > 1500) {
      lastAudioLevelLogAt = now;
     // console.log(`Microphone audio level low=${lowEnergy.toFixed(2)} high=${highEnergy.toFixed(2)} ctx=${audioContext ? audioContext.state : 'none'}`);
    }
    //console.log("Audio data sum:", sum); // Debug the audio data

  
    if (isPlaying === 1 || isMicrophoneActive) {
      newDt = [];
      for (let i = 0; i < 64; i++) {
        newDt.push(dataArray[i] / 255); // Normalize values to [0, 1]
      }
	  
	//  console.log(isMicrophoneActive , isVideo );

      // For microphone or audio file, we still want to use the frequency data
      if (isMicrophoneActive || !isVideo) {
        // Process audio data here as needed
     //   console.log("Processing audio data from microphone or audio file");
      }

      if (
        allPos &&
        allPos.length !== 0 &&
        flagLearned === 0 &&
        lastrun !== thisrun &&
        isVideo
      ) {
		  
		if( beatFlag == 1)
		{
			beatFlag = 0;
	    
			lastrun = thisrun;

			let newPos = allPos.flatMap((landmark) => [
			  (landmark.x + 1) / 2,
			  landmark.y / 3,
			  (landmark.z + 5) / 10,
			]);

			trainingData.push({
			  input: newDt,
			  output: newPos,
			});

			document.getElementById("moncount").innerHTML = trainingData.length;
			
		 } 
      }
    }

    // Continue the loop if still active
    if (analysisLoopActive) {
      requestAnimationFrame(analyzeAudio);
    }
  } catch (error) {
    console.error("Error in audio analysis:", error);
    console.error("Analyzer state:", analyzer ? "exists" : "null");
    analysisLoopActive = false; // Stop the loop on error
  }
}

const mediaFileInput = document.getElementById('mediaFileInput');
const videoPlayer = document.getElementById('inputVideo');
const audioPlayer = document.getElementById('inputAudio');
const humanOverlayCanvas = document.getElementById('humanOverlay');
const humanOverlayCtx = humanOverlayCanvas ? humanOverlayCanvas.getContext('2d') : null;
const humanSelectorEnabledInput = document.getElementById('enable-human-selector');
const autoSelectHumanInput = document.getElementById('auto-select-human');
const selectedHumanLabel = document.getElementById('selected-human-label');

let isVideo = null;

const PERSON_CATEGORY_NAMES = new Set(['person']);
const HUMAN_DETECTION_INTERVAL_MS = 350;
const HUMAN_CROP_MARGIN_RATIO = 0.16;
const HUMAN_SELECTION_LOST_TIMEOUT_MS = 1800;
const HUMAN_SELECTION_MAX_JUMP_RATIO = 0.45;

let humanSelectorEnabled = humanSelectorEnabledInput ? humanSelectorEnabledInput.checked : true;
let autoSelectHuman = autoSelectHumanInput ? autoSelectHumanInput.checked : true;
let lastDetectedHumans = [];
let selectedHumanId = null;
let selectedHumanBox = null;
let selectedHumanLockedByUser = false;
let lastHumanDetectionAt = 0;
let lastPoseCropSourceBox = null;
let objectDetectorWarned = false;
let nextHumanTrackId = 0;
let selectedHumanLastConfirmedAt = 0;

const selectedHumanCropCanvas = document.createElement('canvas');
const selectedHumanCropCtx = selectedHumanCropCanvas.getContext('2d');

function updateSelectedHumanLabel() {
  if (!selectedHumanLabel) return;

  if (!humanSelectorEnabled) {
    selectedHumanLabel.textContent = 'disabled';
    return;
  }

  if (!selectedHumanBox) {
    selectedHumanLabel.textContent = 'none';
    return;
  }

  const percent = Math.round((selectedHumanBox.score || 0) * 100);
  selectedHumanLabel.textContent = `${selectedHumanBox.id} ${percent}%`;
}

function clearHumanOverlay() {
  if (!humanOverlayCanvas || !humanOverlayCtx) return;
  humanOverlayCtx.clearRect(0, 0, humanOverlayCanvas.width, humanOverlayCanvas.height);
}

function clearHumanSelection() {
  selectedHumanId = null;
  selectedHumanBox = null;
  selectedHumanLockedByUser = false;
  selectedHumanLastConfirmedAt = 0;
  lastPoseCropSourceBox = null;
  updateSelectedHumanLabel();
  drawHumanBoxes();
}

window.clearHumanSelection = clearHumanSelection;

function resetHumanSelectionState() {
  lastDetectedHumans = [];
  lastHumanDetectionAt = 0;
  clearHumanSelection();
  clearHumanOverlay();
}

function resizeHumanOverlayToVideo() {
  if (!humanOverlayCanvas || !videoPlayer) return;

  if (!isVideo || videoPlayer.style.display === 'none' || !videoPlayer.videoWidth || !videoPlayer.videoHeight) {
    humanOverlayCanvas.style.display = 'none';
    clearHumanOverlay();
    return;
  }

  const rect = videoPlayer.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  humanOverlayCanvas.style.display = humanSelectorEnabled ? 'block' : 'none';
  humanOverlayCanvas.style.left = `${rect.left}px`;
  humanOverlayCanvas.style.top = `${rect.top}px`;
  humanOverlayCanvas.style.width = `${rect.width}px`;
  humanOverlayCanvas.style.height = `${rect.height}px`;
  humanOverlayCanvas.width = videoPlayer.videoWidth;
  humanOverlayCanvas.height = videoPlayer.videoHeight;
}

function drawHumanLabel(box, isSelected) {
  if (!humanOverlayCtx) return;

  const label = isSelected ? 'SELECTED' : (box.label || 'PERSON').toUpperCase();
  const scoreText = `${Math.round((box.score || 0) * 100)}%`;
  const text = `${label} ${scoreText}`;

  humanOverlayCtx.font = '16px Monaco, monospace';
  const textWidth = humanOverlayCtx.measureText(text).width;
  const labelHeight = 20;
  const labelWidth = textWidth + 12;
  const labelX = box.x;
  const labelY = Math.max(0, box.y - labelHeight - 4);

  humanOverlayCtx.fillStyle = isSelected ? 'rgba(80, 160, 255, 0.85)' : 'rgba(255, 210, 0, 0.85)';
  humanOverlayCtx.fillRect(labelX, labelY, labelWidth, labelHeight);
  humanOverlayCtx.fillStyle = '#000';
  humanOverlayCtx.fillText(text, labelX + 6, labelY + 15);
}

function drawHumanBoxes() {
  if (!humanOverlayCanvas || !humanOverlayCtx) return;

  clearHumanOverlay();

  if (!humanSelectorEnabled) return;

  lastDetectedHumans.forEach((box) => {
    const isSelected = selectedHumanId === box.id;
    humanOverlayCtx.strokeStyle = isSelected ? '#4da3ff' : '#ffe100';
    humanOverlayCtx.lineWidth = isSelected ? 4 : 3;
    humanOverlayCtx.strokeRect(box.x, box.y, box.width, box.height);
    drawHumanLabel(box, isSelected);
  });

  const hasLiveSelectedBox = selectedHumanId && lastDetectedHumans.some((box) => box.id === selectedHumanId);
  if (selectedHumanBox && selectedHumanId && !hasLiveSelectedBox) {
    humanOverlayCtx.save();
    humanOverlayCtx.setLineDash([10, 8]);
    humanOverlayCtx.strokeStyle = '#4da3ff';
    humanOverlayCtx.lineWidth = 4;
    humanOverlayCtx.strokeRect(selectedHumanBox.x, selectedHumanBox.y, selectedHumanBox.width, selectedHumanBox.height);
    humanOverlayCtx.restore();
    drawHumanLabel({ ...selectedHumanBox, label: 'selected' }, true);
  }
}

function getHumanCenter(box) {
  return {
    x: box.x + (box.width / 2),
    y: box.y + (box.height / 2)
  };
}

function getDistanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return (dx * dx) + (dy * dy);
}

function chooseHighestScoreHuman(humans) {
  if (!humans.length) return null;
  return humans.reduce((best, current) => ((current.score || 0) > (best.score || 0) ? current : best), humans[0]);
}

function assignStableHumanIds(humans, previousHumans) {
  if (!humans.length) return humans;

  const remainingPrevious = [...previousHumans];
  const maxMatchDistanceScale = 0.9;

  return humans.map((human) => {
    const humanCenter = getHumanCenter(human);
    let bestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    remainingPrevious.forEach((previousHuman, index) => {
      const previousCenter = getHumanCenter(previousHuman);
      const distance = Math.sqrt(getDistanceSquared(humanCenter, previousCenter));
      const maxMatchDistance = Math.max(previousHuman.width, previousHuman.height, human.width, human.height) * maxMatchDistanceScale;

      if (distance <= maxMatchDistance && distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });

    if (bestIndex >= 0) {
      const matchedPrevious = remainingPrevious.splice(bestIndex, 1)[0];
      return {
        ...human,
        id: matchedPrevious.id
      };
    }

    const stableId = `person-${nextHumanTrackId++}`;
    return {
      ...human,
      id: stableId
    };
  });
}

function findBestHumanMatch(targetBox, humans) {
  if (!targetBox || !humans.length) return null;

  const targetCenter = getHumanCenter(targetBox);
  let bestMatch = humans[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  humans.forEach((human) => {
    const distance = getDistanceSquared(targetCenter, getHumanCenter(human));
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = human;
    }
  });

  return bestMatch;
}

function findLockedHumanMatch(targetBox, humans) {
  const match = findBestHumanMatch(targetBox, humans);
  if (!match) return null;

  const targetCenter = getHumanCenter(targetBox);
  const matchCenter = getHumanCenter(match);
  const distance = Math.sqrt(getDistanceSquared(targetCenter, matchCenter));
  const maxFollowDistance = Math.max(targetBox.width, targetBox.height) * HUMAN_SELECTION_MAX_JUMP_RATIO;

  return distance <= maxFollowDistance ? match : null;
}

function syncSelectedHuman(humans, timestampMs) {
  if (!humans.length) {
    if (selectedHumanId) {
      const lostForMs = timestampMs - selectedHumanLastConfirmedAt;
      if (lostForMs > HUMAN_SELECTION_LOST_TIMEOUT_MS) {
        selectedHumanBox = null;
        selectedHumanId = null;
        selectedHumanLockedByUser = false;
      }
      updateSelectedHumanLabel();
      return;
    }

    if (autoSelectHuman) {
      clearHumanSelection();
    } else {
      selectedHumanBox = null;
      selectedHumanId = null;
      updateSelectedHumanLabel();
    }
    return;
  }

  if (!selectedHumanBox) {
    if (autoSelectHuman && !selectedHumanLockedByUser && !selectedHumanId) {
      selectedHumanBox = chooseHighestScoreHuman(humans);
      selectedHumanId = selectedHumanBox ? selectedHumanBox.id : null;
      selectedHumanLastConfirmedAt = selectedHumanBox ? timestampMs : 0;
      updateSelectedHumanLabel();
    }
    return;
  }

  const exactMatch = humans.find((human) => human.id === selectedHumanId);
  const matchedHuman = exactMatch || findLockedHumanMatch(selectedHumanBox, humans);

  if (matchedHuman) {
    selectedHumanBox = matchedHuman;
    selectedHumanId = matchedHuman.id;
    selectedHumanLastConfirmedAt = timestampMs;
  } else {
    const lostForMs = timestampMs - selectedHumanLastConfirmedAt;

    // Never jump from one person to another automatically.
    // Hold the current selection briefly when detections flicker or people cross.
    if (lostForMs > HUMAN_SELECTION_LOST_TIMEOUT_MS) {
      selectedHumanBox = null;
      selectedHumanId = null;
      selectedHumanLockedByUser = false;
    }
  }

  updateSelectedHumanLabel();
}

function setupHumanOverlay() {
  if (!humanOverlayCanvas) return;

  humanOverlayCanvas.addEventListener('pointerdown', (event) => {
    if (!humanSelectorEnabled || !lastDetectedHumans.length || !videoPlayer.videoWidth || !videoPlayer.videoHeight) {
      return;
    }

    const rect = humanOverlayCanvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const scaleX = humanOverlayCanvas.width / rect.width;
    const scaleY = humanOverlayCanvas.height / rect.height;
    const pointX = (event.clientX - rect.left) * scaleX;
    const pointY = (event.clientY - rect.top) * scaleY;

    const clickedHuman = lastDetectedHumans.find((human) => (
      pointX >= human.x &&
      pointX <= human.x + human.width &&
      pointY >= human.y &&
      pointY <= human.y + human.height
    ));

    if (!clickedHuman) return;

    selectedHumanId = clickedHuman.id;
    selectedHumanBox = clickedHuman;
    selectedHumanLockedByUser = true;
    selectedHumanLastConfirmedAt = performance.now();
    updateSelectedHumanLabel();
    drawHumanBoxes();
  });

  window.addEventListener('resize', resizeHumanOverlayToVideo);
  videoPlayer.addEventListener('loadedmetadata', resizeHumanOverlayToVideo);
  videoPlayer.addEventListener('play', resizeHumanOverlayToVideo);
}

function getDetectionCategoryName(detection) {
  if (!detection || !Array.isArray(detection.categories) || !detection.categories.length) {
    return '';
  }

  const category = detection.categories[0];
  return String(
    category.categoryName ||
    category.displayName ||
    category.category_name ||
    ''
  ).toLowerCase();
}

function detectHumans(videoElement, timestampMs) {
  const bridge = window.objectDetectionBridge;

  if (!humanSelectorEnabled || !bridge || typeof bridge.isReady !== 'function' || !bridge.isReady()) {
    return lastDetectedHumans;
  }

  const result = bridge.detectForVideo(videoElement, timestampMs);
  const detections = result && Array.isArray(result.detections) ? result.detections : [];

  // Convert raw detector output into the person-only boxes used by the selector UI.
  const humans = detections
    .map((detection, index) => {
      const box = detection.boundingBox;
      const label = getDetectionCategoryName(detection);

      if (!box || !PERSON_CATEGORY_NAMES.has(label)) {
        return null;
      }

      return {
        id: `person-raw-${index}`,
        x: box.originX || 0,
        y: box.originY || 0,
        width: box.width || 0,
        height: box.height || 0,
        score: detection.categories[0] ? detection.categories[0].score || 0 : 0,
        label
      };
    })
    .filter((human) => human && human.width > 0 && human.height > 0)
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  return assignStableHumanIds(humans, lastDetectedHumans);
}

function updateHumanDetections(timestampMs) {
  if (!isVideo || !videoPlayer.videoWidth || !videoPlayer.videoHeight) return;

  if (!humanSelectorEnabled) {
    resetHumanSelectionState();
    clearHumanOverlay();
    if (humanOverlayCanvas) humanOverlayCanvas.style.display = 'none';
    return;
  }

  const bridge = window.objectDetectionBridge;
  if (!bridge || typeof bridge.isReady !== 'function' || !bridge.isReady()) {
    if (bridge && bridge.error && !objectDetectorWarned) {
      console.warn('Object detector unavailable. Falling back to full-frame Pose.', bridge.error);
      objectDetectorWarned = true;
    }
    clearHumanOverlay();
    return;
  }

  resizeHumanOverlayToVideo();

  // Keep object detection cheap and reuse the last boxes between detector runs.
  if ((timestampMs - lastHumanDetectionAt) < HUMAN_DETECTION_INTERVAL_MS) {
    drawHumanBoxes();
    return;
  }

  try {
    lastDetectedHumans = detectHumans(videoPlayer, timestampMs);
    lastHumanDetectionAt = timestampMs;
    syncSelectedHuman(lastDetectedHumans, timestampMs);
    drawHumanBoxes();
  } catch (error) {
    console.error('Object detection error:', error);
    lastHumanDetectionAt = timestampMs;
    lastDetectedHumans = [];
    selectedHumanBox = null;
    selectedHumanId = null;
    updateSelectedHumanLabel();
    clearHumanOverlay();
  }
}

function clampBoxToVideo(box) {
  if (!box || !videoPlayer.videoWidth || !videoPlayer.videoHeight) return null;

  const clampedX = clamp(box.x, 0, videoPlayer.videoWidth);
  const clampedY = clamp(box.y, 0, videoPlayer.videoHeight);
  const maxWidth = Math.max(0, videoPlayer.videoWidth - clampedX);
  const maxHeight = Math.max(0, videoPlayer.videoHeight - clampedY);

  return {
    ...box,
    x: clampedX,
    y: clampedY,
    width: clamp(box.width, 0, maxWidth),
    height: clamp(box.height, 0, maxHeight)
  };
}

function getSelectedHumanCrop() {
  if (!selectedHumanBox || !videoPlayer.videoWidth || !videoPlayer.videoHeight) {
    return null;
  }

  // Reuse one hidden canvas so Pose receives only the selected body region.
  const clampedBox = clampBoxToVideo(selectedHumanBox);
  if (!clampedBox || !clampedBox.width || !clampedBox.height) {
    return null;
  }

  const marginX = clampedBox.width * HUMAN_CROP_MARGIN_RATIO;
  const marginY = clampedBox.height * HUMAN_CROP_MARGIN_RATIO;
  const cropX = clamp(clampedBox.x - marginX, 0, videoPlayer.videoWidth);
  const cropY = clamp(clampedBox.y - marginY, 0, videoPlayer.videoHeight);
  const cropRight = clamp(clampedBox.x + clampedBox.width + marginX, 0, videoPlayer.videoWidth);
  const cropBottom = clamp(clampedBox.y + clampedBox.height + marginY, 0, videoPlayer.videoHeight);
  const cropWidth = Math.max(1, cropRight - cropX);
  const cropHeight = Math.max(1, cropBottom - cropY);

  selectedHumanCropCanvas.width = cropWidth;
  selectedHumanCropCanvas.height = cropHeight;
  selectedHumanCropCtx.clearRect(0, 0, cropWidth, cropHeight);
  selectedHumanCropCtx.drawImage(
    videoPlayer,
    cropX, cropY, cropWidth, cropHeight,
    0, 0, cropWidth, cropHeight
  );

  return {
    canvas: selectedHumanCropCanvas,
    sourceBox: {
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight
    }
  };
}

function mapCropLandmarkToVideo(landmark, cropSourceBox) {
  if (!landmark || !cropSourceBox || !videoPlayer.videoWidth || !videoPlayer.videoHeight) {
    return landmark;
  }

  return {
    ...landmark,
    x: (cropSourceBox.x + (landmark.x * cropSourceBox.width)) / videoPlayer.videoWidth,
    y: (cropSourceBox.y + (landmark.y * cropSourceBox.height)) / videoPlayer.videoHeight
  };
}

function mapCropLandmarksToVideo(landmarks, cropSourceBox) {
  if (!Array.isArray(landmarks)) return [];
  return landmarks.map((landmark) => mapCropLandmarkToVideo(landmark, cropSourceBox));
}

window.mapCropLandmarkToVideo = mapCropLandmarkToVideo;
window.mapCropLandmarksToVideo = mapCropLandmarksToVideo;

function getPoseInputImage() {
  lastPoseCropSourceBox = null;
  window.lastPoseCropSourceBox = null;

  if (!humanSelectorEnabled) {
    return videoPlayer;
  }

  const crop = getSelectedHumanCrop();
  if (!crop) {
    return videoPlayer;
  }

  lastPoseCropSourceBox = crop.sourceBox;
  window.lastPoseCropSourceBox = lastPoseCropSourceBox;
  return crop.canvas;
}

if (humanSelectorEnabledInput) {
  humanSelectorEnabledInput.addEventListener('change', (event) => {
    humanSelectorEnabled = event.target.checked;
    if (!humanSelectorEnabled) {
      resetHumanSelectionState();
      if (humanOverlayCanvas) humanOverlayCanvas.style.display = 'none';
    } else {
      updateSelectedHumanLabel();
      resizeHumanOverlayToVideo();
    }
  });
}

if (autoSelectHumanInput) {
  autoSelectHumanInput.addEventListener('change', (event) => {
    autoSelectHuman = event.target.checked;
    if (autoSelectHuman && !selectedHumanBox && !selectedHumanLockedByUser && lastDetectedHumans.length) {
      selectedHumanBox = chooseHighestScoreHuman(lastDetectedHumans);
      selectedHumanId = selectedHumanBox ? selectedHumanBox.id : null;
      updateSelectedHumanLabel();
      drawHumanBoxes();
    }
  });
}

setupHumanOverlay();
updateSelectedHumanLabel();
setHumanSelectorControlsVisible(false);
initSoundMeter();
 

mediaFileInput.addEventListener('change', function(event) {
    const file = event.target.files[0];

    if (file) {
        // If microphone is active, turn it off
        if (isMicrophoneActive) flipMike(false);
        setMicCheckboxChecked(false);
          
        const fileURL = URL.createObjectURL(file);

        // Check if the file is a video type
        if (file.type.startsWith('video/')) {
            console.log("Loading video file:", file.name);
            setHumanSelectorControlsVisible(true);
            resetHumanSelectionState();
            
            // Display and configure the video player
            videoPlayer.src = fileURL;
            videoPlayer.style.display = 'block';
            audioPlayer.style.display = 'none'; // Hide audio player if visible

            // Ensure the video is ready before initializing audio context
            videoPlayer.onloadedmetadata = function() {
                console.log('Video metadata loaded'); // Log when video is loaded
                
                // Set flags first
                isVideo = true;
                flagLearned = 0;
                document.getElementById('checklearn').checked = true;
                
                // Make sure audio is stopped
                stopAudio();
                
                // Reset completely and initialize new audio context
                cleanupAudio(); 
                
                // Add small delay to ensure cleanup is complete
                setTimeout(() => {
                    initVideoAudio(videoPlayer); // Initialize audio context with video
                    document.getElementById("controlsBt").style.display="";
                    resizeHumanOverlayToVideo();
                }, 100);
            };
        } 
        // Check if the file is an audio type
        else if (file.type.startsWith('audio/')) {
            console.log("Loading audio file:", file.name);
            setHumanSelectorControlsVisible(false);
			
			let song = file.name;
			song = song.replace(".mp3" , "");
			song = song.replace(".ogg" , "");			
			song = song.replace(".wav" , "");	
		 			
		    document.getElementById("songname").innerHTML= song;
			
            
            // Display and configure the audio player
            audioPlayer.src = fileURL;
            videoPlayer.style.display = 'none'; // Hide video player if visible
            resetHumanSelectionState();
            clearHumanOverlay();
            if (humanOverlayCanvas) humanOverlayCanvas.style.display = 'none';

            // Set flags first
            isVideo = false;
            flagLearned = 1;        
            document.getElementById('checklearn').checked = false;
            
            // Make sure video is stopped
            stopVideo();
            
            // Reset completely
            cleanupAudio(); 
            
            // Add small delay to ensure cleanup is complete
            setTimeout(() => {
                initVideoAudio(audioPlayer); 
                document.getElementById("controlsBt").style.display="";
                
                // Start audio playback after a brief delay to ensure setup is complete
                setTimeout(() => {
                    startAudio();
                }, 100);
            }, 100);
        }
        else {
            console.log("Unsupported file type");
            // Optionally, display an error message to the user
        }
    }
});




function startVideo() {
  if (isMicrophoneActive) {
    flipMike(false);
  }
  setMicCheckboxChecked(false);

  if (!isVideo) {
    setHumanSelectorControlsVisible(false);
    startAudio();
    return;
  }

  setHumanSelectorControlsVisible(true);
  stopAudio();

  if (videoPlayer) {
    videoPlayer.play()
      .then(() => {
        isPlaying = 1;
        startRenderLoop();
      })
      .catch(err => console.error("Video play error:", err));
  }
}



function stopVideo() {
  if (!isVideo) {
    stopAudio();
    return;
  }

  if (videoPlayer) {
    videoPlayer.pause();
    videoPlayer.currentTime = 0;
  }

  isPlaying = 0;
  renderLoopActive = false;
  clearHumanOverlay();
}



function pauseVideo() {
    
    if(!isVideo){pauseAudio(); return;}
        
    if (videoPlayer) {
        videoPlayer.pause();  // Pauses the video
        isPlaying = 0;
       // console.log('Video paused');
    } else {
        console.error('Video element not found');
    }
	
	
	
}


function startAudio() {
  if (isMicrophoneActive) {
    flipMike(false);
  }
  setMicCheckboxChecked(false);

  isVideo = false;
  setHumanSelectorControlsVisible(false);

  if (audioPlayer) {
    try {
      // Rebuild WebAudio chain after microphone mode
      if (!analyzer || !gainNode || currentMediaElement !== audioPlayer) {
        cleanupAudio();

        setTimeout(() => {
          initVideoAudio(audioPlayer);

          audioPlayer.play()
            .then(() => {
              isPlaying = 1;
              startRenderLoop();
            })
            .catch(err => console.error("Audio play error:", err));
        }, 80);

        return;
      }

      audioPlayer.play()
        .then(() => {
          isPlaying = 1;
          startRenderLoop();
        })
        .catch(err => console.error("Audio play error:", err));

    } catch (err) {
      console.error("startAudio failed:", err);
    }
  } else {
    console.error("Audio element not found");
  }
}


function stopAudio() {
  if (audioPlayer) {
    audioPlayer.pause();
    audioPlayer.currentTime = 0;
    console.log("stop AUDIO");
  }

  isPlaying = 0;

  if (!isVideo) {
    renderLoopActive = false;
  }
}




function pauseAudio() {
    if (audioPlayer) {
        audioPlayer.pause();  // Pauses the audio
        isPlaying = 0;
        console.log('Audio paused');
    } else {
        console.error('Audio element not found');
    }
}

function changeVolume(val) {
    if (gainNode) {
        gainNode.gain.value = val;
    }
}

// Event listeners for media end
videoPlayer.addEventListener('ended', function() {
  //  console.log('Video has ended');
    isPlaying = 0;
});

audioPlayer.addEventListener('ended', function() {
   // console.log('Audio has ended');
    isPlaying = 0;
});

function flipMike(state) {
  if (state) {
    setMicCheckboxChecked(false);
    cleanupAudio();

    const mySession = audioSessionId;
    isMicrophoneActive = true;
    if (videoPlayer) videoPlayer.pause();
    isVideo = false;
    flagLearned = 1;

    pauseAudio();
    isPlaying = 1;
    setHumanSelectorControlsVisible(false);
    if (document.getElementById('checklearn')) document.getElementById('checklearn').checked = false;
    if (humanOverlayCanvas) humanOverlayCanvas.style.display = 'none';

    const context = initAudioContext();
    console.log("Microphone permission requested");
    console.log(`Microphone AudioContext state: ${context.state}`);

    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true
      }
    })
      .then(async stream => {
        if (mySession !== audioSessionId) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log("Microphone stream received");
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          console.log(`Microphone input device: ${audioTrack.label || 'unknown device'}`);
          if (typeof audioTrack.getSettings === 'function') {
            console.log("Microphone settings:", audioTrack.getSettings());
          }
        }
        microphoneStream = stream;
        setMicCheckboxChecked(true);
        await resumeAudioContext(context, 'Microphone AudioContext');

        if (mySession !== audioSessionId) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        source = context.createMediaStreamSource(stream);
        currentMediaElement = null;

        initAnalyzer(source);
        startRenderLoop();
        console.log("Microphone mode active");
      })
      .catch(err => {
        console.error('Error accessing microphone:', err);
        if (mySession === audioSessionId) {
          isMicrophoneActive = false;
          isPlaying = 0;
          setMicCheckboxChecked(false);
        }
      });

  } else {
    isMicrophoneActive = false;
    isPlaying = 0;
    setMicCheckboxChecked(false);

    if (microphoneStream) {
      microphoneStream.getTracks().forEach(track => track.stop());
      microphoneStream = null;
    }

    if (source && currentMediaElement === null) {
      try { source.disconnect(); } catch(e) {}
      source = null;
    }

    if (analyzer) {
      try { analyzer.disconnect(); } catch(e) {}
      analyzer = null;
    }

    if (gainNode) {
      try { gainNode.disconnect(); } catch(e) {}
      gainNode = null;
    }

    if (micAnalysisGainNode) {
      try { micAnalysisGainNode.disconnect(); } catch(e) {}
      micAnalysisGainNode = null;
    }

    analysisLoopActive = false;
    renderLoopActive = false;
    resizeHumanOverlayToVideo();
  }
}

let poseBusy = false;

function startRenderLoop() {
  if (renderLoopActive) return;
  renderLoopActive = true;

  async function loop() {
    if (!renderLoopActive) return;

    if (isVideo) {
      if (!videoPlayer.paused && !videoPlayer.ended) {
        updateHumanDetections(performance.now());

        if (flagLearned === 0 && !poseBusy) {
          poseBusy = true;

          try {
            // Pose keeps the existing pipeline; only the input image switches to the selected crop.
            const poseImage = getPoseInputImage();
            await pose.send({ image: poseImage });
          } catch (err) {
            console.error("pose.send error:", err);
          } finally {
            poseBusy = false;
          }
        }
      }
    } else if (humanOverlayCanvas && humanOverlayCanvas.style.display !== 'none') {
      humanOverlayCanvas.style.display = 'none';
      clearHumanOverlay();
    }

    visualize();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}


// Global settings for 3D view manipulation
let cameraAngleY = 0; // Initial camera angle around Y-axis in radians
let cameraAngleX = 0; // Initial camera angle around X-axis in radians
let zoom = 1700; // Zoom factor (controls how far the viewer is from the object)
const AVATAR_DRAW_SCALE = 0.48;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeHexColor(value, fallback) {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}

function normalizeAvatarThickness(value) {
  const numberValue = parseFloat(value);
  return Number.isFinite(numberValue) ? clamp(numberValue, 0.4, 2.4) : DEFAULT_VISUAL_SETTINGS.avatarThickness;
}

function normalizePercentSlider(value, fallback) {
  const numberValue = parseFloat(value);
  return Number.isFinite(numberValue) ? clamp(numberValue, 0, 100) : fallback;
}

function getMusicReactivityFactor() {
  return clamp((visualSettings.musicReactivity || 50) / 50, 0.25, 2);
}

function getMotionAmountFactor() {
  const value = normalizePercentSlider(visualSettings.motionAmount, DEFAULT_VISUAL_SETTINGS.motionAmount);
  return 0.25 + (value / 100) * 1.5;
}

function hexToRgb(hex) {
  const clean = normalizeHexColor(hex, DEFAULT_VISUAL_SETTINGS.avatarColor).slice(1);
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(value => {
    const safe = clamp(Math.round(value), 0, 255);
    return safe.toString(16).padStart(2, '0');
  }).join('');
}

function mixColor(hex, targetHex, amount) {
  const base = hexToRgb(hex);
  const target = hexToRgb(targetHex);
  return rgbToHex(
    base.r + (target.r - base.r) * amount,
    base.g + (target.g - base.g) * amount,
    base.b + (target.b - base.b) * amount
  );
}

function getAvatarPalette() {
  const base = normalizeHexColor(visualSettings.avatarColor, DEFAULT_VISUAL_SETTINGS.avatarColor);
  const style = visualSettings.avatarStyle || DEFAULT_VISUAL_SETTINGS.avatarStyle;

  if (style === 'neon') {
    return {
      torso: mixColor(base, '#00ff99', 0.28),
      limb: base,
      joint: '#ffffff',
      dark: '#061018',
      visor: '#00ffcc',
      accent: '#ff2f92',
      stroke: '#001a18'
    };
  }

  if (style === 'wire') {
    return {
      torso: mixColor(base, '#000000', 0.35),
      limb: mixColor(base, '#ffffff', 0.12),
      joint: '#ffcc33',
      dark: '#111111',
      visor: '#e8faff',
      accent: '#ffcc33',
      stroke: '#e8faff'
    };
  }

  return {
    torso: mixColor(base, '#000000', 0.28),
    limb: base,
    joint: mixColor(base, '#ffffff', 0.35),
    dark: '#1a2248',
    visor: '#00d4ff',
    accent: '#ff6b35',
    stroke: '#1a2248'
  };
}

function applyVisualSettings(settings) {
  visualSettings = Object.assign({}, DEFAULT_VISUAL_SETTINGS, settings || {});
  visualSettings.avatarStyle = ['robot', 'myHead', 'neon', 'wire', 'leSaint'].includes(visualSettings.avatarStyle)
    ? visualSettings.avatarStyle
    : DEFAULT_VISUAL_SETTINGS.avatarStyle;
  visualSettings.avatarColor = normalizeHexColor(visualSettings.avatarColor, DEFAULT_VISUAL_SETTINGS.avatarColor);
  visualSettings.avatarThickness = normalizeAvatarThickness(visualSettings.avatarThickness);
  visualSettings.musicReactivity = normalizePercentSlider(visualSettings.musicReactivity, DEFAULT_VISUAL_SETTINGS.musicReactivity);
  visualSettings.motionAmount = normalizePercentSlider(visualSettings.motionAmount, DEFAULT_VISUAL_SETTINGS.motionAmount);
  visualSettings.backgroundMode = ['none', 'solid', 'gradient'].includes(visualSettings.backgroundMode)
    ? visualSettings.backgroundMode
    : DEFAULT_VISUAL_SETTINGS.backgroundMode;
  visualSettings.backgroundColor = normalizeHexColor(visualSettings.backgroundColor, DEFAULT_VISUAL_SETTINGS.backgroundColor);

  if (avatarStyleSelect) avatarStyleSelect.value = visualSettings.avatarStyle;
  if (avatarColorInput) avatarColorInput.value = visualSettings.avatarColor;
  if (avatarThicknessSlider) avatarThicknessSlider.value = visualSettings.avatarThickness;
  if (musicReactivitySlider) musicReactivitySlider.value = visualSettings.musicReactivity;
  if (motionAmountSlider) motionAmountSlider.value = visualSettings.motionAmount;
  if (backgroundModeSelect) backgroundModeSelect.value = visualSettings.backgroundMode;
  if (backgroundColorInput) backgroundColorInput.value = visualSettings.backgroundColor;
  if (avatarHeadPictureControls) {
    avatarHeadPictureControls.style.display = visualSettings.avatarStyle === 'myHead' ? '' : 'none';
  }

  document.body.classList.toggle('dancing5-bg-gradient', visualSettings.backgroundMode === 'gradient');
  if (visualSettings.backgroundMode === 'solid') {
    document.body.style.backgroundColor = visualSettings.backgroundColor;
  } else {
    document.body.style.backgroundColor = '';
  }
}

function readVisualSettingsFromControls() {
  applyVisualSettings({
    avatarStyle: avatarStyleSelect ? avatarStyleSelect.value : visualSettings.avatarStyle,
    avatarColor: avatarColorInput ? avatarColorInput.value : visualSettings.avatarColor,
    avatarThickness: avatarThicknessSlider ? avatarThicknessSlider.value : visualSettings.avatarThickness,
    musicReactivity: musicReactivitySlider ? musicReactivitySlider.value : visualSettings.musicReactivity,
    motionAmount: motionAmountSlider ? motionAmountSlider.value : visualSettings.motionAmount,
    backgroundMode: backgroundModeSelect ? backgroundModeSelect.value : visualSettings.backgroundMode,
    backgroundColor: backgroundColorInput ? backgroundColorInput.value : visualSettings.backgroundColor
  });
  scheduleLastSessionSave();
}

if (avatarStyleSelect) avatarStyleSelect.addEventListener('change', readVisualSettingsFromControls);
if (avatarHeadPictureSelect) {
  avatarHeadPictureSelect.addEventListener('change', () => {
    if (avatarHeadPictureSelect.value === UPLOAD_HEAD_PICTURE_VALUE) {
      avatarHeadPictureSelect.value = selectedHeadPictureName;
      if (avatarHeadPictureInput) avatarHeadPictureInput.click();
      return;
    }
    setCustomHeadPicture(avatarHeadPictureSelect.value);
    scheduleLastSessionSave();
  });
}
if (avatarHeadPictureInput) {
  avatarHeadPictureInput.addEventListener('change', event => {
    const file = event.target.files && event.target.files[0];
    saveUploadedHeadPicture(file);
    scheduleLastSessionSave();
    avatarHeadPictureInput.value = '';
  });
}
if (avatarColorInput) avatarColorInput.addEventListener('input', readVisualSettingsFromControls);
if (avatarThicknessSlider) avatarThicknessSlider.addEventListener('input', readVisualSettingsFromControls);
if (musicReactivitySlider) musicReactivitySlider.addEventListener('input', readVisualSettingsFromControls);
if (motionAmountSlider) motionAmountSlider.addEventListener('input', readVisualSettingsFromControls);
if (backgroundModeSelect) backgroundModeSelect.addEventListener('change', readVisualSettingsFromControls);
if (backgroundColorInput) backgroundColorInput.addEventListener('input', readVisualSettingsFromControls);
initializeHeadPictureSelect();
applyVisualSettings(visualSettings);

function drawRobotBoy(poseLandmarks) {
  clearAvatarCanvas();

  const lm = poseLandmarks;
  if (!lm || lm.length < 13) return;

  // Remap local indexes
  const NOSE = 0,
        LS = 1, RS = 2,
        LE = 3, RE = 4,
        LW = 5, RW = 6,
        LH = 7, RH = 8,
        LK = 9, RK = 10,
        LA = 11, RA = 12;

  const cx = (lm[LS].x + lm[RS].x + lm[LH].x + lm[RH].x) / 4;
  const cy = (lm[LS].y + lm[RS].y + lm[LH].y + lm[RH].y) / 4;

  const scale = AVATAR_DRAW_SCALE;
  const perspective = zoom;
  const viewerDistance = 800;

  const W = canvasElement.clientWidth;
  const H = canvasElement.clientHeight;

  function project3D(x, y, z) {
    z = z / 2;

    const rotX = x * Math.cos(cameraAngleY) - z * Math.sin(cameraAngleY);
    const rotZ = z * Math.cos(cameraAngleY) + x * Math.sin(cameraAngleY);

    const rotY = y * Math.cos(cameraAngleX) - rotZ * Math.sin(cameraAngleX);
    const adjZ = rotZ * Math.cos(cameraAngleX) + y * Math.sin(cameraAngleX);

    const ps = perspective / (viewerDistance - adjZ);

    return {
      x: rotX * ps,
      y: rotY * ps
    };
  }

  function pt(idx) {
    const p = lm[idx];

    if (!p) {
      return { x: W / 2, y: H / 2 };
    }

    const proj = project3D(p.x - cx, p.y - cy, p.z);

    return {
      x: proj.x * W * scale + W / 2,
      y: proj.y * H * scale + H / 2
    };
  }

  function drawSegment(pa, pb, lmA, lmB, w, fill, stroke = "#1a2248", depthFactor = 0.2) {
    if (!pa || !pb || !lmA || !lmB) return;

    const dx = pb.x - pa.x;
    const dy = pb.y - pa.y;

    const len2d = Math.hypot(dx, dy);

    const dz = Math.min(
      Math.abs(lmA.z - lmB.z) * W * scale * depthFactor,
      w * 0.3
    );

    const len = Math.max(len2d, w * 0.6);
    const finalW = clamp((w + dz) * (visualSettings.avatarThickness || 1), 4, 120);

    const ang = len2d > 1 ? Math.atan2(dy, dx) : 0;
    const r = Math.min(finalW / 2, len / 2);

    canvasCtx.save();
    canvasCtx.translate((pa.x + pb.x) / 2, (pa.y + pb.y) / 2);
    canvasCtx.rotate(ang);

    canvasCtx.beginPath();
    canvasCtx.roundRect(-len / 2, -finalW / 2, len, finalW, r);

    canvasCtx.fillStyle = fill;
    canvasCtx.fill();

    canvasCtx.strokeStyle = stroke;
    canvasCtx.lineWidth = clamp(finalW * 0.08, 1.5, 8);
    canvasCtx.stroke();

    canvasCtx.restore();
  }

  function drawJoint(p, r, fill) {
    if (!p) return;

    r = clamp(r * (visualSettings.avatarThickness || 1), 5, 48);

    canvasCtx.beginPath();
    canvasCtx.arc(p.x, p.y, r, 0, Math.PI * 2);

    canvasCtx.fillStyle = fill;
    canvasCtx.fill();

    canvasCtx.strokeStyle = "#1a1a2e";
    canvasCtx.lineWidth = clamp(r * 0.16, 1.5, 8);
    canvasCtx.stroke();
  }

  function drawCustomHeadImage(x, y, w, h, skew) {
    if (!CUSTOM_HEAD_IMAGE.complete || !CUSTOM_HEAD_IMAGE.naturalWidth) return false;

    const displayW = w * 1.33;
    const displayH = h * 1.33;
    const displayX = x - (displayW - w) / 2;
    const displayY = y - (displayH - h) / 2;
    const imgRatio = CUSTOM_HEAD_IMAGE.naturalWidth / CUSTOM_HEAD_IMAGE.naturalHeight;
    const boxRatio = displayW / displayH;
    let sourceX = 0;
    let sourceY = 0;
    let sourceW = CUSTOM_HEAD_IMAGE.naturalWidth;
    let sourceH = CUSTOM_HEAD_IMAGE.naturalHeight;

    if (imgRatio > boxRatio) {
      sourceW = sourceH * boxRatio;
      sourceX = (CUSTOM_HEAD_IMAGE.naturalWidth - sourceW) / 2;
    } else {
      sourceH = sourceW / boxRatio;
      sourceY = (CUSTOM_HEAD_IMAGE.naturalHeight - sourceH) / 2;
    }

    canvasCtx.save();
    canvasCtx.translate(displayX + skew, displayY);
    canvasCtx.transform(1, 0, (-2 * skew) / displayH, 1, 0, 0);
    canvasCtx.beginPath();
    canvasCtx.roundRect(0, 0, displayW, displayH, displayW * 0.12);
    canvasCtx.clip();
    canvasCtx.drawImage(CUSTOM_HEAD_IMAGE, sourceX, sourceY, sourceW, sourceH, 0, 0, displayW, displayH);
    canvasCtx.restore();

    return true;
  }

  const palette = getAvatarPalette();
  const TORSO = palette.torso;
  const LIMB = palette.limb;
  const JOINT = palette.joint;
  const DARK = palette.dark;
  const VISOR = palette.visor;
  const ACCENT = palette.accent;

  const p11 = pt(LS);
  const p12 = pt(RS);
  const p13 = pt(LE);
  const p14 = pt(RE);
  const p15 = pt(LW);
  const p16 = pt(RW);
  const p23 = pt(LH);
  const p24 = pt(RH);
  const p25 = pt(LK);
  const p26 = pt(RK);
  const p27 = pt(LA);
  const p28 = pt(RA);

  const rawShoulderW = Math.hypot(
    lm[LS].x - lm[RS].x,
    lm[LS].y - lm[RS].y
  );

  // Main clamp: prevents the robot from becoming too thin.
  let shoulderW = rawShoulderW * W * scale * 0.75;
  shoulderW = clamp(shoulderW, 45, 180);

  // Robot part sizes
  const torsoW = clamp(shoulderW * 1.35, 55, 220);

  const armW = clamp(shoulderW * 0.28, 12, 42);
  const foreW = clamp(shoulderW * 0.24, 11, 36);

  const legW = clamp(shoulderW * 0.34, 14, 48);
  const shinW = clamp(shoulderW * 0.30, 13, 42);

  const jointR = clamp(shoulderW * 0.18, 8, 28);

  const handW = clamp(shoulderW * 0.48 * (visualSettings.avatarThickness || 1), 22, 100);
  const handH = clamp(shoulderW * 0.24 * (visualSettings.avatarThickness || 1), 13, 58);

  const footW = clamp(shoulderW * 0.70 * (visualSettings.avatarThickness || 1), 30, 135);
  const footH = clamp(shoulderW * 0.26 * (visualSettings.avatarThickness || 1), 14, 62);

  const pSh = {
    x: (p11.x + p12.x) / 2,
    y: (p11.y + p12.y) / 2
  };

  const pHip = {
    x: (p23.x + p24.x) / 2,
    y: (p23.y + p24.y) / 2
  };

  // Torso
  drawSegment(pSh, pHip, lm[LS], lm[LH], torsoW, TORSO, DARK, 0);

  // Shoulders
  drawSegment(p11, p12, lm[LS], lm[RS], torsoW * 0.55, TORSO, DARK, 0);

  // Arms
  drawSegment(p11, p13, lm[LS], lm[LE], armW, LIMB, DARK, 0.15);
  drawSegment(p12, p14, lm[RS], lm[RE], armW, LIMB, DARK, 0.15);

  drawSegment(p13, p15, lm[LE], lm[LW], foreW, LIMB, DARK, 0.15);
  drawSegment(p14, p16, lm[RE], lm[RW], foreW, LIMB, DARK, 0.15);

  drawJoint(p13, jointR, JOINT);
  drawJoint(p14, jointR, JOINT);

  // Hands
  canvasCtx.beginPath();
  canvasCtx.roundRect(
    p15.x - handW * 0.5,
    p15.y - handH * 0.5,
    handW,
    handH,
    handH * 0.3
  );
  canvasCtx.fillStyle = LIMB;
  canvasCtx.fill();
  canvasCtx.strokeStyle = DARK;
  canvasCtx.lineWidth = clamp(1.5 * (visualSettings.avatarThickness || 1), 1.5, 6);
  canvasCtx.stroke();

  canvasCtx.beginPath();
  canvasCtx.roundRect(
    p16.x - handW * 0.5,
    p16.y - handH * 0.5,
    handW,
    handH,
    handH * 0.3
  );
  canvasCtx.fillStyle = LIMB;
  canvasCtx.fill();
  canvasCtx.strokeStyle = DARK;
  canvasCtx.lineWidth = clamp(1.5 * (visualSettings.avatarThickness || 1), 1.5, 6);
  canvasCtx.stroke();

  // Hips
  drawSegment(p23, p24, lm[LH], lm[RH], torsoW * 0.6, TORSO, DARK, 0);

  // Legs
  drawSegment(p23, p25, lm[LH], lm[LK], legW, LIMB, DARK, 0.12);
  drawSegment(p24, p26, lm[RH], lm[RK], legW, LIMB, DARK, 0.12);

  drawSegment(p25, p27, lm[LK], lm[LA], shinW, LIMB, DARK, 0.12);
  drawSegment(p26, p28, lm[RK], lm[RA], shinW, LIMB, DARK, 0.12);

  drawJoint(p25, jointR, JOINT);
  drawJoint(p26, jointR, JOINT);

  // Feet
  canvasCtx.beginPath();
  canvasCtx.roundRect(
    p27.x - footW * 0.25,
    p27.y - footH * 0.5,
    footW,
    footH,
    footH * 0.3
  );
  canvasCtx.fillStyle = LIMB;
  canvasCtx.fill();
  canvasCtx.strokeStyle = DARK;
  canvasCtx.lineWidth = clamp(1.5 * (visualSettings.avatarThickness || 1), 1.5, 6);
  canvasCtx.stroke();

  canvasCtx.beginPath();
  canvasCtx.roundRect(
    p28.x - footW * 0.75,
    p28.y - footH * 0.5,
    footW,
    footH,
    footH * 0.3
  );
  canvasCtx.fillStyle = LIMB;
  canvasCtx.fill();
  canvasCtx.strokeStyle = DARK;
  canvasCtx.lineWidth = clamp(1.5 * (visualSettings.avatarThickness || 1), 1.5, 6);
  canvasCtx.stroke();



function drawSkewedRoundBox(x, y, w, h, skew, radius, fill, stroke, lineWidth) {
  const topLeft = { x: x + skew, y: y };
  const topRight = { x: x + w + skew, y: y };
  const bottomRight = { x: x + w - skew, y: y + h };
  const bottomLeft = { x: x - skew, y: y + h };

  canvasCtx.beginPath();

  canvasCtx.moveTo(topLeft.x + radius, topLeft.y);
  canvasCtx.lineTo(topRight.x - radius, topRight.y);
  canvasCtx.quadraticCurveTo(topRight.x, topRight.y, topRight.x, topRight.y + radius);

  canvasCtx.lineTo(bottomRight.x, bottomRight.y - radius);
  canvasCtx.quadraticCurveTo(bottomRight.x, bottomRight.y, bottomRight.x - radius, bottomRight.y);

  canvasCtx.lineTo(bottomLeft.x + radius, bottomLeft.y);
  canvasCtx.quadraticCurveTo(bottomLeft.x, bottomLeft.y, bottomLeft.x, bottomLeft.y - radius);

  canvasCtx.lineTo(topLeft.x, topLeft.y + radius);
  canvasCtx.quadraticCurveTo(topLeft.x, topLeft.y, topLeft.x + radius, topLeft.y);

  canvasCtx.closePath();

  canvasCtx.fillStyle = fill;
  canvasCtx.fill();

  canvasCtx.strokeStyle = stroke;
  canvasCtx.lineWidth = lineWidth;
  canvasCtx.stroke();
}






  // ---- ROBOT HEAD ----
  const nose = lm[NOSE];
  if (!nose) return;

  const nProj = project3D(nose.x - cx, nose.y - cy, nose.z / 4);

  const nX = nProj.x * W * scale + W / 2;
  const nY = nProj.y * H * scale + H / 2;

  const hW = clamp(shoulderW * 1.35, 55, 210);
  const hH = clamp(hW * 1.1, 60, 230);

  const hX = nX - hW / 2;
  const hY = nY - hH * 0.62;

  // Head box
// Estimate head/body rotation from shoulder depth.
// If one shoulder is more forward/backward, skew the head.
const shoulderDepth = lm[LS].z - lm[RS].z;

// Clamp so it stays stylish, not crazy.
const headSkew = clamp(shoulderDepth * hW * 0.85, -hW * 0.22, hW * 0.22);

const faceSkew = headSkew * 0.55;

  if (visualSettings.avatarStyle === 'myHead' && drawCustomHeadImage(hX, hY, hW, hH, headSkew)) {
    return;
  }

	// Head box with fake 3D rotation
	drawSkewedRoundBox(
	  hX,
	  hY,
	  hW,
	  hH,
	  headSkew,
	  hW * 0.12,
	  TORSO,
	  DARK,
	  clamp(hW * 0.035, 2, 6)
	);
  // Ears / sensors
  [
    [hX - hW * 0.18, hY + hH * 0.25],
    [hX + hW * 1.1, hY + hH * 0.25]
  ].forEach(([ex, ey]) => {
    canvasCtx.beginPath();
    canvasCtx.roundRect(
      ex,
      ey,
      hW * 0.08,
      hH * 0.28,
      clamp(hW * 0.03, 3, 8)
    );

    canvasCtx.fillStyle = DARK;
    canvasCtx.fill();

    canvasCtx.strokeStyle = JOINT;
    canvasCtx.lineWidth = clamp(hW * 0.015, 1, 3);
    canvasCtx.stroke();
  });

  // Visor
  canvasCtx.beginPath();
	drawSkewedRoundBox(
	  hX + hW * 0.1 + faceSkew,
	  hY + hH * 0.22,
	  hW * 0.8,
	  hH * 0.28,
	  headSkew * 0.25,
	  clamp(hW * 0.04, 4, 12),
	  "#001a2e",
	  VISOR,
	  clamp(hW * 0.018, 1.5, 4)
	);

  canvasCtx.fillStyle = "#001a2e";
  canvasCtx.fill();

  canvasCtx.strokeStyle = VISOR;
  canvasCtx.lineWidth = clamp(hW * 0.018, 1.5, 4);
  canvasCtx.stroke();

  // Visor reflection
  canvasCtx.beginPath();
  canvasCtx.roundRect(
    hX + hW * 0.12,
    hY + hH * 0.24,
    hW * 0.76,
    hH * 0.24,
    clamp(hW * 0.03, 3, 10)
  );

  const vg = canvasCtx.createLinearGradient(hX, 0, hX + hW, 0);
  vg.addColorStop(0, "rgba(0,212,255,0.1)");
  vg.addColorStop(0.5, "rgba(0,212,255,0.55)");
  vg.addColorStop(1, "rgba(0,212,255,0.1)");

  canvasCtx.fillStyle = vg;
  canvasCtx.fill();

  // LED eyes
  const eyeY = hY + hH * 0.33;
  const eyeR = clamp(hW * 0.07, 4, 16);

  [-0.25, 0.25].forEach(ox => {
    canvasCtx.beginPath();
    canvasCtx.arc(nX + ox * hW + faceSkew, eyeY, eyeR, 0, Math.PI * 2);

    canvasCtx.fillStyle = VISOR;
    canvasCtx.shadowColor = VISOR;
    canvasCtx.shadowBlur = clamp(hW * 0.08, 6, 18);
    canvasCtx.fill();

    canvasCtx.shadowBlur = 0;
  });

  // Mouth / grille
  canvasCtx.beginPath();
  canvasCtx.roundRect(
   hX + hW * 0.25 + faceSkew,
    hY + hH * 0.62,
    hW * 0.5,
    hH * 0.06,
    clamp(hW * 0.025, 3, 8)
  );

  canvasCtx.fillStyle = "#334";
  canvasCtx.fill();

  canvasCtx.strokeStyle = "#556";
  canvasCtx.lineWidth = 1;
  canvasCtx.stroke();

  for (let i = 0; i < 5; i++) {
    canvasCtx.beginPath();

    canvasCtx.roundRect(
      hX + hW * 0.27 + i * hW * 0.09,
      hY + hH * 0.63,
      hW * 0.05,
      hH * 0.04,
      1
    );

    canvasCtx.fillStyle = i === 2 ? ACCENT : "#556";
    canvasCtx.fill();
  }

  // Antenna
	const antennaX = nX + headSkew * 0.4;

	canvasCtx.beginPath();
	canvasCtx.moveTo(antennaX, hY);
	canvasCtx.lineTo(antennaX + headSkew * 0.25, hY - hH * 0.22);
	canvasCtx.strokeStyle = "#556";
	canvasCtx.lineWidth = clamp(hW * 0.02, 2, 5);
	canvasCtx.stroke();

	canvasCtx.beginPath();
	canvasCtx.arc(
	  antennaX + headSkew * 0.25,
	  hY - hH * 0.25,
	  clamp(hW * 0.04, 4, 12),
	  0,
	  Math.PI * 2
	);

  canvasCtx.fillStyle = ACCENT;
  canvasCtx.shadowColor = ACCENT;
  canvasCtx.shadowBlur = clamp(hW * 0.08, 6, 18);
  canvasCtx.fill();

  canvasCtx.shadowBlur = 0;

  // Chin / plate
  canvasCtx.beginPath();
  canvasCtx.roundRect(
    hX + hW * 0.3 + faceSkew,
    hY + hH * 0.88,
    hW * 0.4,
    hH * 0.1,
    clamp(hW * 0.025, 3, 8)
  );

  canvasCtx.fillStyle = DARK;
  canvasCtx.fill();

  canvasCtx.strokeStyle = JOINT;
  canvasCtx.lineWidth = 1;
  canvasCtx.stroke();
}
 
function drawBoy(dtx) {
  if (visualSettings.avatarStyle !== "leSaint") {
    drawRobotBoy(dtx);
    return;
  }

	
     clearAvatarCanvas();
    const scale = AVATAR_DRAW_SCALE;
    const perspective = zoom; // Use zoom as the perspective depth factor
    const viewerDistance = 800; // Simulate distance of the viewer from the projection plane
    const W = canvasElement.clientWidth;
    const H = canvasElement.clientHeight;

	
    canvasCtx.strokeStyle = visualSettings.avatarColor;
	//'rgba(200,100,10,1)';
	
	var thick = (zoom / 270) * (visualSettings.avatarThickness || 1);
	
	if (thick < 1) thick = 1;
     canvasCtx.lineWidth = thick;
	
	if (thick < 1)thick = 1;
    canvasCtx.lineWidth = thick;

    // Function to apply 3D projection with current rotation and zoom
    function project3D(x, y, z) {
        // Divide Z value by 2 for less influence in the AI model
        z = z / 2;

        // Apply camera rotation around Y axis (as if we are moving the camera)
        const rotatedX = x * Math.cos(cameraAngleY) - z * Math.sin(cameraAngleY);
        const rotatedZ = z * Math.cos(cameraAngleY) + x * Math.sin(cameraAngleY);

        // Apply camera rotation around X axis (as if we are moving the camera)
        const rotatedY = y * Math.cos(cameraAngleX) - rotatedZ * Math.sin(cameraAngleX);
        const adjustedZ = rotatedZ * Math.cos(cameraAngleX) + y * Math.sin(cameraAngleX);

        // Apply perspective projection
        const projectedScale = perspective / (viewerDistance - adjustedZ);
        const projectedX = rotatedX * projectedScale;
        const projectedY = rotatedY * projectedScale;

        return { x: projectedX, y: projectedY };
    }

    function drawPose(poseLandmarks) {
        if (!poseLandmarks  || poseLandmarks == 0) {
         //   console.warn('No pose landmarks to draw');
            return;
        }

        const connections = [
            [1, 2], [1, 3], [3, 5],
            [2, 4], [4, 6],
            [1, 7], [2, 8], [7, 8],
            [7, 9], [9, 11],
            [8, 10], [10, 12]
        ];

        // Get the center position to adjust the model to the middle of the canvas
        const centerX = (poseLandmarks[1].x + poseLandmarks[2].x + poseLandmarks[7].x + poseLandmarks[8].x) / 4;
        const centerY = (poseLandmarks[1].y + poseLandmarks[2].y + poseLandmarks[7].y + poseLandmarks[8].y) / 4;
        const canvasCenterX = W / 2;
        const canvasCenterY = H / 2;

        connections.forEach(([startIdx, endIdx]) => {
            const start = poseLandmarks[startIdx];
            const end = poseLandmarks[endIdx];
            if (start && end) {
                const startProj = project3D(start.x - centerX, start.y - centerY, start.z);
                const endProj = project3D(end.x - centerX, end.y - centerY, end.z);

                const startX = startProj.x * W * scale + canvasCenterX;
                const startY = startProj.y * H * scale + canvasCenterY;
                const endX = endProj.x * W * scale + canvasCenterX;
                const endY = endProj.y * H * scale + canvasCenterY;

                canvasCtx.beginPath();
                canvasCtx.moveTo(startX, startY);
                canvasCtx.lineTo(endX, endY);
                canvasCtx.stroke();
            }
        });

        // Draw head with corrected position and reduced size
        const nose = poseLandmarks[0]; // Using the nose as an example
        if (nose) {
            const noseProj = project3D(nose.x - centerX, nose.y - centerY, nose.z/4 );
            const noseX = noseProj.x * W * scale + canvasCenterX;
            const noseY = noseProj.y * H * scale + canvasCenterY;

            // Reduced head size to make it proportional
            const headDiameter = 10 * (perspective / (viewerDistance - nose.z));
            canvasCtx.beginPath();
            canvasCtx.arc(noseX, noseY, headDiameter / 2, 0, 2 * Math.PI);
            canvasCtx.fillStyle = visualSettings.avatarColor;
            canvasCtx.stroke();
        }
    }
	
 
 
		if (flagLearned == 0) {
		  drawPose(allPos);
		} else {
		  drawPose(dtx);
		}

   
    // requestAnimationFrame(() => drawBoy(dtx));
}

// Update rotation around Y-axis from slider input (moving the camera around the subject)
function updateRotationY(value) {
    cameraAngleY = parseFloat(value);
    scheduleLastSessionSave();
}

// Update rotation around X-axis from slider input (moving the camera around the subject)
function updateRotationX(value) {
    cameraAngleX = parseFloat(value);
    scheduleLastSessionSave();
}

// Update zoom level from slider input
function updateZoom(value) {
    zoom = parseFloat(value);
    scheduleLastSessionSave();
}



let lastBrainPos = [];
let nextBrainPos = [];
let nowBeat = 0;
let spacer = 0;

function applyMotionAmountToPose(poseLandmarks) {
  const factor = getMotionAmountFactor();
  if (!poseLandmarks || !poseLandmarks.length || Math.abs(factor - 1) < 0.001) {
    return poseLandmarks;
  }

  const center = poseLandmarks.reduce((acc, point) => ({
    x: acc.x + point.x,
    y: acc.y + point.y,
    z: acc.z + point.z
  }), { x: 0, y: 0, z: 0 });

  center.x /= poseLandmarks.length;
  center.y /= poseLandmarks.length;
  center.z /= poseLandmarks.length;

  return poseLandmarks.map(point => ({
    x: center.x + (point.x - center.x) * factor,
    y: center.y + (point.y - center.y) * factor,
    z: center.z + (point.z - center.z) * factor
  }));
}


function visualize() 
{
  // MODE LEARN / VIDEO REAL BODY
  // Draw MediaPipe body directly, even if there is no audio data yet.
  if (flagLearned == 0) {
    if (allPos && allPos.length > 0) {
      drawBoy(allPos);
    }
    return;
  }

  // MODE AI / MODEL
  // Here we need audio FFT data.
  if (!newDt) return;

  if (flagLearned == 1 && newDt)
  {
    if (!network) return;
    if (network.weights.length == 0) {
      alert("Model not trained ^^");
      return;
    }

    spacer++;

    if (beatFlag == 1)
    {
      beatFlag = 0; 
      nowBeat = performance.now();
      lastBrainPos = nextBrainPos;

      let res = network.run(newDt);
      let brainPos = [];

      for (let i = 0; i < res.length; i += 3) 
      {
        brainPos.push({
          x: (res[i] * 2) - 1,
          y: res[i + 1] * 3,
          z: (res[i + 2] * 10) - 5 
        });
      }

      nextBrainPos = applyMotionAmountToPose(brainPos);			
    }
    else if (spacer > 5)
    {
      spacer = 0;

      if (lastBeat == 0) lastBeat = 1;

      let done = performance.now() - nowBeat;
      done = Math.min(done, lastBeat);

      let brainPos = [];	

      if (lastBrainPos.length && nextBrainPos.length)
      {	
        let t = done / lastBeat; 		

        for (let i = 0; i < nextBrainPos.length; i++) {
          brainPos.push({
            x: lastBrainPos[i].x * (1 - t) + nextBrainPos[i].x * t,
            y: lastBrainPos[i].y * (1 - t) + nextBrainPos[i].y * t,
            z: lastBrainPos[i].z * (1 - t) + nextBrainPos[i].z * t
          });
        }		

        drawBoy(brainPos);				
      }	
    }
  }
}

// DOM elements for sliders
const iterationsSlider = document.getElementById('iterations-slider');
  const iterationsValue = document.getElementById('iterations-value');
 const errorThreshSlider = document.getElementById('error-thresh-slider');
  const errorThreshValue = document.getElementById('error-thresh-value');

 
iterationsSlider.addEventListener('input', () => {
  iterationsValue.textContent = iterationsSlider.value;
  scheduleLastSessionSave();
});

if (learningRateInput) learningRateInput.addEventListener('input', scheduleLastSessionSave);
if (errorThreshSlider) errorThreshSlider.addEventListener('input', scheduleLastSessionSave);

 

// Event listener for the "Train Model" button
trainModelBtn.addEventListener('click', () => {
    learn();
	
 
});


let freshModel = null;

function createNewModel() {
    // Prompt the user for the new model name
    const modelName = prompt('Enter name for the new model:');
    if (!modelName) {
        alert('Model creation canceled.');
        return; // Exit if the user cancels the prompt or enters an empty name
    }

    // Retrieve the selected activation function
    const validationSelect = document.getElementById('validation-select');
    let selectedValidation = 'sigmoid'; // Default activation
    if (validationSelect && validationSelect.value) {
        selectedValidation = validationSelect.value;
    }

    console.log(`Selected Activation Function: ${selectedValidation}`);

    // Initialize the new neural network model
    try {
        network = new brain.NeuralNetwork({
            gpu: true,
            hiddenLayers: hiddenLayers, // Ensure hiddenLayers is defined elsewhere
            activation: selectedValidation
        });
        console.log(`Neural network "${modelName}" created successfully.`);
    } catch (error) {
        console.error('Error creating neural network:', error);
        alert('Failed to create the neural network model.');
        return;
    }

    // Update the model-select element with the new model
    const modelSelect = document.getElementById('model-select');
    const option = document.createElement('option');
    option.value = modelName;
    option.textContent = getModelDisplayName(modelName);
    modelSelect.appendChild(option);

    // Select the new model in the dropdown
    modelSelect.value = modelName;
	
	currentModelName = modelName;

    // Dispatch the change event
    // const event = new Event('change');
    // modelSelect.dispatchEvent(event);
}



function checkLearn(val)
{
	
	if(val == true)flagLearned = 0;
	else flagLearned = 1;
	
}


// Updated learn function
async function learn(tt) {
  stopVideo();
    
	if(trainingData.length < 5){ alert("No datas for traininig model"); return;}
	
  // console.log(network.trainOpts);
 
  const learningRate = parseFloat(learningRateInput.value);
  const iterations = parseInt(iterationsSlider.value, 10);
  const errorThresh = parseFloat(errorThreshSlider.value);

    console.log( currentModelName  );
	 console.log( learningRate,iterations,errorThresh );

  // Train the model using the current settings
  const trainingResult = network.train(trainingData, {
    iterations: iterations,
    errorThresh: errorThresh,
    learningRate: learningRate,
	activation:validation,
    log: true,
    logPeriod: 100,
	callback: (stats) => {
		console.log(`Iteration: ${stats.iterations}, Error: ${stats.error}`);
		document.getElementById('monerror').innerText = stats.error.toFixed(8)},
    callbackPeriod: 10,
    timeout:  timeLearn * 1000
  });

  // Update after training
  const trainedModel = network.toJSON();
  const modelJsonString = JSON.stringify(trainedModel);
  // console.log(modelJsonString);
  console.log(trainingResult);

  flagLearned = 1;
  document.getElementById('checklearn').checked = false;
}



   // Initialize IndexedDB/////////////////////////////////
let db;
let resolveDbReady;
let rejectDbReady;
const dbReady = new Promise((resolve, reject) => {
	resolveDbReady = resolve;
	rejectDbReady = reject;
});
const request = indexedDB.open('LocalDB', 2);

request.onerror = function(event) {
	console.error('Database error:', event.target.errorCode);
	if (rejectDbReady) rejectDbReady(event.target.error || new Error(event.target.errorCode));
};

request.onupgradeneeded = function(event) {
	db = event.target.result;
	if (!db.objectStoreNames.contains('datas')) {
		db.createObjectStore('datas', { keyPath: 'id', autoIncrement: true });
	}
	if (!db.objectStoreNames.contains('models')) {
		db.createObjectStore('models', { keyPath: 'name' });
	}
	if (!db.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
		db.createObjectStore(SETTINGS_STORE_NAME, { keyPath: 'name' });
	}
};

request.onsuccess = function(event) {
	db = event.target.result;
	if (resolveDbReady) resolveDbReady(db);
	populateDatas();
	populateModels();
};

    


function populateDatas() {
	const selecto = document.getElementById('train-select');
	selecto.innerHTML = '';

	const transaction = db.transaction(['datas'], 'readonly');
	const objectStore = transaction.objectStore('datas');
	const request = objectStore.getAll();

	request.onsuccess = function(event) {
		const datas = event.target.result;
		datas.forEach(data => {
			const option = document.createElement('option');
			option.value = data.id;
			option.textContent = data.name;
			selecto.appendChild(option);
		});

		//document.getElementById('moncount').textContent = datas.length.toString().padStart(3, '0');
	};

	request.onerror = function(event) {
		console.error('Error fetching datas:', event.target.errorCode);
	};
}


async function populateModels() {
	const selecto = document.getElementById('model-select');
	selecto.innerHTML = '';

	try {
		await ensureStartupDemoModel();
		const models = await getAllModelRecords();
		selecto.innerHTML = '';

		models.forEach(model => {
			const option = document.createElement('option');
			option.value = model.name;
			option.textContent = getModelDisplayName(model.name);
			selecto.appendChild(option);
		});

		if (currentModelName && Array.from(selecto.options).some(option => option.value === currentModelName)) {
			selecto.value = currentModelName;
			return;
		}

		const lastSession = await readSettingsRecord(LAST_SESSION_SETTINGS_NAME);
		const lastSessionModelName = lastSession && lastSession.modelName ? lastSession.modelName : null;
		const lastModelName = lastSessionModelName || getLastModelName();
		const lastModelExists = lastModelName && models.some(model => model.name === lastModelName);

		if (lastModelExists) {
			selecto.value = lastModelName;
			await loadModel(lastModelName);
			return;
		}

		if (lastSession && lastSession.settings) {
			applySettingsSnapshot(lastSession.settings);
		}

		const defaultDemoExists = models.some(model => model.name === DEFAULT_DEMO_MODEL_NAME);
		if (defaultDemoExists) {
			selecto.value = DEFAULT_DEMO_MODEL_NAME;
			await loadModel(DEFAULT_DEMO_MODEL_NAME);
			return;
		}

		const defaultModel = getMostRecentModelRecord(models) || models[0];
		if (defaultModel && defaultModel.name) {
			selecto.value = defaultModel.name;
			await loadModel(defaultModel.name);
		}
	} catch (error) {
		console.error('Error fetching models:', error);
	} finally {
		sessionAutosaveEnabled = true;
	}
}

function getAllModelRecords() {
	return new Promise((resolve, reject) => {
		if (!db) {
			resolve([]);
			return;
		}

		const transaction = db.transaction(['models'], 'readonly');
		const objectStore = transaction.objectStore('models');
		const request = objectStore.getAll();

		request.onsuccess = event => resolve(event.target.result || []);
		request.onerror = event => reject(event.target.error);
	});
}

function getLastModelName() {
	try {
		return localStorage.getItem(LAST_MODEL_STORAGE_KEY);
	} catch (error) {
		console.warn('Could not read last model preference:', error);
		return null;
	}
}

function rememberLastModelName(modelName) {
	if (!modelName) return;

	try {
		localStorage.setItem(LAST_MODEL_STORAGE_KEY, modelName);
		console.log(`Dancing5 remembered last model: ${modelName}`);
	} catch (error) {
		console.warn('Could not save last model preference:', error);
	}
}

function getMostRecentModelRecord(models) {
	if (!Array.isArray(models) || !models.length) return null;

	return models.slice().sort((a, b) => {
		const aTime = Date.parse(a.importedAt || a.createdAt || 0) || 0;
		const bTime = Date.parse(b.importedAt || b.createdAt || 0) || 0;
		return bTime - aTime;
	})[0];
}

async function getExampleModelFiles() {
	try {
		const response = await fetch(EXAMPLE_MODEL_MANIFEST_PATH, { cache: 'no-store' });
		if (!response.ok) throw new Error(`${EXAMPLE_MODEL_MANIFEST_PATH} was not found.`);

		const files = await response.json();
		if (!Array.isArray(files)) throw new Error(`${EXAMPLE_MODEL_MANIFEST_PATH} must be a JSON array.`);

		return files
			.map(fileName => String(fileName || '').trim())
			.filter(fileName => fileName && fileName.toLowerCase().endsWith('.json'));
	} catch (error) {
		console.warn('Dancing5 example model manifest unavailable; using fallback list.', error);
		return EXAMPLE_MODEL_FILES;
	}
}

async function ensureStartupDemoModel() {
	if (startupDemoLoadStarted) return;
	startupDemoLoadStarted = true;

	try {
		const exampleModelFiles = await getExampleModelFiles();
		const existingModels = await getAllModelRecords();
		const existingNames = new Set(existingModels.map(model => model.name));
		for (const fileName of exampleModelFiles) {
			if (existingNames.has(fileName)) continue;

			await importDemoModelFromPath(`Startup example ${getModelDisplayName(fileName)}`, {
				activate: false,
				applySettings: false,
				skipPopulate: true,
				modelPath: `examples/${fileName}`,
				modelNameOverride: fileName
			});
			existingNames.add(fileName);
		}
	} catch (error) {
		console.error('Dancing5 startup demo ensure failed.', error);
		setModelJsonStatus(`Startup demo failed: ${error.message || error}`, true);
	} finally {
		startupDemoLoadStarted = false;
	}
}


document.getElementById('model-select').addEventListener('change', function(event) {
    const selectedModelName = event.target.value;

    const previousModelName = currentModelName;
 
    currentModelName = selectedModelName;

 
    // if (previousModelName  == currentModelNam  ) {
        // alert(`Model "${previousModelName}" is already loaded.`);
		// return;
    // }

        loadModel(selectedModelName).catch(error => console.error('Error loading selected model:', error));
    
});

 
function loadModel(modelName) {
	return new Promise((resolve, reject) => {
		const transaction = db.transaction(['models'], 'readonly');
		const objectStore = transaction.objectStore('models');
		const request = objectStore.get(modelName);

		request.onsuccess = async function(event) {
			try {
				const model = event.target.result;
				if (!model) {
					console.error(`Model ${modelName} not found.`);
					resolve(null);
					return;
				}

				network = new brain.NeuralNetwork();
				network.fromJSON(model.data);
				currentModelName = modelName;
				rememberLastModelName(modelName);

				console.log(network);

				let idx = validations.indexOf(network.trainOpts.activation);
				document.getElementById("validation-select").selectedIndex = idx;

				let arrHidden = network.sizes;
				let len = arrHidden.length;

				if(len > 2)document.getElementById("hidden-layer-1").value = arrHidden[1];
				else document.getElementById("hidden-layer-1").value = 0;

				if(len > 3)document.getElementById("hidden-layer-2").value = arrHidden[2];
				else document.getElementById("hidden-layer-2").value = 0;

				if(len > 4)document.getElementById("hidden-layer-3").value = arrHidden[3];
				else document.getElementById("hidden-layer-3").value = 0;

				if(len > 5)document.getElementById("hidden-layer-4").value = arrHidden[4];
				else document.getElementById("hidden-layer-4").value = 0;

				await applyModelSettings(modelName);
				await saveLastSession(modelName);
				resolve(model);
			} catch (error) {
				reject(error);
			}
		};

		request.onerror = function(event) {
			console.error('Error loading model:', event.target.errorCode);
			reject(event.target.error || new Error(event.target.errorCode));
		};
	});
}

let dataName = null;
 
 
 
document.getElementById('create-train-btn').addEventListener('click', function() {
	  dataName = prompt('Enter name for the new train dataset:');
	  
	  trainingData = [];

});

function setModelJsonStatus(message, isError) {
  if (modelJsonStatus) {
    modelJsonStatus.textContent = message || '';
    modelJsonStatus.style.color = isError ? '#ff4400' : '#00cc66';
  }
  if (message) console[isError ? 'error' : 'log'](message);
}

function safeFilePart(value) {
  const cleaned = String(value || '')
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return cleaned || new Date().toISOString().slice(0, 10);
}

function getTrainingSettingsSnapshot() {
  return {
    activation: validation,
    hiddenLayers: hiddenLayers.slice(),
    learningRate: learningRateInput ? parseFloat(learningRateInput.value) : null,
    errorThresh: errorThreshSlider ? parseFloat(errorThreshSlider.value) : null,
    iterations: iterationsSlider ? parseInt(iterationsSlider.value, 10) : null,
    learnTimeSeconds: timeLearn,
    camera: {
      rotationY: cameraAngleY,
      rotationX: cameraAngleX,
      zoom: zoom
    }
  };
}

function getSessionSettingsSnapshot(modelName) {
  return {
    modelName: modelName || currentModelName || null,
    savedAt: new Date().toISOString(),
    settings: {
      training: getTrainingSettingsSnapshot(),
      visual: Object.assign({}, visualSettings),
      headPictureName: selectedHeadPictureName
    }
  };
}

function applySettingsSnapshot(settings) {
  if (!settings) return;

  if (settings.headPictureName) setCustomHeadPicture(settings.headPictureName);
  if (settings.visual) applyVisualSettings(settings.visual);
  if (settings.headPictureName) setCustomHeadPicture(settings.headPictureName);

  if (settings.training) {
    if (settings.training.activation && validations.includes(settings.training.activation)) {
      validation = settings.training.activation;
      if (validationSelect) validationSelect.value = validation;
    }

    if (Array.isArray(settings.training.hiddenLayers)) {
      settings.training.hiddenLayers.forEach((value, index) => {
        const input = document.getElementById(`hidden-layer-${index + 1}`);
        if (input) input.value = parseInt(value, 10) || 0;
      });
      updateHiddenLayers();
    }

    if (learningRateInput && settings.training.learningRate !== null && settings.training.learningRate !== undefined) {
      learningRateInput.value = settings.training.learningRate;
    }
    if (errorThreshSlider && settings.training.errorThresh !== null && settings.training.errorThresh !== undefined) {
      errorThreshSlider.value = settings.training.errorThresh;
    }
    if (iterationsSlider && settings.training.iterations) {
      iterationsSlider.value = settings.training.iterations;
      if (iterationsValue) iterationsValue.textContent = iterationsSlider.value;
    }

    if (settings.training.camera) {
      if (typeof settings.training.camera.rotationY === 'number') {
        updateRotationY(settings.training.camera.rotationY);
        const slider = document.getElementById('rotation-y-slider');
        if (slider) slider.value = settings.training.camera.rotationY;
      }
      if (typeof settings.training.camera.rotationX === 'number') {
        updateRotationX(settings.training.camera.rotationX);
        const slider = document.getElementById('rotation-x-slider');
        if (slider) slider.value = settings.training.camera.rotationX;
      }
      if (typeof settings.training.camera.zoom === 'number') {
        updateZoom(settings.training.camera.zoom);
        const slider = document.getElementById('zoom-slider');
        if (slider) slider.value = settings.training.camera.zoom;
      }
    }
  }
}

async function waitForDbReady() {
  if (db) return db;
  if (typeof dbReady !== 'undefined') return dbReady;
  return null;
}

async function readModelRecord(modelName) {
  const readyDb = await waitForDbReady();

  return new Promise((resolve, reject) => {
    if (!readyDb || !modelName) {
      resolve(null);
      return;
    }

    const transaction = readyDb.transaction(['models'], 'readonly');
    const objectStore = transaction.objectStore('models');
    const getRequest = objectStore.get(modelName);

    getRequest.onsuccess = event => resolve(event.target.result || null);
    getRequest.onerror = event => reject(event.target.error);
  });
}

async function readLatestModelRecord() {
  const readyDb = await waitForDbReady();

  return new Promise((resolve, reject) => {
    if (!readyDb) {
      resolve(null);
      return;
    }

    const transaction = readyDb.transaction(['models'], 'readonly');
    const objectStore = transaction.objectStore('models');
    const getAllRequest = objectStore.getAll();

    getAllRequest.onsuccess = event => {
      const models = event.target.result || [];
      if (!models.length) {
        resolve(null);
        return;
      }

      models.sort((a, b) => {
        const aTime = Date.parse(a.importedAt || a.createdAt || 0) || 0;
        const bTime = Date.parse(b.importedAt || b.createdAt || 0) || 0;
        return bTime - aTime;
      });
      resolve(models[0]);
    };
    getAllRequest.onerror = event => reject(event.target.error);
  });
}

async function writeModelRecord(modelRecord) {
  const readyDb = await waitForDbReady();

  return new Promise((resolve, reject) => {
    if (!readyDb) {
      reject(new Error('IndexedDB is not ready yet.'));
      return;
    }

    const transaction = readyDb.transaction(['models'], 'readwrite');
    const objectStore = transaction.objectStore('models');
    const putRequest = objectStore.put(modelRecord);

    putRequest.onsuccess = () => resolve(modelRecord);
    putRequest.onerror = event => reject(event.target.error);
  });
}

async function readSettingsRecord(name) {
  const readyDb = await waitForDbReady();

  return new Promise((resolve, reject) => {
    if (!readyDb || !name || !readyDb.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
      resolve(null);
      return;
    }

    const transaction = readyDb.transaction([SETTINGS_STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(SETTINGS_STORE_NAME);
    const getRequest = objectStore.get(name);

    getRequest.onsuccess = event => resolve(event.target.result || null);
    getRequest.onerror = event => reject(event.target.error);
  });
}

async function writeSettingsRecord(name, sessionSnapshot) {
  const readyDb = await waitForDbReady();

  return new Promise((resolve, reject) => {
    if (!readyDb || !name || !readyDb.objectStoreNames.contains(SETTINGS_STORE_NAME)) {
      resolve(null);
      return;
    }

    const record = Object.assign({ name }, sessionSnapshot || {});
    const transaction = readyDb.transaction([SETTINGS_STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(SETTINGS_STORE_NAME);
    const putRequest = objectStore.put(record);

    putRequest.onsuccess = () => resolve(record);
    putRequest.onerror = event => reject(event.target.error);
  });
}

async function saveModelSettings(modelName) {
  if (!modelName) return null;
  return writeSettingsRecord(modelName, getSessionSettingsSnapshot(modelName));
}

async function saveLastSession(modelName = currentModelName) {
  return writeSettingsRecord(LAST_SESSION_SETTINGS_NAME, getSessionSettingsSnapshot(modelName));
}

async function applyModelSettings(modelName) {
  if (!modelName) return false;
  const settingsRecord = await readSettingsRecord(modelName);
  if (!settingsRecord || !settingsRecord.settings) return false;
  applySettingsSnapshot(settingsRecord.settings);
  return true;
}

function selectModelInUi(modelName) {
  const modelSelect = document.getElementById('model-select');
  if (!modelSelect || !modelName) return;

  let option = Array.from(modelSelect.options).find(item => item.value === modelName);
  if (!option) {
    option = document.createElement('option');
    option.value = modelName;
    option.textContent = getModelDisplayName(modelName);
    modelSelect.appendChild(option);
  }

  modelSelect.value = modelName;
  currentModelName = modelName;
  rememberLastModelName(modelName);
}

function getInMemoryModelData() {
  if (!network || typeof network.toJSON !== 'function') return null;

  try {
    return network.toJSON();
  } catch (error) {
    console.error('Dancing5 export: current in-memory model could not be serialized.', error);
    return null;
  }
}

function buildModelExport(modelRecord, modelDataOverride, modelNameOverride) {
  const fallbackName = modelNameOverride || currentModelName || 'current-model';
  const modelData = modelDataOverride || (modelRecord && modelRecord.data ? modelRecord.data : null);
  const modelName = modelRecord && modelRecord.name ? modelRecord.name : fallbackName;

  return {
    app: 'Dancing5',
    formatVersion: MODEL_EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    modelName: modelName,
    source: 'local-export',
    model: modelData ? {
      name: modelName,
      data: modelData,
      createdAt: modelRecord && modelRecord.createdAt ? modelRecord.createdAt : null
    } : null,
    settings: {
      training: getTrainingSettingsSnapshot(),
      visual: Object.assign({}, visualSettings),
      headPictureName: selectedHeadPictureName
    }
  };
}

async function exportCurrentModelJson() {
  try {
    console.log('Dancing5 export started.');
    setModelJsonStatus('Export started...', false);

    const modelSelect = document.getElementById('model-select');
    const selectedName = currentModelName || (modelSelect && modelSelect.value ? modelSelect.value : null);
    const memoryModelData = getInMemoryModelData();
    let storedModel = selectedName ? await readModelRecord(selectedName) : null;

    if (storedModel) {
      console.log(`Dancing5 export: model found in IndexedDB: ${storedModel.name}`);
    } else if (selectedName) {
      console.log(`Dancing5 export: no IndexedDB model found for selected name "${selectedName}".`);
    }

    if (!memoryModelData && !storedModel) {
      storedModel = await readLatestModelRecord();
      if (storedModel) {
        console.log(`Dancing5 export: using latest IndexedDB model: ${storedModel.name}`);
      } else {
        console.log('Dancing5 export: no model found; exporting current settings only.');
      }
    } else if (memoryModelData) {
      console.log('Dancing5 export: using current in-memory model.');
    }

    const exportData = buildModelExport(storedModel, memoryModelData, selectedName);

    if (!exportData.model && !exportData.settings) {
      setModelJsonStatus('No model or settings are available to export.', true);
      return;
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dancing5-model-${safeFilePart(exportData.modelName || exportData.exportedAt)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    console.log(`Dancing5 export success: ${link.download}`);
    setModelJsonStatus(`Exported ${exportData.modelName || 'current settings'}.`, false);
  } catch (error) {
    console.error('Dancing5 export failed.', error);
    setModelJsonStatus(`Export failed: ${error.message || error}`, true);
  }
}

function validateModelExport(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('The file is not a JSON object.');
  }

  if (data.app && data.app !== 'Dancing5') {
    throw new Error('This does not look like a Dancing5 export.');
  }

  const hasModelEnvelope = data.model && (data.model.data || data.model.layers || data.model.sizes);
  const hasDirectBrainModel = data.layers || data.sizes || (data.data && (data.data.layers || data.data.sizes));
  const hasNetwork = data.network || data.brainModel;
  const hasSettings = data.settings || data.visual || data.training;

  if (!hasModelEnvelope && !hasDirectBrainModel && !hasNetwork && !hasSettings) {
    throw new Error('The export does not contain model or settings data.');
  }

  if (data.model && !hasModelEnvelope) {
    throw new Error('The model data is missing or invalid.');
  }

  return true;
}

function normalizeImportedModelExport(data) {
  let modelData = null;

  if (data.model && data.model.data) modelData = data.model.data;
  else if (data.model && (data.model.layers || data.model.sizes)) modelData = data.model;
  else if (data.network) modelData = data.network;
  else if (data.brainModel) modelData = data.brainModel;
  else if (data.data && (data.data.layers || data.data.sizes)) modelData = data.data;
  else if (data.layers || data.sizes) modelData = data;

  const settings = data.settings || {
    training: data.training || null,
    visual: data.visual || null
  };

  return {
    modelName: (data.model && data.model.name) || data.modelName || data.name || 'imported-model',
    modelData: modelData,
    modelCreatedAt: (data.model && data.model.createdAt) || data.createdAt || null,
    settings: settings
  };
}

function uniqueImportedModelName(baseName) {
  const safeBase = String(baseName || 'imported-model').trim() || 'imported-model';
  return safeBase;
}

async function importModelExport(data, sourceLabel, options = {}) {
  console.log(`Dancing5 ${sourceLabel || 'import'} started.`);

  try {
    validateModelExport(data);
  } catch (error) {
    console.error('Dancing5 import validation error.', error);
    throw error;
  }

  const normalized = normalizeImportedModelExport(data);
  if (options.applySettings !== false) {
    applySettingsSnapshot(normalized.settings);
  }

  if (normalized.modelData) {
    const modelName = uniqueImportedModelName(options.modelNameOverride || normalized.modelName);
    const modelRecord = {
      name: modelName,
      data: normalized.modelData,
      createdAt: normalized.modelCreatedAt || new Date().toISOString(),
      importedAt: new Date().toISOString()
    };

    await writeModelRecord(modelRecord);
    await writeSettingsRecord(modelName, {
      modelName,
      savedAt: new Date().toISOString(),
      settings: normalized.settings || {
        training: null,
        visual: Object.assign({}, DEFAULT_VISUAL_SETTINGS),
        headPictureName: DEFAULT_HEAD_PICTURE.name
      }
    });

    if (options.activate === false) {
      console.log(`Dancing5 import saved without activating: ${modelName}`);
      return modelName;
    }

    network = new brain.NeuralNetwork();
    network.fromJSON(modelRecord.data);
    selectModelInUi(modelName);
    await saveLastSession(modelName);
    if (!options.skipPopulate) populateModels();
    console.log(`Dancing5 import success: ${modelName}`);
    setModelJsonStatus(`${sourceLabel || 'Import'} loaded "${modelName}".`, false);
    return;
  }

  console.log('Dancing5 import success: settings only.');
  setModelJsonStatus(`${sourceLabel || 'Import'} loaded settings.`, false);
}

function importModelJsonFile(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  console.log(`Dancing5 import started: ${file.name}`);
  setModelJsonStatus(`Import started: ${file.name}`, false);
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      await importModelExport(data, 'Import');
    } catch (error) {
      console.error('Dancing5 import failed.', error);
      setModelJsonStatus(`Import failed: ${error.message || error}`, true);
    } finally {
      importModelJsonInput.value = '';
    }
  };
  reader.onerror = () => {
    console.error('Dancing5 import failed: the file could not be read.');
    setModelJsonStatus('Import failed: the file could not be read.', true);
    importModelJsonInput.value = '';
  };
  reader.readAsText(file);
}

async function loadDemoModelJson() {
  try {
    console.log('Dancing5 demo load started.');
    setModelJsonStatus('Demo load started...', false);
    await importDemoModelFromPath('Demo model');
    console.log('Dancing5 demo load success.');
  } catch (error) {
    console.error('Dancing5 demo load failed.', error);
    setModelJsonStatus(`Demo load failed: ${error.message || error}`, true);
  }
}

async function importDemoModelFromPath(sourceLabel, options = {}) {
  const modelPath = options.modelPath || DEFAULT_DEMO_MODEL_PATH;
  const modelName = options.modelNameOverride || DEFAULT_DEMO_MODEL_NAME;
  console.log(`Dancing5 demo import from ${modelPath}`);
  const response = await fetch(modelPath, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`${modelPath} was not found.`);
  }

  const data = await response.json();
  await importModelExport(data, sourceLabel || 'Demo model', Object.assign({}, options, {
    modelNameOverride: modelName
  }));
}

async function loadStartupDemoModelJson() {
  if (startupDemoLoadStarted || currentModelName) return;
  startupDemoLoadStarted = true;

  try {
    await importDemoModelFromPath('Startup demo model', {
      activate: false,
      applySettings: false,
      skipPopulate: true
    });
    console.log('Dancing5 startup demo load success.');
  } catch (error) {
    console.error('Dancing5 startup demo load failed.', error);
    setModelJsonStatus(`Startup demo load failed: ${error.message || error}`, true);
  } finally {
    startupDemoLoadStarted = false;
  }
}


function saveModel() {
    const modelName = currentModelName;
    console.log('Saving model:', modelName);

    // Check if a valid model name is provided
    if (!modelName) {
        console.error('Invalid model name or model does not exist.');
        alert('Cannot save the model. Please ensure a valid model is selected.');
        return;
    }

    // Serialize the model for storage
    const modelData = network.toJSON();
    console.log('Model Data:', modelData);

    // Prepare the model object for IndexedDB
    const modelRecord = {
        name: modelName, // Use the model name as the key
        data: modelData,
        createdAt: new Date().toISOString() // Optional: Add metadata
    };

    // Save the model to IndexedDB
    const transaction = db.transaction(['models'], 'readwrite');
    const objectStore = transaction.objectStore('models');

    // Use `put` instead of `add` to allow overwriting existing records
    const putRequest = objectStore.put(modelRecord);

    // Success handler
    putRequest.onsuccess = async function(event) {
        console.log(`Model "${modelName}" saved to IndexedDB with key:`, event.target.result);
        try {
            await saveModelSettings(modelName);
            await saveLastSession(modelName);
            rememberLastModelName(modelName);
            alert(`Model "${modelName}" has been saved successfully.`);
            populateModels(); // Refresh the model select element if needed
        } catch (error) {
            console.error('Error saving model settings to IndexedDB:', error);
            alert(`Model "${modelName}" was saved, but its avatar settings could not be saved.`);
        }
    };

    // Error handler
    putRequest.onerror = function(event) {
        console.error('Error saving model to IndexedDB:', event.target.error);
        alert(`Failed to save model "${modelName}".`);
    };
}


function saveData() {
	
     if (!dataName) {
        dataName = prompt('Enter name for the new train dataset:');
        if (!dataName) {
            alert('Dataset name is required.');
            return;
        }
    }
  
    if (!trainingData || trainingData.length <  9 ) {
        alert('No training data to save.');
        return;
    }
	

    // Prepare the data record to be saved
    const dataRecord = {
        name: dataName ,          // Name of the model
        data: trainingData,              // The actual training data
        createdAt: new Date().toISOString() // Timestamp for reference
    };

    // Start a readwrite transaction on the 'datas' object store
    const transaction = db.transaction(['datas'], 'readwrite');
    const objectStore = transaction.objectStore('datas');

    // Add the data record to the object store
    const addRequest = objectStore.add(dataRecord);

    // Success handler
    addRequest.onsuccess = function(event) {
		populateDatas();
        console.log(`Training data for model "${dataName }" saved to IndexedDB with key:`, event.target.result);
        alert(`Training data for model "${ dataName }" has been saved successfully.`);
    };

    // Error handler
    addRequest.onerror = function(event) {
        console.error('Error saving training data to IndexedDB:', event.target.error);
        alert(`Failed to save training data for model "${dataName }".`);
    };
}





updateLearnTimeDisplay();

document.getElementById("moncount").innerHTML = 0;


function flipFull()
{
  if( flagPannel == true )
  {
    flagPannel = false;
    setModelManagerVisible(false);
    document.getElementById("canvas-container").style.display="";
    document.getElementById("content").style.display="none";
    //document.getElementById("fliptrain").innerHTML = "Avatar";

  }
  else
  {
    //return;
    flagPannel = true;
    setModelManagerVisible(true);
    document.getElementById("canvas-container").style.display="none";
    document.getElementById("content").style.display="";
    //document.getElementById("fliptrain").innerHTML = "Trainning";

  }
 
}

 
