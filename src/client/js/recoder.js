const startBtn = document.getElementById("startBtn");
const video = document.getElementById("preview");
import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { async } from "regenerator-runtime";

let stream;
let recoder;
let videoFile;

const files = {
  input: "recording.webm",
  output: "output.mp4",
  thumbnail: "thumbnail.jpg",
};

const downloadFile = (fileUrl, fileName) => {
  const a = document.createElement("a");
  a.href = fileUrl;
  // a.download => instead of going to the URL, download the file referred by URL.
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
};

// if we want to use async&await in frontend, we should install regeneratorRuntime!
// npm install regenerator-runtime
const init = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: {
        width: 640,
        height: 360,
      },
    });
  } catch (err) {
    console.log(err);
  }
  video.srcObject = stream;
  video.play();
};

const handleDownload = async () => {
  startBtn.removeEventListener("click", handleDownload);
  startBtn.innerText = "Transcoding...";
  startBtn.disabled = true;

  const ffmpeg = createFFmpeg({ log: true });
  await ffmpeg.load();

  // now, imagin that we are out of browser!
  // (now we are running little computer using user's resources )
  ffmpeg.FS("writeFile", files.input, await fetchFile(videoFile));

  // Make webm file to mp4 file
  // -i => get an input
  // 60 => 60 frame
  await ffmpeg.run("-i", files.input, "-r", "60", "output.mp4");

  // < making thumbnail for the video >
  // -ss => going specific part of the video
  // -frames:v & 1 => take only one screenshot of the first frame of that part
  await ffmpeg.run(
    "-i",
    files.input,
    "-ss",
    "00:00:01",
    "-frames:v",
    "1",
    files.thumbnail
  );

  // take that "output.mp4" file and process it.
  const mp4File = ffmpeg.FS("readFile", files.output);

  const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4" });

  const mp4Url = URL.createObjectURL(mp4Blob);

  downloadFile(mp4Url, "MyRecording.mp4");

  // take the "thumnail.jpg" file and process it.
  const thumbnailFile = ffmpeg.FS("readFile", files.thumbnail);

  const thumbnailBlob = new Blob([thumbnailFile.buffer], { type: "image/jpg" });

  const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

  downloadFile(thumbnailUrl, "MyThumbnail.jpg");

  // remove the file to unburden the browser.
  ffmpeg.FS("unlink", files.input);
  ffmpeg.FS("unlink", files.output);
  ffmpeg.FS("unlink", files.thumbnail);

  // remove the url to unburden the browser.
  URL.revokeObjectURL(mp4Url);
  URL.revokeObjectURL(thumbnailUrl);
  URL.revokeObjectURL(videoFile);

  startBtn.disabled = false;
  startBtn.innerText = "Record Again";
  startBtn.addEventListener("click", handleStart);
};

const handleStart = () => {
  if (!video.srcObject && video.src) {
    video.srcObject = stream;
    video.play();
  }
  startBtn.innerText = "Recording...";
  startBtn.disabled = true;
  startBtn.removeEventListener("click", handleStart);

  recoder = new MediaRecorder(stream, { mimeType: "video/webm" });

  // dataavailable event is triggered by video.stop()
  recoder.ondataavailable = (event) => {
    // Create URL only available in the browser memory.
    // And the URL is refering to the file.
    videoFile = URL.createObjectURL(event.data);
    video.srcObject = null;
    video.src = videoFile;
    video.loop = true;
    video.play();

    startBtn.innerText = "Download";
    startBtn.disabled = false;
    startBtn.addEventListener("click", handleDownload);
  };

  recoder.start();

  // stop recording after 5 seconds automatically.
  setTimeout(() => {
    recoder.stop();
  }, 3500);
};

init();

startBtn.addEventListener("click", handleStart);
