const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

// Delete the build folder
const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);

// Read the Inheritance.sol file
const inheritancePath = path.resolve(__dirname, 'contracts', 'Inheritance.sol');
const inheritanceSource = fs.readFileSync(inheritancePath, 'utf8');

// Read the InheritanceDeed.sol file
const inheritanceDeedPath = path.resolve(__dirname, 'contracts', 'InheritanceDeed.sol');
const inheritanceDeedSource = fs.readFileSync(inheritanceDeedPath, 'utf8');

// Read the TestToken.sol file
const usdcDeedPath = path.resolve(__dirname, 'contracts', 'TestToken.sol');
const usdcDeedSource = fs.readFileSync(usdcDeedPath, 'utf8');

const input = {
    language: "Solidity",
    sources: {
      'Inheritance.sol': {
        content: inheritanceSource
      },
      'InheritanceDeed.sol': {
        content: inheritanceDeedSource
      },
      'TestToken.sol': {
        content: usdcDeedSource
      }
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    },
};

function findImports(relativePath) {
  //my imported sources are stored under the node_modules folder!
  const absolutePath = path.resolve(__dirname, "..", 'node_modules', relativePath); // path.resolve() will resolve the path to an absolute path. to go back one directory, use path.resolve(__dirname, '..', 'node_modules', relativePath)
  const source = fs.readFileSync(absolutePath, 'utf8');
  return { contents: source };
}

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

fs.ensureDirSync(buildPath); //Check to see if directory "build" exists, otherwise it creates it

// 4. Write output to the "build" directory
console.log(output);

// This code generates just 1 JSON file for the Inheritance and InheritanceFactory contracts.
// for (let contract in output.contracts) {
//   if (contract.startsWith('Inheritance')) {
//     fs.outputJSONSync(
//       path.resolve(buildPath, contract + '.json'), // Path to the new JSON file
//       output.contracts[contract][Object.keys(output.contracts[contract])[0]] // Object.keys(output.contracts[contract]) returns an array of the keys of the object. We want the first key of the object, which is the contract name. The whole line returns an object containing the bytecode and ABI for the compiled contract.
//     );
//   }
// }

// This code generates JSON files for all the contracts in the "contracts" folder. Including Inheritance and InheritanceFactory. But it also generates JSON files for the contracts imported by Inheritance and InheritanceFactory.
for (let contractFileName in output.contracts) {
  for (let contractName in output.contracts[contractFileName]) {
    const contract = output.contracts[contractFileName][contractName];
    const filename = contractName + '.json';
    const outputPath = path.resolve(buildPath, filename);
    fs.outputJSONSync(outputPath, contract);
  }
}

// fs.outputJSONSync(path.resolve(buildPath, 'Inheritance.json'), output.contracts['Inheritance.sol']['Inheritance']);
// fs.outputJSONSync(path.resolve(buildPath, 'InheritanceFactory.json'), output.contracts['Inheritance.sol']['InheritanceFactory']);
// fs.outputJSONSync(path.resolve(buildPath, 'TitleDeed.json'), output.contracts['InheritanceDeed.sol']['TitleDeed']);

console.log("Contracts compiled successfully!");