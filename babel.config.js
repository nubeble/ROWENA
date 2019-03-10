module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        env: {
            development: {
                plugins: []
            },
            production: {
                plugins: ["transform-remove-console"]
            }
        }
    };
};
