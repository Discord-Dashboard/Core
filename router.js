module.exports = (app) => {
    app.use('/authorize', require('./routes/discord')); //discord oauth2
}