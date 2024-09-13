import { compile, NetworkProvider } from "@ton/blueprint";
import { MainContract } from "../wrappers/MainContract";
import { address, toNano } from "@ton/core";

export async function run(provider: NetworkProvider) {
  const codeCell = await compile("MainContract");
  // Smart contract address: kQAYdbm4IMz9PzCi8D164t1dskUQa1T110SAfYcBxSVXG6Fq
  const myContract = MainContract.createFromConfig(
    {
      balance: 0,
      mostRecentSender: address(
        "0QBG-9N2mgNey4FWPNC7vTfc-ncrE1c9uE9ynNOJAfrKrsoL"
      ),
      ownerAddress: address("0QBG-9N2mgNey4FWPNC7vTfc-ncrE1c9uE9ynNOJAfrKrsoL"),
    },
    codeCell
  );

  const openedContract = provider.open(myContract);

  openedContract.sendDeploy(provider.sender(), toNano(0.5));

  await provider.waitForDeploy(myContract.address);
}
