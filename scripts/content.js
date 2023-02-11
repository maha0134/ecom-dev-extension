function init() {
  let button = document.getElementById("btn");
  button.addEventListener("click", handleClick);
}

async function handleClick(ev) {
  ev.target.innerHTML = "Diagnosing";

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: runAudit,
  });
}

function runAudit() {
  getImages();
  traverseNodes();

  // Functions called must be in local scope of runAudit()
  function getImages() {
    console.log("loaded");
    document.querySelectorAll("img").forEach((img) => {
      console.log(img);
      if (img) {
        var width = img.naturalWidth;
        var height = img.naturalHeight;

        console.log(
          "The resolution of this image is " +
            width +
            " x " +
            height +
            " pixels."
        );
      }
    });
  }

  function traverseNodes() {
    const headers = {};

    for (const element of document.body.querySelectorAll("*")) {
      if (
        element.tagName === "H1" ||
        element.tagName === "H2" ||
        element.tagName === "H3" ||
        element.tagName === "H4" ||
        element.tagName === "H5" ||
        element.tagName === "H6"
      ) {
        if (headers[element.tagName] === undefined) {
          headers[element.tagName] = 1;
        } else {
          headers[element.tagName]++;
        }
      }
    }

    console.log(headers);
    if (!headers["H1"]) {
      console.log("WARNING: You do not have an H1 header defined!");
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
