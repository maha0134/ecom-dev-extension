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
  auditImages();
  auditLinks();
  traverseNodes();
  findKeywords();

  // Functions called must be in local scope of runAudit()
  function auditImages() {
    let count = 0;
    document.querySelectorAll("img").forEach((img) => {
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
        if (width >= 1920 || height >= 1920) {
          count++;
        }
      }
    });
    if (count == 1) {
      console.log(`You have a image with resolution higher than 1920`);
    } else if (count > 1) {
      console.log(`You have ${count} images with resolution higher than 1920`);
    }
  }

  function auditLinks() {
    let count = 0;
    document.querySelectorAll("a").forEach(async (link) => {
      console.log(link);
      const brokenLinks = [];
      try {
        const response = await fetch(link, {
          method: "HEAD",
          mode: "no-cors",
        });
        if (response.status < 300) {
          brokenLinks.push(link);
        }
      } catch (err) {
        count++;
        console.log(err.message);
      }
    });
    if (count == 1) {
      console.log(`You have a broken link`);
    } else if (count > 1) {
      console.log(`You have ${count} broken links`);
    }
  }

  function traverseNodes() {
    const headers = {};
    const tags = {};

    for (const element of document.body.querySelectorAll("*")) {
      checkHeaders(element, headers);
    }

    console.log(headers);
    if (!headers["H1"]) {
      console.log("WARNING: You do not have an H1 header defined!");
    }
  }

  function checkHeaders(element, headers) {
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

  function checkDeprecatedTags(element, tags) {}
}

document.addEventListener("DOMContentLoaded", init);
