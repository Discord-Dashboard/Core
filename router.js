module.exports = (app) => {
    app.use('/discord', require('./routes/discord'));
}