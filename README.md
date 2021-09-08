# CoFiX User Interface

## Introduction

This repository is the CoFiX Dapp for users.

### What is CoFix?

CoFiX is the first innovative product in the CoFi field, and it is a DEX based on the NEST oracle.

- Website: [cofix.tech](https://cofix.tech)
- Details about the protocol can be found in the [English whitePaper](https://github.com/Computable-Finance/Doc/blob/master/CoFiX%20White%20Paper%20EN.pdf) or [中文白皮书](https://github.com/Computable-Finance/Doc/blob/master/CoFiX%20White%20Paper%20EN.pdf)
- For more documentation, check [Computable-Finance/Doc](https://github.com/Computable-Finance/Doc)
- Twitter: [@CoFiXProtocol](https://twitter.com/CoFiXProtocol)
- Telegram: [@CoFixProtocol](https://t.co/QcpQcmDmXj?amp=1)

## How to Deploy and Test the CoFiX User Interface?

1. Clone the project
```shell
git clone https://github.com/Computable-Finance/CoFiX-Web-User-Interface
```

2. Install dependencies
- Run ```yarn``` in the root of the project
- Run ```yarn start``` to start the project

3. Run Dapp with Docker(option)
- Install [Docker](https://www.docker.com/products/docker-desktop)
- Run ```yarn build```
- Run ```docker build -t cofix .``` in the root of the project
- Run ```docker run -d -p 80:80 cofix``` to start your project on ```localhost:80```
