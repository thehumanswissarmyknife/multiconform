const convertFramesToTimecode = (frameString, fps) => {
  // frameString is in the format int/ints, e.g. 24/8s
  const totalFrames = parseInt(frameString.split('/')[0]);
  const divider = parseInt(
    frameString.split('/')[1].substring(0, frameString.split('/')[1].length - 1)
  );

  var hours, minutes, seconds, frames;
  hours = parseInt(parseInt(totalFrames / divider) / 3600);
  minutes = parseInt((totalFrames / divider / 60) % 60);
  seconds = parseInt(totalFrames / divider) % 60;
  frames = (totalFrames % divider) * (fps / divider);

  const timeCode = {
    hours,
    minutes,
    seconds,
    frames
  };
  return timeCode;
};

const durationOfTimeline = tl => {
  const duration =
    tl.fcpxml.library.event.project.sequence._attributes.duration;
  return convertFramesToTimecode(duration);
};

const returnLongestTimeline = dataObject => {
  const timelines = dataObject.timelines;
  var longestTimeline = convertFramesToTimecode('0/24s', 24);
  for (i = 0; i < timelines.length; i++) {
    var lengthOfTimeline = durationOfTimeline(timelines[i]);
    if (durationIsLonger(lengthOfTimeline, longestTimeline, 24)) {
      longestTimeline = lengthOfTimeline;
    }
  }
  console.log(longestTimeline);
};

const durationIsLonger = (tc1, tc2, fps) => {
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
    console.log('first timecode is longer thant he second');
    return true;
  } else {
    console.log('second timecode is longer thant he first');
    return false;
  }
};

const createAsset = (
  src,
  id,
  duration,
  audioChannels,
  format,
  name,
  hasVideo,
  start,
  audioSources,
  hasAudio
) => {
  var asset = {
    src,
    id,
    duration,
    audioChannels,
    format,
    name,
    hasVideo,
    start,
    audioSources,
    hasAudio
  };
  return asset;
};

const createAssetClip = (
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
) => {
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
};

exports.convertFramesToTimecode = convertFramesToTimecode;
exports.durationOfTimeline = durationOfTimeline;
exports.returnLongestTimeline = returnLongestTimeline;
exports.durationIsLonger = durationIsLonger;
exports.createAsset = createAsset;
exports.createAssetClip = createAssetClip;
