function isUrlVisited(message, sender, response) {
    return browser.history.search({
        text: message.url,
        maxResults: 1
    }).then((results) => {
        return results.length > 0
    });
}

browser.runtime.onMessage.addListener(isUrlVisited)
