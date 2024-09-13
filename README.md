# First Function Contract

Walkthrough for the course [TON & Telegram Blockchain Сourse](https://stepik.org/course/176754/)

The project contains a simple implementation of a TON smart contract using FunC and scripts to deploy and interact with the contract on the testnet.

## Table of Contents
- [Overview](#overview)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Overview
This repository implements a smart contract project using TypeScript. It demonstrates the deployment and interaction with contracts on the blockchain using scripts and test cases.

## Project Structure
- **contracts/** - Contains smart contract files.
- **build/** - Compiled contract outputs.
- **scripts/** - Scripts for deploying and interacting with contracts.
- **tests/** - Unit tests for the smart contracts.
- **temp/** - Temporary files, e.g., testnet configurations.
- **wrappers/** - JavaScript/TypeScript wrappers for contract interaction.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/sann05/first_func_contract.git
   ```
2. Install the required dependencies:
   ```bash
   yarn install
   ```

## Usage
1. Compile the contracts:
   ```bash
   yarn blueprint build
   ```
2. Deploy the contract using scripts:
   ```bash
   yarn blueprint run
   ```

## Testing
Run the unit tests using the following command:
```bash
yarn test
```

## Contributing
Feel free to open issues or submit pull requests.

## License
This project is licensed under the MIT License.
