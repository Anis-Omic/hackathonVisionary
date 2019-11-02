let featureExtractor;
let classifier;
let video;
let loss;

var signs = ["A", "B"]; //, "C", "D", "E"];

function setup() {
  noCanvas();
  // Create a video element
  video = createCapture(VIDEO);
  video.parent("videoContainer");
  video.hide();
  video.size(380, 300);

  // Extract the already learned features from MobileNet
  featureExtractor = ml5.featureExtractor("MobileNet", modelReady);

  // Create a new classifier using those features and give the video we want to use
  const options = { numLabels: 3 };
  classifier = featureExtractor.classification(video, options);
  // Set up the UI buttons
  setupButtons();
}

// A function to be called when the model has been loaded
function modelReady() {
  select("#modelStatus").html("MobileNet Loaded!");
  // If you want to load a pre-trained model at the start
  // classifier.load('./model/model.json', function() {
  //   select('#modelStatus').html('Custom Model Loaded!');
  // });
}

// Classify the current frame.
function classify() {
  classifier.classify(gotResults);
}

// A util function to create UI buttons
function setupButtons() {
  // When the Cat button is pressed, add the current frame
  // from the video with a label of "cat" to the classifier
  let wrapper = window.document.createElement("div");

  signs.forEach((x, i) => {
    let btn = window.document.createElement("input");
    btn.type = "file";
    btn.multiple = true;
    btn.labels = "Data for " + x;
    btn.addEventListener("change", function(e) {
      let files = e.target.files;
      for (var j = 0; j < files.length; j++) {
        let file = files[j];
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(e) {
          //let img = dl.fromPixels(e.target.result);
          classifier.addImage(e.target.result, i);
        };
      }
    });
    wrapper.appendChild(btn);
  });

  let parent = window.document.getElementById("buttons");
  parent.appendChild(wrapper);

  // Train Button
  train = select("#train");
  train.mousePressed(function() {
    classifier.train(function(lossValue) {
      if (lossValue) {
        loss = lossValue;
        select("#loss").html("Loss: " + loss);
      } else {
        select("#loss").html("Done Training! Final Loss: " + loss);
      }
    });
  });

  // Predict Button
  buttonPredict = select("#buttonPredict");
  buttonPredict.mousePressed(classify);

  // Save model
  saveBtn = select("#save");
  saveBtn.mousePressed(function() {
    classifier.save();
  });

  // Load model
  loadBtn = select("#load");
  loadBtn.changed(function() {
    classifier.load(loadBtn.elt.files, function() {
      select("#modelStatus").html("Custom Model Loaded!");
    });
  });
}

// Show the results
function gotResults(err, results) {
  // Display any error
  if (err) {
    console.error(err);
  }
  if (results && results[0]) {
    select("#result").html(results[0].label);
    select("#confidence").html(results[0].confidence.toFixed(2) * 100 + "%");
    classify();
  }
}
