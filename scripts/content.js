function init() {
  const button = document.getElementById("btn");
  const backResults = document.querySelector(".back-btn");
  button.addEventListener("click", handleClick);
  backResults.addEventListener("click", backToResults);
  chrome.runtime.onMessage.addListener(handleData);
}

async function handleClick(ev) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: runAudit,
  });

  // show results screen
  document.getElementById("home").classList.add("hidden");
  document.getElementById("results").classList.remove("hidden");
}

function backToResults(ev) {
  document.getElementById("results").classList.add("hidden");
  document.getElementById("home").classList.remove("hidden");
}

async function runAudit() {
  let imageAuditData = auditImages();
  let linkAuditData = await auditLinks();
  let { auditHeaders, auditTags, auditKeywords } = traverseNodes();
  let primeKeyword = Object.keys(auditKeywords)[0];
  console.log(primeKeyword);
  let { urlCounter, headingCounter, titleCounter } = checkKeyword(primeKeyword); //TODO: Update the function call

  chrome.runtime.sendMessage({
    message: "Audit Data",
    data: {
      auditData: {
        imageAuditData,
        linkAuditData,
        auditHeaders,
        auditTags,
        auditKeywords,
        auditPrimeKeyword: {
          urlCounter,
          headingCounter,
          titleCounter,
        },
      },
    },
  });
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
    //returning data to popup
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
    return { count, images };
  }

  async function auditLinks() {
    let count = 0;
    const brokenLinks = [];
    document.querySelectorAll("a").forEach(async (link) => {
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
    setTimeout(() => {
      if (count == 1) {
        console.log(`You have a broken link`);
        console.log(brokenLinks[0]);
      } else if (count > 1) {
        console.log(`You have broken links`);

        // brokenLinks.forEach((brokenLink) => {
        //   console.log(`Broken Link: ${brokenLink}`);
        // });
      }
    }, 2000);

    return { count, brokenLinks };
  }

  function traverseNodes() {
    const headers = {};
    const tags = {
      count: 0,
      elements: [],
    };
    let keywords = {};

    for (const element of document.body.querySelectorAll("*")) {
      getHeaders(element, headers);
      checkDeprecatedTags(element, tags);
      if (
        element.tagName !== "SCRIPT" &&
        element.tagName !== "svg" &&
        element.tagName !== "g" &&
        element.tagName !== "path" &&
        element.tagName !== "polygon" &&
        element.tagName !== "use" &&
        element.tagName !== "circle" &&
        element.tagName !== "rect" &&
        element.tagName !== "polyline" &&
        element.tagName !== "line" &&
        element.tagName !== "STYLE" &&
        element.tagName !== "IMG" &&
        element.tagName !== "SOURCE" &&
        element.tagName !== "PICTURE" &&
        element.tagName !== "IFRAME" &&
        element.tagName !== "clipPath" &&
        element.tagName !== "defs" &&
        element.tagName !== "SELECT" &&
        element.tagName !== "OPTION" &&
        element.tagName !== "FORM" &&
        element.tagName !== "INPUT" &&
        element.tagName !== "TEMPLATE" &&
        element.tagName !== "title"
      ) {
        findKeywords(element, keywords);
      }
    }
    let sortedArrayOfWords = Object.entries(keywords).sort(
      (a, b) => b[1] - a[1]
    );
    sortedArrayOfWords.splice(5);
    let sortedKeywords = Object.fromEntries(sortedArrayOfWords);
    console.log(headers);
    console.log("Keywords");
    console.log(sortedKeywords);
    checkHeaderStructure(headers);
    return {
      auditHeaders: headers,
      auditTags: tags,
      auditKeywords: sortedKeywords,
    };
  }
  function checkHeaderStructure(headers) {
    // Check for none or multiple H1 headers
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

  function findKeywords(element, keywords) {
    const matches =
      /\b(?!from|they|then|their|this|that|those|them|will|have|https|http|shall|thou|These|Those|They\b)[a-zA-Z]{4,}\b/g;

    const arrayOfWords = element?.textContent?.match(matches);
    if (arrayOfWords?.length > 0) {
      arrayOfWords.forEach((word) => {
        if (word in keywords) {
          keywords[word] += 1;
        } else {
          keywords[word] = 1;
        }
      });
    }
  }

  function checkDeprecatedTags(element, tags) {
    let count = 0;
    let elements = [];
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
      tags.count++;
      console.log(`FOUND DEPRECATED HTML ELEMENT: ${element.tagName}`);
      console.log(`Link to docs: ${deprecatedTags[element.tagName]}`);
      tags.elements.push(element);
    } else {
      console.log("No deprecated tags found!");
    }
    return { count, elements };
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
    return { urlCounter, headingCounter, titleCounter };
  }
}

function handleData(request, sender, sendResponse) {
  let button = document.getElementById("btn");
  if (request.message === "Audit Data") {
    button.textContent = "Diagnostics Finished";
    let auditData = request.data.auditData;
    console.log(auditData);
    // checkHeaderStructure(auditData.auditHeaders);
    // console.log(auditData.imageAuditData.images);
    // checkImages(
    //   auditData.imageAuditData.count,
    //   auditData.imageAuditData.images
    // );
  } else {
    console.log("no messages!");
  }
}

function checkHeaderStructure(headers) {
  // Check for none or multiple H1 headers
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

// function checkImages(count, images) {
//   if (count == 1) {
//     console.log(`You have a image with resolution higher than 1920`);
//     if (images[0].src) {
//       console.log(`Here is the image source: ${images[0].src}`);
//     } else if (images[0].srcset) {
//       console.log(`Here is the image source: ${images[0].srcset}`);
//     }
//   } else if (count > 1) {
//     console.log(`You have ${count} images with resolution higher than 1920`);
//     console.log(`Here is the list of image sources:`);
//     images.forEach((img) => {
//       if (img.src) {
//         console.log(img.src);
//       } else if (img.srcset) {
//         console.log(img.srcset.split(",")[0]);
//       }
//     });
//   }
// }

document.addEventListener("DOMContentLoaded", init);
