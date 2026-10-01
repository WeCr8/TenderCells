/*
  Tender Cells Anthem Premiere assembly

  Run in Premiere Pro with File > Scripts > Run Script File... after the
  TenderCells-video repo has generated video-out/segments and the anthem audio.

  This builds an editable sequence from the per-shot segment renders. It does
  not import lyric caption files.
*/

(function () {
  var PROJECT_ROOT = "C:/Users/zach/Documents/Projects/TenderCells-video";
  var VIDEO_OUT = PROJECT_ROOT + "/applications/tendercells_ui/test_output/tendercells-ui/video-out";
  var SEGMENTS_DIR = VIDEO_OUT + "/segments";
  var AUDIO_PATH = PROJECT_ROOT + "/docs/video/tender-cells-anthem.mp3";
  var SEQUENCE_NAME = "Tender Cells Anthem - editable assembly";
  var BIN_NAME = "Tender Cells Anthem Assembly";

  var SECTION_MARKERS = [
    { name: "Intro (instrumental)", start: 0.00 },
    { name: "Verse 1", start: 14.20 },
    { name: "Pre-chorus 1", start: 48.30 },
    { name: "Chorus 1", start: 56.10 },
    { name: "Verse 2", start: 91.40 },
    { name: "Pre-chorus 2", start: 125.40 },
    { name: "Chorus 2", start: 133.10 },
    { name: "Bridge", start: 169.70 },
    { name: "Break", start: 194.40 },
    { name: "Final chorus", start: 198.40 },
    { name: "Outro / end card", start: 220.30 }
  ];

  function fail(message) {
    alert("Tender Cells assembly failed:\n\n" + message);
    throw new Error(message);
  }

  function padShot(numberValue) {
    return numberValue < 10 ? "S0" + numberValue : "S" + numberValue;
  }

  function fileExists(path) {
    return File(path).exists;
  }

  function findOrCreateBin(name) {
    var root = app.project.rootItem;
    for (var i = 0; i < root.children.numItems; i++) {
      var item = root.children[i];
      if (item && item.name === name && item.type === ProjectItemType.BIN) {
        return item;
      }
    }
    return root.createBin(name);
  }

  function walkItems(item, visitor) {
    if (!item) return;
    visitor(item);
    if (item.children && item.children.numItems) {
      for (var i = 0; i < item.children.numItems; i++) {
        walkItems(item.children[i], visitor);
      }
    }
  }

  function normalizePath(path) {
    return String(path || "").replace(/\\/g, "/").toLowerCase();
  }

  function findProjectItemByPath(path) {
    var wanted = normalizePath(path);
    var found = null;
    walkItems(app.project.rootItem, function (item) {
      if (found || !item || typeof item.getMediaPath !== "function") return;
      try {
        if (normalizePath(item.getMediaPath()) === wanted) found = item;
      } catch (e) {}
    });
    return found;
  }

  function findSequenceByName(name) {
    for (var i = 0; i < app.project.sequences.numSequences; i++) {
      var seq = app.project.sequences[i];
      if (seq && seq.name === name) return seq;
    }
    return null;
  }

  function setActiveSequence(sequence) {
    try {
      app.project.activeSequence = sequence;
    } catch (e) {}
  }

  if (!app.project) {
    fail("No Premiere project is open.");
  }

  var bin = findOrCreateBin(BIN_NAME);
  var segmentPaths = [];
  for (var shot = 1; shot <= 70; shot++) {
    var path = SEGMENTS_DIR + "/" + padShot(shot) + ".mp4";
    if (!fileExists(path)) fail("Missing segment: " + path);
    segmentPaths.push(path);
  }
  if (!fileExists(AUDIO_PATH)) fail("Missing anthem audio: " + AUDIO_PATH);

  app.project.importFiles(segmentPaths, true, bin, false);
  app.project.importFiles([AUDIO_PATH], true, bin, false);

  var segmentItems = [];
  for (var index = 0; index < segmentPaths.length; index++) {
    var projectItem = findProjectItemByPath(segmentPaths[index]);
    if (!projectItem) fail("Imported segment was not found in the project panel: " + segmentPaths[index]);
    segmentItems.push(projectItem);
  }

  var audioItem = findProjectItemByPath(AUDIO_PATH);
  if (!audioItem) fail("Imported anthem audio was not found in the project panel.");

  var existing = findSequenceByName(SEQUENCE_NAME);
  if (existing) {
    SEQUENCE_NAME = SEQUENCE_NAME + " " + (new Date().getTime());
  }

  var created = app.project.createNewSequenceFromClips(SEQUENCE_NAME, segmentItems, bin);
  var sequence = created || findSequenceByName(SEQUENCE_NAME) || app.project.activeSequence;
  if (!sequence) fail("Premiere did not return the new sequence.");
  setActiveSequence(sequence);

  try {
    if (sequence.audioTracks && sequence.audioTracks.numTracks > 0) {
      sequence.audioTracks[0].overwriteClip(audioItem, 0);
    }
  } catch (audioError) {
    alert("Sequence was created, but the anthem audio could not be placed automatically:\n\n" + audioError);
  }

  try {
    for (var markerIndex = 0; markerIndex < SECTION_MARKERS.length; markerIndex++) {
      var spec = SECTION_MARKERS[markerIndex];
      var marker = sequence.markers.createMarker(spec.start);
      marker.name = spec.name;
      marker.comments = "Tender Cells Anthem section";
    }
  } catch (markerError) {
    alert("Sequence was created, but section markers could not be added:\n\n" + markerError);
  }

  alert(
    "Tender Cells Anthem assembly created.\n\n" +
    "Sequence: " + sequence.name + "\n" +
    "Video: " + segmentItems.length + " segments\n" +
    "Audio: tender-cells-anthem.mp3"
  );
})();
