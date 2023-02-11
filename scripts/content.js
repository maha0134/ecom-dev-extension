function init() {
  let button = document.getElementById("btn");
  button.addEventListener("click", handleClick);
}

async function handleClick(ev) {
  ev.target.innerHTML = "Diagnosing";

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log(tab.id);
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: getImages,
  });
}

function getImages() {
  console.log("loaded");
  document.querySelectorAll("img").forEach((img) => {
    console.log(img);
    if (img) {
      var width = img.naturalWidth;
      var height = img.naturalHeight;

      console.log(
        "The resolution of this image is " + width + " x " + height + " pixels."
      );
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
