// get the data
$('#result').append('Test bitch');
$.get('http://localhost/api/result', function(data) {
  console.log(data);
  findLongestTimeline(data);

  // $('#result').append(JSON.stringify(data));
});

function findLongestTimeline(timelineArray) {
  var fpsVerbose =
    timelineArray[0].fcpxml.resources.format._attributes.frameDuration;
  var fps = fpsVerbose
    .split('/')[1]
    .substring(0, fpsVerbose.split('/')[1].length - 1);
  var longestTL = 0;
  console.log(
    timelineArray[0].fcpxml.library.event.project.sequence._attributes.duration
  );
  var longestTLDuration =
    timelineArray[0].fcpxml.library.event.project.sequence._attributes.duration;
  var longestTC = convertFramesToTimecode(longestTLDuration, fps);
  for (i = 0; i < timelineArray.length; i++) {
    if (
      timelineArray[i].fcpxml.resources.format._attributes.frameDuration !=
      fpsVerbose
    ) {
      console.log('Mismatching fps');
      $('#warning').append('<h1>Timelines have mismatching fps</h1>');
      return;
    }
    const duration =
      timelineArray[i].fcpxml.library.event.project.sequence._attributes
        .duration;
    const tc2 = convertFramesToTimecode(duration, fps);
    if (durationIsLonger(tc2, longestTC, fps)) {
      longestTC = tc2;
      longestTL = i;
    }
  }
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
