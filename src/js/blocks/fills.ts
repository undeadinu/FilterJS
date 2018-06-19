import glob = require('./../global.js');

var fillColor = <BlockTemplate>{
    nameLoc: 'blocks.generators.fillColor.name',
    name: 'Color Fill',
    noPreview: true,
    inputs: [{
        key: 'color',
        type: 'color',
        name: 'Color',
        nameLoc: 'blocks.generators.fillColor.inputColor'
    }],
    outputs: [{
        key: 'image',
        type: 'canvas',
        name: 'Image',
        nameLoc: 'blocks.generators.fillColor.outputImage'
    }],
    exec(inputs) {
        return new Promise((resolve, reject) => {
            var canvas = document.createElement('canvas');
            canvas.width = glob.width;
            canvas.height = glob.height;
            var cx = canvas.getContext('2d');
            cx.fillStyle = inputs.color;
            cx.fillRect(0, 0, glob.width, glob.height);
            resolve({
                image: canvas
            });
        });
    }
};

module.exports = {fillColor};
