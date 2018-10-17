module.exports = {
	context: __dirname,
	output: {
		library: 'filbert',
		libraryTarget: 'umd',
		filename: 'skulpty.js',
		path: __dirname + '/build'
	},
	entry: './src/index.js'	
};
