import { KNNImageClassifier } from "deeplearn-knn-image-classifier";
import ml5 from "ml5";
import p5 from "p5";

// Webcam Image size. Must be 227.
const IMAGE_SIZE = 227;
// K value for KNN
const TOPK = 10;

const predictionThreshold = 0.98;

var signs = ["A", "B", "C", "D", "E"];

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

function setup() {
  main = new Main();

  noCanvas();
  // Create a video element
  video = createCapture(VIDEO);
  video.parent("videoWrapper");
  video.hide();
  video.size(380, 300);

  imageClassifier = ml5.imageClassifier("MobileNet", video, () => imageClassifier.predict(renderResults));
}

function renderResults(err, res) {
  if (err) {
    console.log(err);
  } else {
    console.log(res);
  }
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
    this.startWebcam();
    trainBtn = document.getElementById("btnTraining");
    trainBtn.addEventListener("click", this.train);
    predBtn = document.getElementById("btnPrediction");
    predBtn.addEventListener("click", this.initializePrediction);

    featureExtractor = ml5.imageClassifier("MobileNet", () => console.log());
    // Create a new classifier using those features and give the video we want to use
    const options = { numLabels: 1 };
    classifier = featureExtractor.classification(this.video, options);

    // load text to speech
    //this.tts = new TextToSpeech();
  }

  initializePrediction() {
    console.log("start predicting");
    const exampleCount = this.classifier.getClassExampleCount();

    // check if training has been done
    if (Math.max(...exampleCount) > 0) {
      this.startPredicting();
    } else {
      alert(`You haven't added any examples yet.\n\n Go to training tab and provide data!!`);
    }
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

  dataProvider() {
    if (this.knn == null) {
      this.loadKNN();
    }
    let wrapper = document.createElement("div");
    wrapper.style.flexDirection = "column";
    wrapper.style.display = "flex";
    signs.forEach((x, i) => {
      let btn = document.createElement("input");
      btn.accept = " image/*";
      btn.multiple = true;
      btn.id = "uploadButton" + i;
      btn.type = "file";
      btn.addEventListener("change", e => {
        let files = e.target.files;
        console.log(files);
        for (var j = 0; j < files.length; j++) {
          var file = files[j];
          var reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = function(e) {
            //let img = dl.fromPixels(e.target.result);
            this.knn.addImage(e.target.result, i);
          };

          // let img = new Image();
          // this.classifier.addImage(img, i);
        }
      });
      // files.forEach(file => this.knn.addImage(file, i));

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

  classify() {
    classifier.classify(gotResults);
  }

  gotResults(err, res) {
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
  }

  predict() {
    this.now = Date.now();
    this.elapsed = this.now - this.then;

    if (this.elapsed > this.fpsInterval && this.videoPlaying) {
      this.then = this.now - (this.elapsed % this.fpsInterval);
      const exampleCount = this.classifier.getClassExampleCount();

      if (Math.max(...exampleCount) > 0) {
        this.classify();
      }
    }

    this.pred = requestAnimationFrame(this.predict.bind(this));
  }
}
