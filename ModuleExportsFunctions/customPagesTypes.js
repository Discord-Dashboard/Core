module.exports = {
    redirectToUrl: (endpoint, getDataFunction) => {
        return {
            type: "redirect",
            endpoint: endpoint,
            getEndpoint: getDataFunction,
        }
    },
    renderHtml: (endpoint, getDataFunction) => {
        return {
            type: "html",
            endpoint: endpoint,
            getHtml: getDataFunction,
        }
    },
    sendJson: (endpoint, getDataFunction) => {
        return {
            type: "json",
            endpoint: endpoint,
            getJson: getDataFunction,
        }
    },
}
