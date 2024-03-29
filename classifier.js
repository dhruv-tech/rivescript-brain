const brain = require('brain.js');
const fs = require('fs');
const pos = require('pos');

let net;
let cachedClassifier = null;

class classifier {

    constructor() {
        this.trainingData = [];
    }

    add(txt, label) {
        txt = processText(txt);
        this.trainingData.push({ input: {[[txt]]: 1}, output: {[[label]]: 1}});
    }

    train(options = { iterations: 1000, erroThresh: 0.000 }) {
        net = new brain.NeuralNetwork({ hiddenLayers: [3] });
        net.train(this.trainingData, options);
        cachedClassifier = net.toFunction();
    }

    classify(txt) {
        txt = processText(txt);
        if(cachedClassifier != null) {
            let category = cachedClassifier({[[txt]]: 1});

            let highest = {}
            highest.val = category[Object.keys(category)[0]];
            highest.name = Object.keys(category)[0];
    
            for (let key in category) {
                if(category[key] > highest.val) {
                    highest.val = category[key];
                    highest.name = key;
                }
            }
            
            return highest.name;  
        } else {
            console.error("Classifier not trained to preform this operation.");
            return "#idk@classifier";
        }

    }

    save(path) {
        return new Promise((resolve, reject) => {
            const json = net.toJSON();
            fs.writeFile(path, JSON.stringify(json), (err) => {
                if(err) reject(err);
                else resolve();
            }); 
        })
    }

    restore(path) {
        return new Promise((resolve, reject) => {
            fs.readFile(path,'utf-8', (err, data) => {
                if (err) reject(err);
                else {
                    net = new brain.NeuralNetwork({ hiddenLayers: [3] });
                    net.fromJSON(JSON.parse(data));
                    cachedClassifier = net.toFunction();
                    resolve();
                }
            });
        })
    }
}

const processText = (txt) => {
    let processedtext = [];
    const tagger = new pos.Tagger();
    const tokens = txt.replace(/[^\w\s]|_/g, "").replace(/ {2,}/g, ' ').trim().toLowerCase().split(' ');

    tokens.forEach(token => {
        let tag = tagger.tag([token])[0][1];

        if(tag != 'IN' & tag != 'PRP$') {
            processedtext.push(token);
        }
    });
    return processedtext.join(' ');
}

module.exports = classifier;