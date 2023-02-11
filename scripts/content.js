function init() {
  let button = document.getElementById("btn");
  chrome.runtime.onMessage.addListener(function (
    request,
    sender,
    sendResponse
  ) {
    if (request.message === "Keywords") {
      let btn = document.getElementById("btn");
      btn.textContent = "Diagnostics Finished";
      document.body.append(request.data[0]);
    } else {
      console.log("no messages!");
    }
  });
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
  findKeywords();

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

  function findKeywords() {
    let textNodes = [];
    let body = document.body;
    for (let i = 0; i < body.childNodes.length; i++) {
      var childNode = body.childNodes[i];
      if (childNode.nodeType === 3) {
        textNodes.push(childNode);
      }
    }
    console.log(textNodes);
    chrome.runtime.sendMessage({
      message: "Keywords",
      data: { textNodes },
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
