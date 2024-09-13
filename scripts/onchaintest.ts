import { Cell, contractAddress, toNano, Address } from "@ton/core";
import { hex } from "../build/main.compiled.json";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { TonClient4 } from "ton";
import qs from "qs";
import qrcode from "qrcode-terminal";

import dotenv from "dotenv";
dotenv.config();

async function onchainTestScript() {
  const codeCell = Cell.fromBoc(Buffer.from(hex, "hex"))[0];
  const dataCell = new Cell();

  const address = contractAddress(0, {
    code: codeCell,
    data: dataCell,
  });

  const endpoint = await getHttpV4Endpoint({
    network: process.env.TESTNET ? "testnet" : "mainnet",
  });

  const client4 = new TonClient4({ endpoint });

  const latestBlock = await client4.getLastBlock();
  let status = await client4.getAccount(latestBlock.last.seqno, address);

  if (status.account.state.type !== "active") {
    console.log("Contract is not active yet");
    return;
  }

  const qsCode = qs.stringify({
    text: "simple test transaction (AS)",
    amount: toNano(0.05).toString(10),
  });

  const link = `ton://transfer/${address.toString({
    testOnly: process.env.TESTNET === "true",
  })}?${qsCode}`;

  qrcode.generate(link, { small: true }, (code) => {
    console.log(code);
  });

  let recent_sender_archive: Address;
  let contract_counter;

  setInterval(async () => {
    const latestBlock = await client4.getLastBlock();
    const { exitCode, result } = await client4.runMethod(
      latestBlock.last.seqno,
      address,
      "get_contract_storage_data"
    );

    if (exitCode !== 0) {
      console.log("Error: ", exitCode);
      return;
    }

    if (result[0].type !== "slice") {
      console.log("Unknown result type");
      return;
    }

    let cell = result[0].cell.beginParse();
    contract_counter = cell.loadInt(32);
    let most_recent_sender = cell.loadAddress();

    if (
      most_recent_sender &&
      most_recent_sender.toString() !== recent_sender_archive?.toString()
    ) {
      console.log("Contract counter: ", contract_counter);
      console.log(
        "New sender found: ",
        most_recent_sender.toString({
          testOnly: process.env.TESTNET === "true",
        })
      );
      recent_sender_archive = most_recent_sender;
    }
  }, 2000);
}

onchainTestScript();
