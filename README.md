## Quick start

* terminal 1 `cd packages/api && docker-compose -f deploy/docker-compose.yml -f deploy/docker-compose.dev.yml --project-directory . up --build`, open `http://0.0.0.0:8000/api/docs` in browser
* ternimal 2 `foundryup` then `anvil`
* check that `networks.default="anvil"` in packages/hardhat/hardhat.config.js
* terminal 3: `pnpm install`, then `REPORT_GAS=true pnpm test -- --network anvil --grep "SkyNft"`
* terminal 4: `pnpm deploy:contracts`, `pnpm start`, open `http://localhost:3000` in browser

## Credits, Open-source licenses:

* Scaffold-ETH 2 https://github.com/scaffold-eth/scaffold-eth-2 library/dapp template, MIT License, Copyright (c) 2023 BuidlGuidl
* Hardhat template https://github.com/paulrberg/hardhat-template MIT License, Copyright (c) 2023 Paul Razvan Berg
* fastapi_template https://github.com/s3rius/FastAPI-template MIT License, Copyright (c) 2022 Pavel Kirilin
* ...
