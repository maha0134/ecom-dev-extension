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
    const tags = [];

    for (const element of document.body.querySelectorAll("*")) {
      getHeaders(element, headers);
      checkDeprecatedTags(element, tags);
    }

    checkHeaderStructure(headers);
  }

  function getHeaders(element, headers) {
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

  function checkHeaderStructure(headers) {
    // Check for none or multiple H1 headers
    console.log(headers);
    if (!headers["H1"]) {
      console.log("WARNING: You do not have an H1 header defined!");
    } else {
      if (headers["H1"] > 1) {
        console.log(
          `WARNING: You have multiple H1 headers defined (${headers["H1"]} total)`
        );
      }
    }

    // Check for gaps in header structure
    // const headerKeys = Object.keys(headers);
    const headerTags = ["H1", "H2", "H3", "H4", "H5", "H6"];

    let gapStartTag;
    let gap = 0;

    headerTags.forEach((tag, index) => {
      const count = headers[tag];
      console.log(count);

      if (!count) {
        gapStartTag = headerTags[index - 1];
        gap++;
      } else if (count && gap >= 1) {
        console.log("HEADER CONTINUITY ISSUE IDENTIFIED");
        console.log(`Gap between ${gapStartTag} and ${tag}`);
        gap = 0;
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

  function checkDeprecatedTags(element, tags) {
    const deprecatedTags = {
      ACRONYM:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/acronym",
      APPLET:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/applet",
      BGSOUND:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/bgsound",
      BIG: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/big",
      BLINK: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/blink",
      CENTER:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/center",
      CONTENT:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/content",
      DIR: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dir",
      FONT: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/font",
      FRAME: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frame",
      FRAMESET:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/frameset",
      IMAGE: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/image",
      KEYGEN:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/keygen",
      MARQUEE:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/marquee",
      MENUITEM:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/menuitem",
      NOBR: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/nobr",
      NOEMBED:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noembed",
      NOFRAMES:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/noframes",
      PARAM: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/param",
      PLAINTEXT:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/plaintext",
      RB: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rb",
      RTC: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/rtc",
      SHADOW:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/shadow",
      SPACER:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/spacer",
      STRIKE:
        "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/strike",
      TT: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/tt",
      XMP: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/xmp",
    };

    if (deprecatedTags[element.tagName]) {
      console.log(`FOUND DEPRECATED HTML ELEMENT: ${element.tagName}`);
      console.log(`Link to docs: ${deprecatedTags[element.tagName]}`);
      tags.push(element);
    }
  }
  function checkKeyword(keyword) {
    keyword = keyword.toLowerCase();
    let titleCounter = 0;
    let headingCounter = 0;
    let urlCounter = 0;

    document.querySelectorAll("title").forEach((title) => {
      if (title) {
        console.log(title.innerHTML);
        if (title.innerHTML.toLowerCase().includes(keyword)) {
          titleCounter++;
        }
      }
    });

    document.querySelectorAll("h1").forEach((heading) => {
      if (heading) {
        console.log(heading.innerHTML);
        if (heading.innerHTML.toLowerCase().includes(keyword)) {
          headingCounter++;
        }
      }
    });

    let url = window.location.href;
    console.log("url " + url);
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
}

document.addEventListener("DOMContentLoaded", init);
