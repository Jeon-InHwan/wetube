import { async } from "regenerator-runtime";

const form = document.getElementById("commentForm");
const videoContainer = document.getElementById("videoContainer");
const deleteBtns = document.querySelectorAll(".video__comment-delete");
const submitBtn = document.querySelector("#addComments");
const hiddenBtn = document.getElementById("hiddenBtn");

const handleDeleteBtn = async (event) => {
  const videoId = videoContainer.dataset.video_id;
  const commentId = event.target.parentElement.dataset.comment_id;

  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ commentId: commentId }),
  });

  const status = response.status;
  // if the comment successfully updated, execute the next line.
  if (status === 201) {
    event.target.parentElement.className = "video__comment-deleted";
  }
};

const addComment = (text, newCommentId) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.dataset.comment_id = newCommentId;
  const icon = document.createElement("i");
  const span = document.createElement("span");
  const br = document.createElement("br");
  const deleteSpan = document.createElement("span");
  newComment.className = "video__comment";
  span.innerText = ` ${text}`;
  icon.className = "fas fa-comment";
  deleteSpan.innerText = "✖";
  deleteSpan.className = "video__comment-delete";
  newComment.appendChild(icon);
  newComment.appendChild(span);
  newComment.appendChild(br);
  newComment.appendChild(deleteSpan);
  deleteSpan.addEventListener("click", handleDeleteBtn);
  videoComments.prepend(newComment);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = form.querySelector("textarea");
  const text = textarea.value;
  const videoId = videoContainer.dataset.video_id;

  if (text === "") {
    return;
  }

  // server will not understand JavaScript Object!
  // server is just going to execute req.body.text.string() => "[object Object]"
  // And we can't not access to the JavaScript Object!

  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: text }),
  });

  const status = response.status;

  // if the comment successfully updated, execute the next line.
  // inside of response, we have newCommentId json!
  if (status === 201) {
    textarea.value = "";
    const json = await response.json();
    const newCommentId = json.newCommentId;
    addComment(text, newCommentId);
  }
};

const handleClick = () => {
  hiddenBtn.click();
};

const handleKeypress = (event) => {
  if (event.keyCode == 13) {
    event.preventDefault();
    hiddenBtn.click();
  }
};

if (submitBtn) {
  submitBtn.addEventListener("click", handleClick);
}

if (deleteBtns) {
  for (var i = 0; i < deleteBtns.length; i++) {
    deleteBtns[i].addEventListener("click", handleDeleteBtn);
  }
}

if (form) {
  form.addEventListener("keypress", handleKeypress);
  form.addEventListener("submit", handleSubmit);
}
