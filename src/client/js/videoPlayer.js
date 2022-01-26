const video = document.querySelector("video");
const playBtn = document.getElementById("play");
const playBtnIcon = playBtn.querySelector("i");
const muteBtn = document.getElementById("mute");
const muteBtnIcon = muteBtn.querySelector("i");
const volumeRange = document.getElementById("volume");
const currentTime = document.getElementById("currentTime");
const totalTime = document.getElementById("totalTime");
const timeline = document.getElementById("timeline");
const fullScreenBtn = document.getElementById("fullScreen");
const fullScreenIcon = fullScreenBtn.querySelector("i");
const videoContainer = document.getElementById("videoContainer");
const videoControls = document.getElementById("videoControls");

// volume variables
let volumeValue = 0.8;
video.volume = volumeValue;

// time variables
let timeValue = 0;
let timeoutId = null;
let movementTimeoutId = null;

const handlePlayClick = () => {
  // if the video is playing, then pause it. else, play the video.
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
  playBtnIcon.classList = video.paused ? "fas fa-play" : "fas fa-pause";
};

const handleMute = (event) => {
  if (video.muted) {
    video.muted = false;
  } else {
    video.muted = true;
  }
  muteBtnIcon.classList = video.muted
    ? "fas fa-volume-mute"
    : "fas fa-volume-up";
  volumeRange.value = video.muted ? 0 : volumeValue;
};

const handleVolumeChange = (event) => {
  const {
    target: { value },
  } = event;
  video.volume = value;
  volumeValue = value;
  if (video.muted) {
    video.muted = false;
    muteBtnIcon.classList = "fas fa-volume-up";
  }
  if (video.volume === 0) {
    video.muted = true;
    muteBtnIcon.classList = "fas fa-volume-mute";
  } else {
    video.muted = false;
    muteBtnIcon.classList = "fas fa-volume-up";
  }
};

const handleTimelineChange = (event) => {
  const {
    target: { value },
  } = event;
  video.currentTime = value;
  timeValue = value;
};

const formatTime = (seconds) => {
  return new Date(seconds * 1000).toISOString().substring(14, 19);
};

const handleLoadedMetadata = () => {
  totalTime.innerText = formatTime(Math.floor(video.duration));
  timeline.max = Math.floor(video.duration);
  timeValue = video.currentTime;
};

const handleTimeUpdate = () => {
  currentTime.innerText = formatTime(Math.floor(video.currentTime));
  timeline.value = Math.floor(video.currentTime);
};

const handleFullscreen = () => {
  const fullscreen = document.fullscreenElement;
  if (!fullscreen) {
    videoContainer.requestFullscreen();
    fullScreenIcon.classList = "fas fa-compress";
  } else {
    document.exitFullscreen();
    fullScreenIcon.classList = "fas fa-expand";
  }
};

const hideControls = () => videoControls.classList.remove("showing");

const handleMouseMove = () => {
  // 1) if the mouse moves above the video,
  //    And if there is "class-removing timeout function", delete it.
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  // if there is "class-removing timeout function", delete it.
  if (movementTimeoutId) {
    clearTimeout(movementTimeoutId);
    movementTimeoutId = null;
  }

  // 2) if the mouse moves above the video,
  //    we add a class to videoControls div including timeline, muteBtn and so on.
  videoControls.classList.add("showing");
  // 3)
  movementTimeoutId = setTimeout(hideControls, 2000);
};

const handleMouseLeave = () => {
  timeoutId = setTimeout(() => videoControls.classList.remove("showing"), 1500);
};

const handleContainerClick = () => {
  // if the video is playing, then pause it. else, play the video.
  if (video.paused) {
    video.play();
  } else {
    video.pause();
  }
  playBtnIcon.classList = video.paused ? "fas fa-play" : "fas fa-pause";
};

const handleContainerKeyup = (event) => {
  // if user writing comment, don't stop or play the video!
  console.dir(event.target.childNodes[1].children[7].onfocus);

  if (event.keyCode == 32) {
    event.preventDefault();
    // if the video is playing, then pause it. else, play the video.
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
    playBtnIcon.classList = video.paused ? "fas fa-play" : "fas fa-pause";
  }
};

const handleEnded = () => {
  const { video_id } = videoContainer.dataset;

  fetch(`/api/videos/${video_id}/view`, {
    method: "POST",
  });
};

playBtn.addEventListener("click", handlePlayClick);
muteBtn.addEventListener("click", handleMute);
fullScreenBtn.addEventListener("click", handleFullscreen);
volumeRange.addEventListener("input", handleVolumeChange);
timeline.addEventListener("input", handleTimelineChange);

// When the video's metadata is loaded, execute handleLoadedMetadata.
video.addEventListener("loadeddata", handleLoadedMetadata);

// If there's change on the time of video, event called timeupdate will be fired.
video.addEventListener("timeupdate", handleTimeUpdate);

// events that have something to do with mouse!
videoContainer.addEventListener("mousemove", handleMouseMove);
videoContainer.addEventListener("mouseleave", handleMouseLeave);

// plus function
video.addEventListener("click", handleContainerClick);

document.addEventListener("keydown", handleContainerKeyup);

// An eventListener that listens event triggered when the video is over.
video.addEventListener("ended", handleEnded);

if (video) {
  handleLoadedMetadata();
}
