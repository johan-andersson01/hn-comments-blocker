const sheet = (function() {

	const style = document.createElement("style");
	style.appendChild(document.createTextNode(""));
	document.head.appendChild(style);
	return style.sheet;
})();
sheet.insertRule(".disabled { cursor: not-allowed; opacity: 0.5; }");

const hn_item_regex = new RegExp('.*://news.ycombinator.com/item.*')

const collection_to_array = (collection) => {
    return Array.prototype.slice.call(collection);
}

const is_item_href = (element) => {
    if (element.localName == "a") {
        matches = element.href.match(hn_item_regex)
        return matches && matches.length > 0
    } else if (element.childElementCount > 0) {
        return collection_to_array(element.children)
            .map(child => is_item_href(child))
            .some(x => x)
    } else {
        return false;
    }
}

const disable_href = (element) => {
    if (element.localName == "a" && element.style.display != "none") {
        const replacement = document.createElement('span')
        replacement.classList.add('disabled')
        replacement.innerHTML = element.innerHTML
        replacement.setAttribute("href", element.href)
        element.parentNode.insertBefore(replacement, element)
        element.style.display = "none"
    } else if (element.childElementCount > 0) {
        collection_to_array(element.children).map(child => disable_href(child))
    } else {
        // throw error
    }
}


const is_url_visited = (link_to_comments) => {
    info_row = link_to_comments.closest("tr")
    item_row = info_row.previousSibling
    anchor = item_row.querySelector(".storylink")
    const isVisited = Promise.resolve(
        browser.runtime.sendMessage({
            url: anchor.href
        })
    )

    let thenIsVisited = isVisited.then((result) => { return result })
    thenIsVisited.then((result) => {
        if (!result) {
            disable_href(link_to_comments)
        } else {
            link_to_comments.style.display = "inline"
            link_to_comments.parentNode.removeChild(link_to_comments.previousSibling)
            console.log(anchor.href)
        }
    })
}

const block_unvisited_comment_sections = () => {
    console.log('do stuff')
    const subtexts = collection_to_array(document.getElementsByClassName("subtext"));
    const subtexts_children = subtexts.map(subtext => collection_to_array(subtext.children));
    const item_hrefs = subtexts_children.map(children => children.filter(child => is_item_href(child)));
    item_hrefs.map(hrefs => hrefs.map(href => is_url_visited(href)))
}

window.addEventListener('pageshow', function(event) {
    block_unvisited_comment_sections()
});
