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
      console.log(request.data.keywords);
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

  function traverseNodes() {
    const headers = {};
    const tags = {};
    const keywords = {};

    // ["then","they","them","their","this","that",""] && exceptions.test(text)
    for (const element of document.body.querySelectorAll("*")) {
      //ALL HTML elements in Body
      checkHeaders(element, headers);
      if (element.tagName !== "SCRIPT") findKeywords(element, keywords);
    }

    console.log(headers);
    console.log(keywords);
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

  function findKeywords(element, keywords) {
    const exceptions =
      /\b(from|they|then|their|this|that|those|them|will|have|shall|thou|0-9)\b/i;
    const content = element.textContent;
    if (content) {
      const wordsArray = content.split(" ");
      if (wordsArray.length > 0) {
        wordsArray.forEach((word) => {
          if (word.length > 3 && !exceptions.test(word)) {
            if (word in keywords) {
              keywords[word] += 1;
            } else {
              keywords[word] = 1;
            }
          }
        });
      }
    }
    chrome.runtime.sendMessage({
      message: "Keywords",
      data: { keywords },
    });
  }

  function checkDeprecatedTags(element, tags) {}
}

document.addEventListener("DOMContentLoaded", init);
