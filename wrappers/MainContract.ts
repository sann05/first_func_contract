import {
  Contract,
  Cell,
  Address,
  beginCell,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
  StateInit,
} from "@ton/core";

export type MainContractConfig = {
  balance: number;
  mostRecentSender: Address;
  ownerAddress: Address;
};

export function mainContractConfigToCell(config: MainContractConfig): Cell {
  return beginCell()
    .storeInt(config.balance, 32)
    .storeAddress(config.mostRecentSender)
    .storeAddress(config.ownerAddress)
    .endCell();
}

export class MainContract implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) {}

  static createFromConfig(
    config: MainContractConfig,
    code: Cell,
    workchain: number = 0
  ) {
    const data = mainContractConfigToCell(config);
    const init = { code, data };
    const address = contractAddress(workchain, init);

    return new MainContract(address, init);
  }

  async sendIncrement(
    provider: ContractProvider,
    sender: Sender,
    value: bigint,
    incrementBy: number
  ) {
    const messageBody = beginCell()
      .storeUint(1, 32) // mode: increment
      .storeUint(incrementBy, 32) // increment by
      .endCell();
    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: messageBody,
    });
  }

  async sendIncorrectDeposit(
    provider: ContractProvider,
    sender: Sender,
    value: bigint
  ) {
    const messageBody = beginCell().endCell();
    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: messageBody,
    });
  }

  async sendDeposit(provider: ContractProvider, sender: Sender, value: bigint) {
    const messageBody = beginCell().storeUint(2, 32).endCell();
    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: messageBody,
    });
  }

  async sendWithdraw(
    provider: ContractProvider,
    sender: Sender,
    withdrawAmount: bigint,
    value: bigint
  ) {
    const messageBody = beginCell()
      .storeUint(3, 32) // mode: withdrawal
      .storeCoins(withdrawAmount)
      .endCell();
    await provider.internal(sender, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: messageBody,
    });
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().storeUint(2, 32).endCell(),
    });
  }

  async getBalance(provider: ContractProvider) {
    const { stack } = await provider.get("balance", []);
    return stack.readNumber();
  }

  async getData(provider: ContractProvider) {
    const { stack } = await provider.get("get_contract_storage_data", []);
    return {
      counter: stack.readNumber(),
      mostRecentSender: stack.readAddress(),
      ownerAddress: stack.readAddress(),
    };
  }

  async getDataFromUnknownMethod(provider: ContractProvider) {
    const { stack } = await provider.get("unknown_method", []);
    return stack;
  }
}
