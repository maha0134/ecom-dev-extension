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
>>>>>>> 411d0a450f0abaa23ba7f92d475ddc9ab324ca08
}

document.addEventListener("DOMContentLoaded", init);
