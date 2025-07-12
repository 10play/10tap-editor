/** @type {import("@babel/core").ConfigFunction} */
module.exports = api => {
	api.cache(true)

	return {
		presets: ['babel-preset-expo'],
		plugins: [
			['babel-plugin-inline-import', { extensions: ['.html', '.svg'] }],
		],
	}
}
