// init the variables
var longestTL;
var longestTLIndex = 0;
var fps;
var clipAssetMaster = [];
var clipsJSON = {};
var clipsArray = [];

// get the data
// $('#result').append('Test bitch');
$.get('http://localhost/api/result', function (data) {
	// check if files were uploaded
	if (data.length == 0) {
		$('#warning').append('<h2>please upload a timeline</h2>');
		return;
	}

	// determine the base fps and if all timelines adhere to that
	fps = getFps(data[0]);
	for (i = 0; i < data.length; i++) {
		if (getFps(data[i]) != fps) {
			$('#warning').append('<h2>Timelines have mismatching fps</h2>');
		}
	}

	// display the basic table
	for (i = 0; i < data.length; i++) {
		var tl = data[i];
		console.log(i, data.length, getTimeLineName(tl));
		$('#versionTable > tbody:last-child').append(
			'<tr><td class="column1">' +
				getTimeLineName(tl) +
				'</td><td class="column2">' +
				printTC(getTLDuration(tl), true) +
				'</td><td class="column4">' +
				getVideoDimensions(tl) +
				'</td><td class="column5"></td></tr > '
		);
	}

	// ingest all clips from all timelines and tracks
	for (i = 0; i < data.length; i++) {
		getAssetClips(data[i]);
	}
	console.log('Scan complete');
	clipsArray.forEach((clip, index, none) => {
		clip.occurences.sort(function (a, b) {
			return a.in - b.in;
		});
	});

	// process the ingested clips
	// while (tryMergeClips(clipsArray)) {
	tryMergeClips(clipsArray);
	// }
});

function findLongestTimeline (timelineArray) {
	var longestTC = getTLDuration(timelineArray[0]);
	for (i = 0; i < timelineArray.length; i++) {
		const tc2 = getTLDuration(timelineArray[i]);
		if (durationIsLonger(tc2, longestTC)) {
			longestTC = tc2;
			longestTLIndex = i;
		}
	}
	longestTL = timelineArray[longestTLIndex];
}

function convertFramesToTimecode (frameString, fps) {
	// frameString is in the format int/ints, e.g. 24/8s
	const totalFrames = parseInt(frameString.split('/')[0]);
	const divider = parseInt(frameString.split('/')[1].substring(0, frameString.split('/')[1].length - 1));

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

function xmemlFramesToTC (frames, fps) {
	var hours, minutes, seconds, frames;
	hours = parseInt(parseInt(frames / fps) / 3600);
	minutes = parseInt((frames / fps / 60) % 60);
	seconds = parseInt(frames / fps) % 60;
	frames = frames % fps;

	const timeCode = {
		hours,
		minutes,
		seconds,
		frames
	};
	return timeCode;
}

function durationIsLonger (tc1, tc2) {
	var lengthTC1 = tc1.hours * 3600 * fps + tc1.minutes * 60 * fps + tc1.seconds * fps + tc1.frames;

	var lengthTC2 = tc2.hours * 3600 * fps + tc2.minutes * 60 * fps + tc2.seconds * fps + tc2.frames;

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

// GETTERS

function getFps (tl) {
	if (tl._doctype == 'fcpxml') {
		// console.log('getFps: fcpxml');
		var fpsVerbose = tl.fcpxml.resources.format._attributes.frameDuration;
		var fps = fpsVerbose.split('/')[1].substring(0, fpsVerbose.split('/')[1].length - 1);
		return fps;
	} else if (tl._doctype == 'xmeml') {
		// console.log('getFps: xmeml');
		var fps = tl.xmeml.sequence.rate.timebase._text;
		return fps;
	}
}

function getTLDuration (tl) {
	if (tl._doctype == 'fcpxml') {
		// console.log('getTLDuration: fcpxml');
		var durationVerbose = tl.fcpxml.library.event.project.sequence._attributes.duration;
		var duration = convertFramesToTimecode(durationVerbose, getFps(tl));
		return duration;
	} else if (tl._doctype == 'xmeml') {
		// console.log('getTLDuration:xmeml');
		var durationFrames = tl.xmeml.sequence.duration._text;
		var duration = xmemlFramesToTC(durationFrames, getFps(tl));
		return duration;
	}
}
// function getNumberOfClips (tl) {
// 	var numberOfClips = 0;
// 	if (tl._doctype == 'fcpxml') {
// 		// console.log('getNumberOfClips: fcpxml');
// 		numberOfClips += tl.fcpxml.library.event.project.sequence.spine['asset-clip'].length;
// 	}
// 	if (tl._doctype == 'xmeml') {
// 		// console.log('getNumberOfClips: xmeml');

// 		var tracks = tl.xmeml.sequence.media.video.track;
// 		for (i = 0; i < tracks.length; i++) {
// 			// inside the track you find an array
// 			if (tracks[i].hasOwnProperty('clipitem')) {
// 				console.log('counting tracks');
// 			}
// 		}
// 	}

// 	return numberOfClips;
// }

function getAssetClips (tl) {
	console.log('Getting the clips');

	if (tl._doctype == 'fcpxml') {
		// console.log('File is fcpxml');
		var assetClip = 'asset-clip';
		var ac = tl.fcpxml.library.event.project.sequence.spine['asset-clip'];
		return ac;
	} else if (tl._doctype == 'xmeml') {
		// console.log('File is xmeml');
		var tracks = tl.xmeml.sequence.media.video.track;

		for (i = 0; i < tracks.length; i++) {
			// inside the track you find an array
			if (tracks[i].hasOwnProperty('clipitem')) {
				for (j = 0; j < tracks[i].clipitem.length; j++) {
					var thisClip = tracks[i].clipitem[j];
					// console.log(i, j, thisClip);
					if (!clipsJSON.hasOwnProperty(thisClip.name._text)) {
						var clip = thisClip;
						clip['occurences'] = [];
						clipsJSON[thisClip.name._text] = clip;
					}
					var inOut = {
						in: thisClip.in._text,
						out: thisClip.out._text
					};
					clipsJSON[thisClip.name._text].occurences.push(inOut);

					// console.log('clip created for: ', clip.name._text);
				}
			}
		}
		// console.log(clipsJSON);
	}
	for (thisClip in clipsJSON) {
		clipsArray.push(clipsJSON[thisClip]);
	}
	console.log('ClipsArray:', clipsArray);
	return clipsArray;
}

function getTimeLineName (tl) {
	if (tl._doctype == 'fcpxml') {
		console.log('getTimeLineName: fcpxml');
		var name = tl.fcpxml.library.event._attributes.name;
		return name;
	} else if (tl._doctype == 'xmeml') {
		console.log('getTimeLineName: xmeml');
		var name = tl.xmeml.sequence.name._text;
		return name;
	}
}

function getVideoDimensions (tl) {
	if (tl._doctype == 'fcpxml') {
		console.log('getVideoDimensions: fcpxml');
		var temp = tl.fcpxml.resources.format._attributes;
		var dim = temp.width + 'x' + temp.height;
		return dim;
	} else if (tl._doctype == 'xmeml') {
		console.log('getVideoDimensions: xmeml');
		var temp = tl.xmeml.sequence.media.video.format.samplecharacteristics;
		var dim = temp.width._text + 'x' + temp.height._text;
		return dim;
	}
}

// Manipulation

function recursiveMergAssetClips (assetClipsArray) {
	for (i = 0; i < assetClipsArray.length; i++) {
		var ac = assetClipsArray[i];
		for (j = i + 1; j < assetClipsArray.length; j++) {
			var ac2 = assetClipsArray[j];
			if (ac.name == ac2.name) {
				console.log('two clips with the same name');
			}
		}
	}
}

function tcAsNo (tc) {
	var lengthTC = tc.hours * 3600 * fps + tc.minutes * 60 * fps + tc.seconds * fps + tc.frames;
	return lengthTC;
}

function checkMergeAC (ac1, ac2) {
	var acs = [];

	if (ac1.startTCNo > ac2.startTCNo && ac2.endTCNo < ac1.startTCNo) {
		// clip has no overlap
		acs.push(ac2);
	} else if (ac1.startTCNo > ac2.startTCNo && ac2.endTCNo > ac1.startTCNo && ac2.endTCNo < ac1.endTCNo) {
		// ac2 extends ac1 in front, but not in the back
		ac1.startTCNo = ac2.startTCNo;
	} else if (ac1.startTCNo < ac2.startTCNo && ac1.endTCNo > ac2.endTCNo) {
		// ac2 is completely included in ac1
	} else if (ac1.startTCNo > ac2.startTCNo && ac1.endTCNo < ac2.endTCNo) {
		// ac2 extends ac1 in both fornt and back
		ac1.startTCNo = ac2.startTCNo;
		ac1.endTCNo = ac2.endTCNo;
	} else if (ac2.startTCNo > ac1.startTCNo && ac2.endTCNo > ac1.endTCNo) {
		// ac2 extends ac1 in the back
		ac1.endTCNo = ac2.endTCNo;
	} else if (ac2.startTCNo > ac1.endTCNo && ac2.endTC > ac1.endTCNo) {
		// ac2 is separated clip in the back
		acs.push(ac2);
	}
	acs.unshift(ac1);
}

function createAssetClip (jObj) {
	console.log('jObj', jObj);
	var assetClip = {
		ref: jObj._attributes.ref,
		tcFormat: jObj._attributes.tcFormat,
		duration: jObj._attributes.duration,
		offset: jObj._attributes.offset,
		format: jObj._attributes.format,
		name: jObj._attributes.name,
		start: jObj._attributes.start,
		enabled: jObj._attributes.enabled,
		startTC: convertFramesToTimecode(jObj._attributes.start, fps),
		startTCNo: tcAsNo(convertFramesToTimecode(jObj._attributes.start, fps)),
		endTC: addDuration(
			convertFramesToTimecode(jObj._attributes.start, fps),
			convertFramesToTimecode(jObj._attributes.duration, fps)
		),
		endTCNo: tcAsNo(
			addDuration(
				convertFramesToTimecode(jObj._attributes.start, fps),
				convertFramesToTimecode(jObj._attributes.duration, fps)
			)
		),
		'adjust-transform': {
			scale: jObj['adjust-transform']._attributes.scale,
			position: jObj['adjust-transform']._attributes.position,
			anchor: jObj['adjust-transform']._attributes.anchor
		}
	};
	console.log(assetClip);
	return assetClip;
}

function addDuration (startTC, addTC) {
	var endTC = startTC;

	if (endTC.frames + addTC.frames - 1 >= fps) {
		endTC.frames = (endTC.frames + addTC.frames - 1) % fps;
		endTC.seconds += 1;
	} else {
		endTC.frames = endTC.frames + addTC.frames - 1;
	}

	if (endTC.seconds + addTC.seconds > 60) {
		endTC.seconds = (endTC.seconds + addTC.seconds) % 60;
		endTC.minutes += 1;
	} else {
		endTC.seconds = endTC.seconds + addTC.seconds;
	}

	if (endTC.minutes + addTC.minutes > 60) {
		endTC.minutes = (endTC.minutes + addTC.minutes) % 60;
		endTC.hours += 1;
	} else {
		endTC.minutes = endTC.minutes + addTC.minutes;
	}

	return endTC;
}

function printTC (tc, sec) {
	var hours, minutes, seconds, frames;
	var myTc;

	if (sec) {
		seconds = tc.minutes * 60 + tc.seconds;

		if (tc.frames != 0) {
			myTc = seconds + 's' + tc.frames + 'f';
		} else {
			myTc = seconds + 's';
		}
	} else {
		if (tc.hours < 10) {
			hours = '0' + tc.hours;
		} else {
			hours = tc.hours;
		}
		if (tc.minutes < 10) {
			minutes = '0' + tc.minutes;
		} else {
			minutes = tc.minutes;
		}
		if (tc.seconds < 10) {
			seconds = '0' + tc.seconds;
		} else {
			seconds = tc.seconds;
		}
		if (tc.frames < 10) {
			frames = '0' + tc.frames;
		} else {
			frames = tc.frames;
		}
		myTc = hours + ':' + minutes + ':' + seconds + ':' + frames + 'f';
	}

	return myTc;
}

function tryMergeClips (data) {
	var someThingChanged = false;
	console.log('tryMerge these:', data.length, data);
	// iterate though all clip-items
	for (i = 0; i < data.length; i++) {
		// inside the clip go through all occurences

		console.log('Looking at clip:', data[i].name._text, data[i].occurences);
		if (data[i].occurences.length < 2) {
			console.log('only one occurence, moving on');
			continue;
		}
		var baseInOut = data[i].occurences[0];
		for (j = 0; j < data[i].occurences.length; j++) {
			console.log('looking at this occurence', data[i].occurences[j]);
			if (!data[i].occurences[j].hasOwnProperty('in')) {
				console.log('###### #### # ## # ## no IN');
				continue;
			}
			var thisInOut = data[i].occurences[j];
			// check the six possible cases
			if (thisInOut.in <= baseInOut.in) {
				// clips starts before the
				if (thisInOut.out < baseInOut.in - 1) {
					// clips is separate
					continue;
				} else if (thisInOut.out <= baseInOut.out) {
					// clip extends baseClip to the front
					baseInOut.in = thisInOut.in;
					someThingChanged = true;
					data[i].occurences.splice(j, 1);
					j--;
					console.log('thisInOut.out < baseInOut.out', baseInOut, thisInOut);
					continue;
				} else if (thisInOut.out > baseInOut.out) {
					// clip extends clip both in front and back
					baseInOut.out = thisInOut.out;
					someThingChanged = true;
					data[i].occurences.splice(j, 1);
					j--;
					console.log('thisInOut.out > baseInOut.out', baseInOut, thisInOut);
					continue;
				}
			} else if (thisInOut.in <= baseInOut.out + 1) {
				// clips starts inside the baseclip
				if (thisInOut.out <= baseInOut.out) {
					// clip is contained => remove
					data[i].occurences.splice(j, 1);
					j--;
					console.log('thisInOut.in < baseInOut.out', baseInOut, thisInOut);
					continue;
				} else if (thisInOut.out > baseInOut.out) {
					// clip extends clip to the back
					baseInOut.out = thisInOut.out;
					someThingChanged = true;
					data[i].occurences.splice(j, 1);
					j--;
					console.log('thisInOut.out > baseInOut.out', baseInOut, thisInOut);
					continue;
				}
			} else if (thisInOut.in > baseInOut.out) {
				// clip is separate in the back
			}
		}
	}
	return someThingChanged;
}
