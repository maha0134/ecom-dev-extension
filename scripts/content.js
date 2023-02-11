function init() {
  let button = document.getElementById("btn");
  button.addEventListener("click", handleClick);
}

function handleClick(ev) {
  ev.target.innerHTML = "Diagnosing";
}

document.addEventListener("DOMContentLoaded", init);
