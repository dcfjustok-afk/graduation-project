import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import hre from "hardhat";

describe("LogRegistry", function () {
  async function deployFixture() {
    const { ethers } = hre;
    const [admin, logger, outsider] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("LogRegistry");
    const contract = await factory.deploy(admin.address, logger.address);
    await contract.waitForDeployment();

    return { contract, admin, logger, outsider };
  }

  it("should grant admin role and logger role correctly", async function () {
    const { contract, admin, logger } = await deployFixture();

    const adminRole = await contract.DEFAULT_ADMIN_ROLE();
    const loggerRole = await contract.LOGGER_ROLE();

    expect(await contract.hasRole(adminRole, admin.address)).to.equal(true);
    expect(await contract.hasRole(loggerRole, logger.address)).to.equal(true);
  });

  it("should allow logger role to store a log record and emit event", async function () {
    const { ethers } = hre;
    const { contract, logger } = await deployFixture();
    const taskId = "task-001";
    const logHash = ethers.keccak256(ethers.toUtf8Bytes("example log content"));

    await expect(contract.connect(logger).storeLog(taskId, logHash))
      .to.emit(contract, "LogStored")
      .withArgs(0n, taskId, logHash, logger.address, anyValue);

    const record = await contract.getLog(0);
    expect(record.taskId).to.equal(taskId);
    expect(record.logHash).to.equal(logHash);
    expect(record.submitter).to.equal(logger.address);
    expect(await contract.getLogCount()).to.equal(1n);
  });

  it("should reject callers without logger role", async function () {
    const { ethers } = hre;
    const { contract, outsider } = await deployFixture();
    const logHash = ethers.keccak256(ethers.toUtf8Bytes("example log content"));

    await expect(contract.connect(outsider).storeLog("task-001", logHash)).to.be.reverted;
  });

  it("should support querying records by task id", async function () {
    const { ethers } = hre;
    const { contract, logger } = await deployFixture();
    const taskId = "task-001";
    const firstHash = ethers.keccak256(ethers.toUtf8Bytes("first log"));
    const secondHash = ethers.keccak256(ethers.toUtf8Bytes("second log"));

    await contract.connect(logger).storeLog(taskId, firstHash);
    await contract.connect(logger).storeLog(taskId, secondHash);

    const recordIds = await contract.getRecordIdsByTaskId(taskId);
    expect(recordIds).to.deep.equal([0n, 1n]);

    const records = await contract.getLogsByTaskId(taskId);
    expect(records).to.have.lengthOf(2);
    expect(records[0].logHash).to.equal(firstHash);
    expect(records[1].logHash).to.equal(secondHash);
    expect(await contract.getTaskLogCount(taskId)).to.equal(2n);
  });

  it("should reject empty task id", async function () {
    const { ethers } = hre;
    const { contract, logger } = await deployFixture();
    const logHash = ethers.keccak256(ethers.toUtf8Bytes("example log content"));

    await expect(contract.connect(logger).storeLog("", logHash)).to.be.revertedWith("taskId is required");
  });

  it("should reject empty log hash", async function () {
    const { contract, logger } = await deployFixture();

    await expect(contract.connect(logger).storeLog("task-001", hre.ethers.ZeroHash)).to.be.revertedWith(
      "logHash is required"
    );
  });

  it("should reject query for non-existent record", async function () {
    const { contract } = await deployFixture();

    await expect(contract.getLog(0)).to.be.revertedWith("record does not exist");
  });

  it("should reject empty task id when querying by task id", async function () {
    const { contract } = await deployFixture();

    await expect(contract.getRecordIdsByTaskId("")).to.be.revertedWith("taskId is required");
    await expect(contract.getLogsByTaskId("")).to.be.revertedWith("taskId is required");
    await expect(contract.getTaskLogCount("")).to.be.revertedWith("taskId is required");
  });
});