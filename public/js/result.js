// init the variables
var longestTL;
var longestTLIndex = 0;
var fps;
var clipAssetMaster = [];
var clipsJSON = {};
var clipsArray = [];

var occurencesJSON = {};

var spacerFrames = true;
var buffer = 25;

var nameForExport = 'ForGrading';

// get the data
// $('#result').append('Test bitch');
$.get('/api/result', function (ret) {
	// check if files were uploaded
	console.log('Return from /api/result', ret);

	var timeLines = ret.data;
	if (timeLines.length == 0) {
		$('#warning').append('<h2>please upload a timeline</h2>');
		return;
	}

	longestTLIndex = findLongestTimeline(timeLines);
	longestTL = timeLines[longestTLIndex];
	// console.log('First TL', ret.data[0]);

	// check the data type of the files
	if (timeLines[0]._doctype != 'xmeml') {
		$('#warning').append('<h2>currently only Final Cut Pro 7 XMLs are supported.</h2>');
		$('#warning').append('<a href="/">return</A>');
		return;
	}

	// check if a name was given, if not assign one
	if (ret.fileName != '') {
		nameForExport = ret.fileName;
	} else {
		nameForExport = 'VFX';
	}

	// chack if there should be space between the clips
	if (!ret.spacerFrames) {
		buffer = 0;
		// console.log('No space');
	} else {
		buffer = 25;
		// console.log('25f for the queen');
	}

	// determine the base fps and if all timelines adhere to that
	fps = getFps(timeLines[0]);
	for (i = 0; i < timeLines.length; i++) {
		if (getFps(timeLines[i]) != fps) {
			$('#warning').append('<h2>Timelines have mismatching fps</h2>');
		}
	}

	// display the basic table
	for (i = 0; i < timeLines.length; i++) {
		var tl = timeLines[i];
		var comment = '';
		if (i == longestTLIndex) {
			comment = 'longest timeline';
		}
		// console.log(i, ret.data.length, getTimeLineName(tl));
		$('#versionTable > tbody:last-child').append(
			'<tr><td class="column1">' +
				getTimeLineName(tl) +
				'</td><td class="column2">' +
				printSecFromFrames(getTLDuration(tl)) +
				'</td><td class="column4">' +
				getVideoDimensions(tl) +
				'</td><td class="column5">' +
				comment +
				'</td></tr > '
		);
	}

	var tempTLs = timeLines;
	tempTLs.sort(function (a, b) {
		// console.log('a', a, getTLDuration(a), getTLDuration(b));
		return getTLDuration(a) - getTLDuration(b);
	});

	timeLines.forEach((element) => {
		getAssetClips(element);
	});

	console.log('Scan complete');

	// sort all occurences
	clipsArray.forEach((clip, index, none) => {
		clip.occurences.sort(function (a, b) {
			return a.in - b.in;
		});
	});

	createMasterTimeLine();
	// tryMergeClips(clipsArray);
	// findLongestTimeline(ret.data);
	// createLineLine();
});

function findLongestTimeline (timelineArray) {
	var longestTC = getTLDuration(timelineArray[0]);
	var indexOfLongestTL = 0;

	timelineArray.forEach((tl, index) => {
		if (getTLDuration(tl) > longestTC) {
			longestTC = getTLDuration(tl);
			indexOfLongestTL = index;
		}
	});
	// longestTL = timelineArray[longestTLIndex];

	return indexOfLongestTL;
	// for (i = 0; i < timelineArray.length; i++) {
	// 	const tc2 = getTLDuration(timelineArray[i]);
	// 	if (durationIsLonger(tc2, longestTC)) {
	// 		longestTC = tc2;
	// 		longestTLIndex = i;
	// 	}
	// }
	// longestTL = timelineArray[longestTLIndex];
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
		// console.log(lengthTC1 + ' is longer than ' + lengthTC2);
		return true;
	} else {
		// console.log(lengthTC2 + ' is longer than ' + lengthTC1);
		return false;
	}
}

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
		var durationFrames = parseInt(tl.xmeml.sequence.duration._text);
		// var duration = xmemlFramesToTC(durationFrames, getFps(tl));
		return durationFrames;
	}
}

function getAssetClips (tl) {
	console.log('Getting the clips');

	// var filesInTL = [];

	if (tl._doctype == 'fcpxml') {
		// console.log('File is fcpxml');
		var assetClip = 'asset-clip';
		var ac = tl.fcpxml.library.event.project.sequence.spine['asset-clip'];
		return ac;
	} else if (tl._doctype == 'xmeml') {
		console.log('Sequence:', tl.xmeml.sequence.name._text);
		var tracks = tl.xmeml.sequence.media.video.track;

		console.log('Tracks inside getAssetClips', tracks);

		// go through all tracks
		tracks.forEach((thisTrack, index) => {
			console.log('Track', index);
			if (!thisTrack.hasOwnProperty('clipitem') || thisTrack.clipitem.length == 0) {
				console.log('this track has no clips or the number of clipitims is 0');
				return;
			}

			if (!Array.isArray(thisTrack['clipitem'])) {
				console.log('Item is an object not an array', thisTrack.clipitem);
				var temp = thisTrack['clipitem'];
				thisTrack['clipitem'] = [ temp ];
				console.log('Fixed', temp);
			}

			thisTrack.clipitem.forEach((thisClipItem) => {
				// console.log('thisClipItem', thisClipItem.name);
				if (!thisClipItem.hasOwnProperty('name')) {
					console.log('Clipitem has no name', thisClipItem);
					return;
				}
				if (!occurencesJSON.hasOwnProperty(thisClipItem.name._text)) {
					occurencesJSON[thisClipItem.name._text] = {
						clipInfo: thisClipItem,
						occurences: [
							{
								in: parseInt(thisClipItem.in._text),
								out: parseInt(thisClipItem.out._text)
							}
						]
					};
				} else {
					// if there are already occurences!
					var io1 = {
						in: parseInt(thisClipItem.in._text),
						out: parseInt(thisClipItem.out._text)
					};
					var addThis = false;

					// cycle through them and compare / merge
					occurencesJSON[thisClipItem.name._text].occurences.forEach((thisIO) => {
						if (io1.in == thisIO.in && io1.out == thisIO.out) {
							addThis = false;
							return;
						} else if (
							(io1.in < thisIO.in && io1.out < thisIO.in) ||
							(io1.in > thisIO.out && io1.out > thisIO.out)
						) {
							// make two separate clips
							addThis = true;
						} else if (io1.in < thisIO.in && io1.out <= thisIO.out) {
							// merge them with in
							io1.in = thisIO.in;
						} else if (io1.in <= thisIO.in && io1.out > thisIO.out) {
							// merge them with in and out
							io1.in = thisIO.in;
							io1.out = thisIO.out;
						} else if (io1.in < thisIO.out && io1.out <= thisIO.out) {
							// ignore
						} else if (io1.in <= thisIO.out && io1.out > thisIO.out) {
							// merge with out
							io1.out = thisIO.out;
						}
					});
					if (addThis) {
						var indexForSplice = 0;
						occurencesJSON[thisClipItem.name._text].occurences.forEach((thisIO, index) => {
							if (io1.in < thisIO.in) {
								indexForSplice = index;
							} else if (io1.in == thisIO.in && io1.out == thisIO.out) {
								addThis = false;
							} else {
								indexForSplice = index + 1;
							}
						});
						if (addThis) occurencesJSON[thisClipItem.name._text].occurences.splice(indexForSplice, 0, io1);

						addThis = false;
					}
				}
			});
		});

		// now you have occurencesJSON with all merged ins and outs!

		console.log('OccurencesJSON', occurencesJSON);

		// // console.log('File is xmeml');
		// var tracks = tl.xmeml.sequence.media.video.track;

		// for (i = 0; i < tracks.length; i++) {
		// 	// inside the track you find an array
		// 	if (tracks[i].hasOwnProperty('clipitem')) {
		// 		for (j = 0; j < tracks[i].clipitem.length; j++) {
		// 			var thisClip = tracks[i].clipitem[j];
		// 			// console.log(i, j, thisClip);
		// 			if (!clipsJSON.hasOwnProperty(thisClip.name._text)) {
		// 				var clip = thisClip;
		// 				clip['occurences'] = [];
		// 				clipsJSON[thisClip.name._text] = clip;
		// 			}
		// 			var inOut = {
		// 				in: thisClip.in._text,
		// 				out: thisClip.out._text
		// 			};
		// 			clipsJSON[thisClip.name._text].occurences.push(inOut);

		// 			// console.log('clip created for: ', clip.name._text);
		// 		}
		// 	}
		// }
		// // console.log(clipsJSON);
	}
	// console.log('ClipJSON', clipsJSON);
	// for (thisClip in clipsJSON) {
	// 	clipsArray.push(clipsJSON[thisClip]);
	// }
	// console.log('ClipsArray:', clipsArray);
	// return clipsArray;

	return occurencesJSON;
}

function getTimeLineName (tl) {
	if (tl._doctype == 'fcpxml') {
		// console.log('getTimeLineName: fcpxml');
		var name = tl.fcpxml.library.event._attributes.name;
		return name;
	} else if (tl._doctype == 'xmeml') {
		// console.log('getTimeLineName: xmeml');
		var name = tl.xmeml.sequence.name._text;
		return name;
	}
}

function getVideoDimensions (tl) {
	if (tl._doctype == 'fcpxml') {
		// console.log('getVideoDimensions: fcpxml');
		var temp = tl.fcpxml.resources.format._attributes;
		var dim = temp.width + 'x' + temp.height;
		return dim;
	} else if (tl._doctype == 'xmeml') {
		// console.log('getVideoDimensions: xmeml');
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

function printSecFromFrames (frames) {
	var attachment = 's';
	if (frames % fps != 0) {
		attachment = 's' + frames % fps + 'f';
	}
	return parseInt(frames / fps).toString() + attachment;
}

function tryMergeClips (data) {
	// console.log('tryMerge these:', data.length, data);
	// iterate though all clip-items

	data.forEach((element) => {
		var occsToDelete = [];
		// console.log('Looking at clip:', element.name._text, element.occurences);
		element.occurences.forEach((occ, occIndex) => {
			if (!occ.hasOwnProperty('in')) {
				// console.log('No in detected');
				return;
			}
			// console.log( 'occurence', occIndex, occ );
			var baseInOut = occ;
			// console.log('baseInOut', baseInOut);
			element.occurences.forEach((occComp, occIndex2) => {
				if (occIndex == occIndex2) {
					return;
				}

				// going through all possibilities
				// first if the compared clip starts earlier
				if (parseInt(occComp.in) < parseInt(baseInOut.in)) {
					// console.log('Case 1', occComp.in, '<', baseInOut.in);

					// test if the clip ends before, in or after the baseInOut
					// clip ends before baseInOut => no action
					if (parseInt(occComp.out) < parseInt(baseInOut.in) - 1) {
						// console.log('Case 1.1', occComp.out, '<', baseInOut.in);
						// clip ends inside the beseInOut => update baseInOut, mark occComp for deletion
					} else if (parseInt(occComp.out) < parseInt(baseInOut.out)) {
						// console.log('case 1.2', occComp.out, '<', baseInOut.out);
						baseInOut.in = occComp.in;
						occComp.out = baseInOut.out;
						if (!occsToDelete.includes(occIndex2)) {
							occsToDelete.push(occIndex2);
						}
						// clip ends after baseInOut => update baseInOut
					} else if (parseInt(occComp.out) > parseInt(baseInOut.out)) {
						// console.log('case 1.3', occComp.out, '>', baseInOut.out);
						baseInOut.in = occComp.in;
						baseInOut.out = occComp.out;
						if (!occsToDelete.includes(occIndex2)) {
							occsToDelete.push(occIndex2);
						}
					}
					// clips starts inside the other one or immediately after
				} else if (parseInt(occComp.in) <= parseInt(baseInOut.out) + 1) {
					if (parseInt(occComp.out) <= parseInt(baseInOut.out)) {
						// console.log('Case 2.1', occComp.out, '<', baseInOut.out);
						occComp.in = baseInOut.in;
						occComp.out = baseInOut.out;
						if (!occsToDelete.includes(occIndex2)) {
							occsToDelete.push(occIndex2);
						}
					} else if (parseInt(occComp.out) > parseInt(baseInOut.out)) {
						// console.log('Case 2.2', occComp.out, '>', baseInOut.out);
						baseInOut.out = occComp.out;
						occComp.in = baseInOut.in;
						if (!occsToDelete.includes(occIndex2)) {
							occsToDelete.push(occIndex2);
						}
					}

					// clips starts after the beseInOut
				} else if (parseInt(occComp.in) > parseInt(baseInOut.out) + 1) {
				}
			});
		});

		var unique = [];

		element.occurences.forEach((occurence) => {
			var addToUnique = 'TRUE';
			if (unique.length == 0) {
				unique.push(occurence);
				// console.log(occurence);
			} else {
				unique.forEach((uniqueElement) => {
					// console.log("occurence.in", parseInt(occurence.in), "uniqueElement.in", parseInt(uniqueElement.in))
					if (
						parseInt(occurence.in) != parseInt(uniqueElement.in) &&
						parseInt(occurence.out) != parseInt(uniqueElement.out)
					) {
						addToUnique = 'FALSE';
					}
				});
			}
			if (addToUnique == 'TRUE') {
				unique.push(occurence);
			}
		});

		element['uniqueOccurences'] = unique;
		console.log('done', element);
	});

	// console.log(data);
}

function createMasterTimeLine () {
	var tl = longestTL;
	var myTrack = tl.xmeml.sequence.media.video.track[0];
	console.log(tl);
	tl.xmeml._attributes.version = '4';
	tl.xmeml.sequence._attributes.id = nameForExport;
	tl.xmeml.sequence.uuid._text = '51ef83b5-aaaa-4ab1-8265-b34e8a6e7f11';
	tl.xmeml.sequence.name._text = nameForExport;
	tl.xmeml.sequence.duration = ''; // change this!
	tl.xmeml.sequence.media.video.track = []; // definitely change this!!!
	tl.xmeml.sequence.timecode.string._text = '00:00:00:00';
	tl.xmeml.sequence.timecode.frame._text = '0';
	tl.xmeml.sequence.filter.effect = {};

	myTrack.clipitem = [];
	var startTC = 0;
	var endTC = 0;
	var clipCounter = 0;

	// loop through the occurencesJSON
	// occurencesJSON;
	var clipID = 0;

	for (var prop in occurencesJSON) {
		var clip = occurencesJSON[prop];
		// console.log('ML', clip);

		clip.occurences.forEach((thisOccurence) => {
			if (clipCounter < 10) {
				clipID = 'clip_00' + clipCounter.toString();
			} else if (clipCounter < 100) {
				clipID = 'clip_0' + clipCounter.toString();
			} else {
				clipID = 'clip_' + clipCounter.toString();
			}

			endTC = startTC + (thisOccurence.out - thisOccurence.in);
			var newClip = {
				_attributes: { id: clipID },
				masterclipid: { _text: clipID },
				name: { _text: clip.clipInfo.name._text },
				enabled: { _text: 'TRUE' },
				duration: { _text: clip.clipInfo.duration._text },
				rate: clip.clipInfo.rate,
				start: { _text: startTC.toString() },
				end: { _text: endTC.toString() },
				in: { _text: thisOccurence.in.toString() },
				out: { _text: thisOccurence.out.toString() },
				file: clip.clipInfo.file,
				filter: {},
				labels: { label2: 'VFX' }
			};
			myTrack.clipitem.push(newClip);
			clipCounter++;
			startTC = endTC + buffer;
		});
		// loop through the array of occurences
		// create basic clip for each
	}

	tl.xmeml.sequence.media.video.track.push(myTrack);
	tl.xmeml.sequence.duration = endTC.toString();
	console.log('This is your timeline', tl);

	createFile(tl);
}

function createLineLine () {
	var tl = longestTL;
	var myTrack = tl.xmeml.sequence.media.video.track[0];
	console.log(tl);
	tl.xmeml._attributes.version = '4';
	tl.xmeml.sequence._attributes.id = nameForExport;
	tl.xmeml.sequence.uuid._text = '51ef83b5-aaaa-4ab1-8265-b34e8a6e7f11';
	tl.xmeml.sequence.name._text = nameForExport;
	tl.xmeml.sequence.duration = ''; // change this!
	tl.xmeml.sequence.media.video.track = []; // definitely change this!!!
	tl.xmeml.sequence.timecode.string._text = '00:00:00:00';
	tl.xmeml.sequence.timecode.frame._text = '0';
	tl.xmeml.sequence.filter.effect = {};

	// var myTrack = tl.xmeml.sequence.media.video.track[ 0 ];
	myTrack.clipitem = [];
	var startTC = 0;
	var endTC = 0;
	var clipCounter = 0;

	clipsArray.forEach((clip, index) => {
		clip.uniqueOccurences.forEach((occurence) => {
			var leadingZeros = '000';
			endTC = startTC + (occurence.out - occurence.in);
			if (clipCounter > 9 && clipCounter < 100) {
				leadingZeros = '00';
			} else if (clipCounter > 99) {
				leadingZeros = '0';
			}

			var clipID = 'shot_' + leadingZeros + clipCounter.toString();
			var newClip = {
				_attributes: { id: clipID },
				masterclipid: { _text: clipID },
				name: { _text: clip.name._text },
				enabled: { _text: 'TRUE' },
				duration: { _text: clip.duration._text },
				rate: clip.rate,
				start: { _text: startTC.toString() },
				end: { _text: endTC.toString() },
				in: { _text: occurence.in.toString() },
				out: { _text: occurence.out.toString() },
				file: clip.file,
				filter: {},
				labels: { label2: 'VFX' }
			};
			myTrack.clipitem.push(newClip);
			clipCounter++;
			startTC = endTC + buffer;
		});
	});
	tl.xmeml.sequence.media.video.track.push(myTrack);
	tl.xmeml.sequence.duration = endTC.toString();
	console.log('copy', tl);

	createFile(tl);
}

function createFile (tl) {
	var dat = JSON.stringify(tl);

	$.ajax({
		url: '/internalupload',
		data: dat,
		cache: false,
		contentType: 'application/json',
		processData: false,
		type: 'POST',
		success: function (data, textStatus, jqXHR) {
			// Callback code
			console.log('data', data);
			if (data.file != '') {
				$('#fileForDownload').append(
					'<h2>Download <a href="/download/' + data.file + '" download>' + data.file + '</a></h2>'
				);
			}
		}
	});
}

function countUniqueOccurences () {
	var count = 0;
	clipsArray.forEach((clip) => {
		clip.uniqueOccurences.forEach((occ) => {
			count++;
			// console.log(clip.name._text, clip.uniqueOccurences.length);
		});
	});
	console.log('total: ', count);
	console.log(clipsArray);
}
