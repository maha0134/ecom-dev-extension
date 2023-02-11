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
  checkKeyword("Shopify"); //TODO: Update the function call

  // Functions called must be in local scope of runAudit()
  function auditImages() {
    let count = 0;
    let images = [];
    document.querySelectorAll("img").forEach((img) => {
      if (img) {
        var width = img.naturalWidth;
        var height = img.naturalHeight;
        if (width >= 1920 || height >= 1920) {
          count++;
          images.push(img);
        }
      }
    });
    if (count == 1) {
      console.log(`You have a image with resolution higher than 1920`);
      if (images[0].src) {
        console.log(`Here is the image source: ${images[0].src}`);
      } else if (images[0].srcset) {
        console.log(`Here is the image source: ${images[0].srcset}`);
      }
    } else if (count > 1) {
      console.log(`You have ${count} images with resolution higher than 1920`);
      console.log(`Here is the list of image sources:`);
      images.forEach((img) => {
        if (img.src) {
          console.log(img.src);
        } else if (img.srcset) {
          console.log(img.srcset.split(",")[0]);
        }
      });
    }
  }

  function auditLinks() {
    let count = 0;
    document.querySelectorAll("a").forEach(async (link) => {
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
      console.log(brokenLinks[0]);
    } else if (count > 1) {
      console.log(`You have ${count} broken links`);
      brokenLinks.forEach((brokenLink) => {
        console.log(brokenLink);
      });
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

  function checkKeyword(keyword) {
    keyword = keyword.toLowerCase();
    let titleCounter = 0;
    let headingCounter = 0;
    let urlCounter = 0;

    document.querySelectorAll("title").forEach((title) => {
      if (title) {
        if (title.innerHTML.toLowerCase().includes(keyword)) {
          titleCounter++;
        }
      }
    });

    document.querySelectorAll("h1").forEach((heading) => {
      if (heading) {
        if (heading.innerHTML.toLowerCase().includes(keyword)) {
          headingCounter++;
        }
      }
    });

    let url = window.location.href;
    if (url.indexOf(keyword) > -1) {
      urlCounter++;
    }

    if (titleCounter > 0 || headingCounter > 0 || urlCounter > 0) {
      if (titleCounter === 0) {
        console.log(`You should add the keyword "${keyword}" in <title>`);
      }
      if (headingCounter === 0) {
        console.log(`You should add the keyword "${keyword}" in <h1>`);
      }
      if (urlCounter === 0) {
        console.log(`You should add the keyword "${keyword}" in <body>`);
      }
    }

    if (titleCounter > 0 && headingCounter > 0 && urlCounter > 0) {
      console.log(`${keyword} is a strong keyword`);
    }
  }

  function checkDeprecatedTags(element, tags) {}
}

document.addEventListener("DOMContentLoaded", init);
