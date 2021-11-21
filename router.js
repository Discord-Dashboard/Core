module.exports = (app) => {
    app.use('/discord', require('./routes/discord'));
    app.use("/", require("./routes/dashboard"));
    app.use("/", require("./routes/main"))
}