const newStyleSheet = () => {
	const style = document.createElement("style");
	style.appendChild(document.createTextNode(""));
	document.head.appendChild(style);
	return style.sheet;
};


const sheet = newStyleSheet();
sheet.insertRule(".disabled { cursor: not-allowed; opacity: 0.5; }");


const collectionToArray = (collection) => {
    return Array.prototype.slice.call(collection);
};


// returns true if element is an anchor with a href matching pattern or
// if element has at least one child that is an anchor with a href matching pattern
const isElementMatchingAnchor = (element, pattern) => {
    if (element.localName == "a") {
        const matches = element.href.match(pattern)
        return matches && matches.length > 0
    } else if (element.childElementCount > 0) {
        return collectionToArray(element.children)
            .map(child => isElementMatchingAnchor(child))
            .some(x => x)
    } else {
        return false;
    }
}


// hides an already visible anchor element and inserts a span replacement
const disableAnchor = (element) => {
    if (element.localName == "a" && element.style.display != "none") {
        const replacement = document.createElement("span")
        replacement.classList.add("disabled")
        replacement.innerHTML = element.innerHTML
        replacement.setAttribute("href", element.href)
        element.parentNode.insertBefore(replacement, element)
        changeDisplayStyle(element, "none")
    } else if (element.childElementCount > 0) {
        collectionToArray(element.children).map(child => disableAnchor(child))
    } else {
        // ignore non-anchor element
    } 
};


const changeDisplayStyle = (element, value) => {
    element.style.display = value
}


const assert = (condition, message) => {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message;
    }
};


// do nothing if story link matches ignorePattern
// disable comment anchor if its story link is unvisited
// remove replacement span if the story link is visited
const toggleDisabled = (linkToComments, ignorePattern) => {
    const infoRow = linkToComments.closest("tr");
    const itemRow = infoRow.previousSibling;
    const anchor = itemRow.querySelector(".storylink");
    const matches = anchor.href.match(ignorePattern);
    if (matches && matches.length > 0)
        return;
    const isVisited = Promise.resolve(
        browser.runtime.sendMessage({
            url: anchor.href
        })
    )

    let thenIsVisited = isVisited.then((result) => { return result })
    thenIsVisited.then((result) => {
        if (!result) {
            disableAnchor(linkToComments);
        } else {
            let commentAnchor = linkToComments
            if (commentAnchor.localName != "a") {
                commentAnchor = commentAnchor.querySelector("a");
            }

            changeDisplayStyle(commentAnchor, "inline");
            let replacement = linkToComments.querySelector(".disabled") 
            if (replacement == null) {
                replacement = linkToComments.parentNode.querySelector(".disabled");
            }

            if (replacement != null) {
                assert(replacement.localName == "span", "replacement is span");
                assert(replacement.classList.contains("disabled"), "replacement is disabled");
                replacement.parentNode.removeChild(replacement);
            }
        }
    })
};


const blockUnvisitedStoryComments = () => {
    const hnItemRegex = new RegExp(".*://news.ycombinator.com/item.*")
    const subtexts = collectionToArray(document.getElementsByClassName("subtext"));
    const subtextsChildren = subtexts.map(
        subtext => collectionToArray(subtext.children)
    );
    const itemHrefs = subtextsChildren.map(
        children => children.filter(
            child => isElementMatchingAnchor(child, hnItemRegex)
        )
    );
    itemHrefs.map(
        hrefs => hrefs.map(
            // ignore anchors whose story link lead to HN (e.g. Ask HN)
            href => toggleDisabled(href, hnItemRegex)
        )
    );
};


window.addEventListener("pageshow", (event) => {
    blockUnvisitedStoryComments();
});
