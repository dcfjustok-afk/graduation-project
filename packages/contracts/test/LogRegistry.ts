import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import hre from "hardhat";

describe("LogRegistry", function () {
  async function deployFixture() {
    const { ethers } = hre;
    const [owner, otherAccount] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("LogRegistry");
    const contract = await factory.deploy(owner.address);
    await contract.waitForDeployment();

    return { contract, owner, otherAccount };
  }

  it("should store a log record and emit event", async function () {
    const { ethers } = hre;
    const { contract, otherAccount } = await deployFixture();
    const taskId = "task-001";
    const logHash = ethers.keccak256(ethers.toUtf8Bytes("example log content"));

    await expect(contract.connect(otherAccount).storeLog(taskId, logHash))
      .to.emit(contract, "LogStored")
      .withArgs(0n, taskId, logHash, otherAccount.address, anyValue);

    const record = await contract.getLog(0);
    expect(record.taskId).to.equal(taskId);
    expect(record.logHash).to.equal(logHash);
    expect(record.submitter).to.equal(otherAccount.address);
    expect(await contract.getLogCount()).to.equal(1n);
  });

  it("should reject empty task id", async function () {
    const { ethers } = hre;
    const { contract } = await deployFixture();
    const logHash = ethers.keccak256(ethers.toUtf8Bytes("example log content"));

    await expect(contract.storeLog("", logHash)).to.be.revertedWith("taskId is required");
  });

  it("should reject query for non-existent record", async function () {
    const { contract } = await deployFixture();

    await expect(contract.getLog(0)).to.be.revertedWith("record does not exist");
  });
});