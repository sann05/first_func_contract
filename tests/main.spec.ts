import { Cell, toNano } from "@ton/core";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { MainContract } from "../wrappers/MainContract";
import "@ton/test-utils";
import { compile } from "@ton/blueprint";

describe("main.fc contract tests", () => {
  let blockchain: Blockchain;
  let myContract: SandboxContract<MainContract>;
  let initWallet: SandboxContract<TreasuryContract>;
  let ownerWallet: SandboxContract<TreasuryContract>;
  let codeCell: Cell;

  beforeAll(async () => {
    codeCell = await compile("MainContract");
  });

  beforeEach(async () => {
    blockchain = await Blockchain.create();
    initWallet = await blockchain.treasury("initWallet");
    ownerWallet = await blockchain.treasury("ownerWallet");

    myContract = blockchain.openContract(
      await MainContract.createFromConfig(
        {
          balance: 0,
          mostRecentSender: initWallet.address,
          ownerAddress: ownerWallet.address,
        },
        codeCell
      )
    );
  });

  it("should get the proper the most recent sender address", async () => {
    const senderWallet = await blockchain.treasury("sender");

    const sendMessageResult = await myContract.sendIncrement(
      senderWallet.getSender(),
      toNano("5"),
      1
    );

    expect(sendMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const data = await myContract.getData();

    expect(data.mostRecentSender.toString()).toEqual(
      senderWallet.address.toString()
    );
  });

  it("successfully deposits funds", async () => {
    const sendMessageResult = await myContract.sendDeposit(
      initWallet.getSender(),
      toNano("5")
    );
    expect(sendMessageResult.transactions).toHaveTransaction({
      from: initWallet.address,
      to: myContract.address,
      success: true,
    });

    const balance = await myContract.getBalance();

    expect(balance).toBeGreaterThan(Number(toNano("4.99")));
  });

  it("should not change last sender address as deposit shouldn't count", async () => {
    const senderWallet = await blockchain.treasury("sender");

    const sendMessageResult = await myContract.sendDeposit(
      senderWallet.getSender(),
      toNano("5")
    );

    expect(sendMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: true,
    });

    const data = await myContract.getData();

    expect(data.mostRecentSender.toString()).toEqual(
      // initWallet is the most recent sender as
      // deposit doesn't trigger update the most recent sender
      initWallet.address.toString()
    );
  });

  it("should return deposit funds as no command is sent", async () => {
    const senderWallet = await blockchain.treasury("sender");

    const sendMessageResult = await myContract.sendIncorrectDeposit(
      senderWallet.getSender(),
      toNano("5")
    );

    expect(sendMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      success: false,
    });

    const balance = await myContract.getBalance();

    expect(balance).toEqual(0);
  });

  it("successfully withdraws funds on behalf of owner", async () => {
    const senderWallet = await blockchain.treasury("sender");

    await myContract.sendDeposit(senderWallet.getSender(), toNano("5"));

    const sendMessageResult = await myContract.sendWithdraw(
      ownerWallet.getSender(),
      toNano("1"), // withdraw 1 token
      toNano("0.15") // send 0.15 tokens
    );

    expect(sendMessageResult.transactions).toHaveTransaction({
      from: ownerWallet.address,
      to: myContract.address,
      success: true,
      value: toNano(0.15),
    });

    expect(sendMessageResult.transactions).toHaveTransaction({
      from: myContract.address,
      to: ownerWallet.address,
      success: true,
      value: toNano(1),
    });
  });
  it("fails to withdraw funds on behalf of non-owner", async () => {
    const senderWallet = await blockchain.treasury("sender");

    await myContract.sendDeposit(senderWallet.getSender(), toNano("5"));

    const sendMessageResult = await myContract.sendWithdraw(
      senderWallet.getSender(),
      toNano("1"), // withdraw 1 token
      toNano("0.15") // send 0.15 tokens
    );

    expect(sendMessageResult.transactions).toHaveTransaction({
      from: senderWallet.address,
      to: myContract.address,
      exitCode: 103,
      success: false,
    });
  });
  it("fails to withdraw funds because lack of balance", async () => {
    const senderWallet = await blockchain.treasury("sender");

    // await myContract.sendDeposit(senderWallet.getSender(), toNano("0.5"));

    const sendMessageResult = await myContract.sendWithdraw(
      ownerWallet.getSender(),
      toNano("1"), // withdraw 1 token
      toNano("0.15") // send 0.15 tokens
    );

    expect(sendMessageResult.transactions).toHaveTransaction({
      from: ownerWallet.address,
      to: myContract.address,
      exitCode: 104,
      success: false,
    });
  });

  it("fails to request method that doesn't defined", async () => {
    const senderWallet = await blockchain.treasury("sender");
    const sendDepositResult = await myContract.sendDeposit(
        senderWallet.getSender(),
        toNano("5")
      );
      
    try {
      const sendMessageResult = await myContract.getDataFromUnknownMethod();
    } catch (e: any) {
      expect(e.message).toEqual(
        "Unable to execute get method. Got exit_code: 11"
      );
    }
  });

  it("should get the properly increment counter in the C4 storage", async () => {
    const senderWallet = await blockchain.treasury("sender");
    const firstIncrement = 3;
    const secondIncrement = 5;

    const sendDepositResult = await myContract.sendDeposit(
        senderWallet.getSender(),
        toNano("5")
      );

    expect((await myContract.getData()).counter).toEqual(0);

    await myContract.sendIncrement(
      senderWallet.getSender(),
      toNano("5"),
      firstIncrement
    );

    expect((await myContract.getData()).counter).toEqual(firstIncrement);
    await myContract.sendIncrement(
      senderWallet.getSender(),
      toNano("5"),
      secondIncrement
    );

    expect((await myContract.getData()).counter).toEqual(
      firstIncrement + secondIncrement
    );
  });
});
