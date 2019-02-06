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
    }
        // return element.href regex match with *news.ycombinator.com/item*
    else if (element.childElementCount > 0) {
        return collection_to_array(element.children)
            .map(child => is_item_href(child))
            .some(x => x)
    }
    else {
        return false;
    }
}

const disable_href = (element) => {
    console.log(element)
    if (element.localName == "a") {
        const replacement = document.createElement('span')
        replacement.classList.add('disabled')
        replacement.innerHTML = element.innerHTML
        replacement.setAttribute("href", element.href)
        element.parentNode.insertBefore(replacement, element)
        element.parentNode.removeChild(element)
    }
    else if (element.childElementCount > 0) {
        collection_to_array(element.children).map(child => disable_href(child))
    }
    else {
        return
    }
}

const subtexts = collection_to_array(document.getElementsByClassName("subtext"));
console.log(subtexts);
const subtexts_children = subtexts.map(subtext => collection_to_array(subtext.children));
console.log(subtexts_children);
const item_hrefs = subtexts_children.map(children => children.filter(child => is_item_href(child)));

item_hrefs.forEach(function(arr) {
    arr.forEach(function(e) {
        disable_href(e)
    })
})
console.log(item_hrefs);

