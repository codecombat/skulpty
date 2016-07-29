module.exports = {
	context: __dirname,
	output: {
		library: 'filbert',
		libraryTarget: 'umd',
		filename: 'skulpty.js',
		path: './build'
	},
	entry: './src/index.js'	
};