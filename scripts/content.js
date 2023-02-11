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
    console.log("inside traverseNodes");

    for (const node in document.body.childNodes) {
      console.log(node);

      if (node.childNodes) {
        traverseNodes(node.childNodes);
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", init);
