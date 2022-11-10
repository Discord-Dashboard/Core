module.exports = {
    app: ({ app, config, themeConfig }) => {
        app.get("/moduleexample", (req, res) => {
            res.send("ModuleExample: Hello World!")
        })
    },
    server: ({ io, server, config, themeConfig }) => {
        const test = io.of("/moduleexample")
        test.on("connection", () => {
            console.log("ModuleExample socket.io connected.")
        })
    },
}
