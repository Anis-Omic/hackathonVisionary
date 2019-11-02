import { KNNImageClassifier } from "deeplearn-knn-image-classifier";
import * as dl from "deeplearn";

// Webcam Image size. Must be 227.
const IMAGE_SIZE = 227;
// K value for KNN
const TOPK = 10;

const predictionThreshold = 0.98;

var signs = ["A", "B"];

var signs2 = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z"
];

var predBtn;
var predictionElement;
var trainBtn;
var trainingElement;

var main = null;

const initialize = () => {
  main = new Main();

  predictionElement = document.getElementById("prediction");
  trainingElement = document.getElementById("training");

  trainBtn = document.getElementById("trainingButton");
  trainBtn.addEventListener("click", showTraining);
  predBtn = document.getElementById("predictionButton");
  predBtn.addEventListener("click", showPrediction);
};

window.addEventListener("load", initialize);

function showTraining() {
  window.console.log("fefe1");
  predictionElement.style.display = "none";
  trainingElement.style.display = "flex";
  main.train();
}

function showPrediction() {
  window.console.log("fefe2");
  trainingElement.style.display = "none";
  predictionElement.style.display = "flex";
  main.initializePrediction();
}

class Main {
  constructor() {
    this.videoPlaying = false;

    this.previousPrediction = -1;
    this.currentPredictedWords = [];

    // variables to restrict prediction rate
    this.now;
    this.then = Date.now();
    this.startTime = this.then;
    this.fps = 5; //framerate - number of prediction per second
    this.fpsInterval = 1000 / this.fps;
    this.elapsed = 0;

    this.knn = null;

    // Get video element that will contain the webcam image
    this.video = document.getElementById("video");

    // load text to speech
    this.tts = new TextToSpeech();
  }

  initializePrediction() {
    console.log("start predicting");
    const exampleCount = this.knn.getClassExampleCount();

    this.startPredicting();

    // // check if training has been done
    // if (Math.max(...exampleCount) > 0) {
    //   this.startPredicting();
    // } else {
    //   alert(`You haven't added any examples yet.\n\n Go to training tab and provide data!!`);
    // }
  }

  startWebcam() {
    // Setup webcam
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then(stream => {
      this.video.srcObject = stream;
      this.video.width = IMAGE_SIZE;
      this.video.height = IMAGE_SIZE;

      this.video.addEventListener("playing", () => (this.videoPlaying = true));
      this.video.addEventListener("paused", () => (this.videoPlaying = false));
    });
  }

  loadKNN() {
    this.knn = new KNNImageClassifier(signs.length, TOPK);

    // Load knn model
    this.knn.load(); // .then(() => this.startTraining());
  }

  train() {
    if (this.knn === null) {
      this.loadKNN();
    }
    let wrapper = document.createElement("div");
    wrapper.style.flexDirection = "column";
    wrapper.style.display = "flex";
    signs.forEach((x, i) => {
      let btn = document.createElement("input");
      btn.multiple = true;
      btn.id = "uploadButton" + i;
      btn.type = "file";
      btn.addEventListener("change", e => {
        let files = e.target.files;
        console.log(files);
        for (var j = 0; j < files.length; j++) {
          let image = dl.fromPixels(files[j]);
          this.knn.addImage(image, i);
        }
        // files.forEach(file => this.knn.addImage(file, i));
      });
      let span = document.createElement("span");
      span.innerHTML = "Data for " + x;
      wrapper.appendChild(span);
      wrapper.appendChild(btn);
    });

    let cont = document.getElementById("training");
    cont.appendChild(wrapper);
  }

  startPredicting() {
    this.video.play();
    this.pred = requestAnimationFrame(this.predict.bind(this));
  }

  pausePredicting() {
    console.log("pause predicting");
    cancelAnimationFrame(this.pred);
  }

  predict() {
    this.now = Date.now();
    this.elapsed = this.now - this.then;

    if (this.elapsed > this.fpsInterval) {
      this.then = this.now - (this.elapsed % this.fpsInterval);

      if (this.videoPlaying) {
        const exampleCount = this.knn.getClassExampleCount();

        const image = dl.fromPixels(this.video);

        if (Math.max(...exampleCount) > 0) {
          this.knn
            .predictClass(image)
            .then(res => {
              // let index = signs.findIndex((x,i) => i == res.classIndex);
              for (let i = 0; i < signs.length; i++) {
                if (
                  res.classIndex == i &&
                  res.confidences[i] > predictionThreshold &&
                  res.classIndex != this.previousPrediction &&
                  res.classIndex != words.length - 1
                ) {
                  window.console.log(signs[i]);
                  // set previous prediction so it doesnt get called again
                  this.previousPrediction = res.classIndex;
                }
              }
            })
            .then(() => image.dispose());
        } else {
          image.dispose();
        }
      }
    }

    this.pred = requestAnimationFrame(this.predict.bind(this));
  }
}

class TextToSpeech {
  constructor() {
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.pitch = 1.0;
    this.rate = 0.9;

    this.textLine = document.getElementById("text");
    this.ansText = document.getElementById("answerText");
    this.loader = document.getElementById("loader");

    this.selectedVoice = 48; // this is Google-US en. Can set voice and language of choice

    this.currentPredictedWords = [];
    this.waitTimeForQuery = 5000;

    this.synth.onvoiceschanged = () => {
      this.populateVoiceList();
    };
  }

  populateVoiceList() {
    if (typeof speechSynthesis === "undefined") {
      console.log("no synth");
      return;
    }
    this.voices = this.synth.getVoices();

    if (this.voices.indexOf(this.selectedVoice) > 0) {
      console.log(`${this.voices[this.selectedVoice].name}:${this.voices[this.selectedVoice].lang}`);
    } else {
      //alert("Selected voice for speech did not load or does not exist.\nCheck Internet Connection")
    }
  }

  clearPara(queryDetected) {
    this.textLine.innerText = "";
    this.ansText.innerText = "";
    if (queryDetected) {
      this.loader.style.display = "block";
    } else {
      this.loader.style.display = "none";
      this.ansText.innerText = "No query detected";
      main.previousPrediction = -1;
    }
    this.currentPredictedWords = [];
  }

  speak(word) {
    if (word == "alexa") {
      console.log("clear para");
      this.clearPara(true);

      setTimeout(() => {
        // if no query detected after alexa is signed
        if (this.currentPredictedWords.length == 1) {
          this.clearPara(false);
        }
      }, this.waitTimeForQuery);
    }

    if (word != "alexa" && this.currentPredictedWords.length == 0) {
      console.log("first word should be alexa");
      console.log(word);
      return;
    }

    // if(endWords.includes(word) && this.currentPredictedWords.length == 1 && (word != "hello" && word != "bye")){
    //   console.log("end word detected early")
    //   console.log(word)
    //   return;
    // }

    if (this.currentPredictedWords.includes(word)) {
      // prevent word from being detected repeatedly in phrase
      console.log("word already been detected in current phrase");
      return;
    }

    this.currentPredictedWords.push(word);

    this.textLine.innerText += " " + word;

    var utterThis = new SpeechSynthesisUtterance(word);

    utterThis.onend = evt => {
      if (endWords.includes(word)) {
        //if last word is one of end words start listening for transcribing
        console.log("this was the last word");

        main.setStatusText("Status: Waiting for Response");

        let stt = new SpeechToText();
      }
    };

    utterThis.onerror = evt => {
      console.log("Error speaking");
    };

    utterThis.voice = this.voices[this.selectedVoice];

    utterThis.pitch = this.pitch;
    utterThis.rate = this.rate;

    this.synth.speak(utterThis);
  }
}

class SpeechToText {
  constructor() {
    this.interimTextLine = document.getElementById("interimText");
    this.textLine = document.getElementById("answerText");
    this.loader = document.getElementById("loader");
    this.finalTranscript = "";
    this.recognizing = false;

    this.recognition = new webkitSpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.lang = "en-US";

    this.cutOffTime = 15000; // cut off speech to text after

    this.recognition.onstart = () => {
      this.recognizing = true;
      console.log("started recognizing");
      main.setStatusText("Status: Transcribing");
    };

    this.recognition.onerror = evt => {
      console.log(evt + " recogn error");
    };

    this.recognition.onend = () => {
      console.log("stopped recognizing");
      if (this.finalTranscript.length == 0) {
        this.type("No response detected");
      }
      this.recognizing = false;

      main.setStatusText("Status: Finished Transcribing");
      // restart prediction after a pause
      setTimeout(() => {
        main.startPredicting();
      }, 1000);
    };

    this.recognition.onresult = event => {
      var interim_transcript = "";
      if (typeof event.results == "undefined") {
        return;
      }

      for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          this.finalTranscript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }

      this.interimType(interim_transcript);
      this.type(this.finalTranscript);
    };

    setTimeout(() => {
      this.startListening();
    }, 0);

    setTimeout(() => {
      this.stopListening();
    }, this.cutOffTime);
  }

  startListening() {
    if (this.recognizing) {
      this.recognition.stop();
      return;
    }

    console.log("listening");

    main.pausePredicting();

    this.recognition.start();
  }

  stopListening() {
    console.log("STOP LISTENING");
    if (this.recognizing) {
      console.log("stop speech to text");
      this.recognition.stop();

      //restart predicting
      main.startPredicting();
      return;
    }
  }

  interimType(text) {
    this.loader.style.display = "none";
    this.interimTextLine.innerText = text;
  }

  type(text) {
    this.loader.style.display = "none";
    this.textLine.innerText = text;
  }
}
