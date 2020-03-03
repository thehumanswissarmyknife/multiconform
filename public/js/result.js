// init the variables
var longestTL;

// get the data
$('#result').append('Test bitch');
$.get('http://localhost/api/result', function(data) {
  console.log(data);
  findLongestTimeline(data);
  console.log(getAssetClips(data[0]));

  // parseTimeLineIntoObject();

  // $('#result').append(JSON.stringify(data));
});

function findLongestTimeline(timelineArray) {
  var fps = getFps(timelineArray[0]);
  var longestTLIndex = 0;

  var longestTC = getTLDuration(timelineArray[0]);
  for (i = 0; i < timelineArray.length; i++) {
    if (getFps(timelineArray[i]) != fps) {
      console.log('Mismatching fps');
      $('#warning').append('<h1>Timelines have mismatching fps</h1>');
      return;
    }
    const tc2 = getTLDuration(timelineArray[i]);
    if (durationIsLonger(tc2, longestTC, fps)) {
      longestTC = tc2;
      longestTLIndex = i;
    }
  }
  longestTL = timelineArray[longestTLIndex];
}

function convertFramesToTimecode(frameString, fps) {
  // frameString is in the format int/ints, e.g. 24/8s
  const totalFrames = parseInt(frameString.split('/')[0]);
  const divider = parseInt(
    frameString.split('/')[1].substring(0, frameString.split('/')[1].length - 1)
  );

  var hours, minutes, seconds, frames;
  hours = parseInt(parseInt(totalFrames / divider) / 3600);
  minutes = parseInt((totalFrames / divider / 60) % 60);
  seconds = parseInt(totalFrames / divider) % 60;
  frames = (totalFrames % divider) * parseInt(fps / divider);

  const timeCode = {
    hours,
    minutes,
    seconds,
    frames
  };
  return timeCode;
}

function durationIsLonger(tc1, tc2, fps) {
  var lengthTC1 =
    tc1.hours * 3600 * fps +
    tc1.minutes * 60 * fps +
    tc1.seconds * fps +
    tc1.frames;

  var lengthTC2 =
    tc2.hours * 3600 * fps +
    tc2.minutes * 60 * fps +
    tc2.seconds * fps +
    tc2.frames;

  if (lengthTC1 > lengthTC2) {
    console.log(lengthTC1 + ' is longer than ' + lengthTC2);
    return true;
  } else {
    console.log(lengthTC2 + ' is longer than ' + lengthTC1);
    return false;
  }
}

// function parseTimeLineIntoObject(tl) {
//   var timeLineObject = { assetClips: [] };
//   timeLineObject.name = tl.fcpxml.library.event._attributes.name;
//   var assetClips = tl.fcpxml.library.event.project.sequence.spine.assetClip;

//   for (i = 0; i < assetClips.length; i++) {}

//   timeLineObject.assetClips.push();
// }

function getFps(tl) {
  var fpsVerbose = tl.fcpxml.resources.format._attributes.frameDuration;
  var fps = fpsVerbose
    .split('/')[1]
    .substring(0, fpsVerbose.split('/')[1].length - 1);
  return fps;
}

function getTLDuration(tl) {
  var durationVerbose =
    tl.fcpxml.library.event.project.sequence._attributes.duration;
  var duration = convertFramesToTimecode(durationVerbose, getFps(tl));
  return duration;
}

function getAssetClips(tl) {
  var assetClip = 'asset-clip';
  var ac = tl.fcpxml.library.event.project.sequence.spine.asset - clip;
  return ac;
}

function createAssetClip(
  ref,
  tcFormat,
  duration,
  offset,
  format,
  name,
  start,
  enabled,
  scale,
  position,
  anchor
) {
  var assetClip = {
    ref,
    tcFormat,
    duration,
    offset,
    format,
    name,
    start,
    enabled,
    'adjust-transform': {
      scale,
      position,
      anchor
    }
  };
  return assetClip;
}
