function init() {
  let button = document.getElementById("btn");
  button.addEventListener("click", handleClick);
}

function handleClick(ev) {
  console.log("button clicked");
  ev.target.textContent = "Diagnosing";
  searchKeywords();
}

function searchKeywords() {
  document.querySelectorAll("img").forEach((img) => console.log(img.src));
}

document.addEventListener("DOMContentLoaded", init);
