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
    const tags = {};
    const keywords = {};

    // ["then","they","them","their","this","that",""] && exceptions.test(text)
    for (const element of document.body.querySelectorAll("*")) {
      //ALL HTML elements in Body
      checkHeaders(element, headers);
      checkDeprecatedTags(element, tags);
      if (element.tagName !== "SCRIPT") findKeywords(element, keywords);
    }

    console.log(headers);
    console.log(keywords);
    if (!headers["H1"]) {
      console.log("WARNING: You do not have an H1 header defined!");
    } else {
      if (headers["H1"] > 1) {
        console.log(
          `WARNING: You have multiple H1 headers defined (${headers["H1"]} total)`
        );
      }
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

  function checkDeprecatedTags(element, tags) {}
}

document.addEventListener("DOMContentLoaded", init);
