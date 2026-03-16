// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title LogRegistry
/// @notice 用于毕业设计早期阶段的最小日志存证合约
/// @dev 当前版本聚焦于“把日志哈希稳定写上链并可查询”这一最小闭环
contract LogRegistry is Ownable {
    struct LogRecord {
        string taskId;
        bytes32 logHash;
        uint256 createdAt;
        address submitter;
    }

    LogRecord[] private records;

    event LogStored(
        uint256 indexed recordId,
        string indexed taskId,
        bytes32 indexed logHash,
        address submitter,
        uint256 createdAt
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice 写入一条日志哈希记录
    /// @param taskId 业务任务编号
    /// @param logHash 日志原文计算得到的哈希值
    /// @return recordId 新写入记录的编号
    function storeLog(string calldata taskId, bytes32 logHash) external returns (uint256 recordId) {
        require(bytes(taskId).length > 0, "taskId is required");
        require(logHash != bytes32(0), "logHash is required");

        recordId = records.length;

        records.push(
            LogRecord({
                taskId: taskId,
                logHash: logHash,
                createdAt: block.timestamp,
                submitter: msg.sender
            })
        );

        emit LogStored(recordId, taskId, logHash, msg.sender, block.timestamp);
    }

    /// @notice 根据编号查询日志记录
    function getLog(uint256 recordId) external view returns (LogRecord memory) {
        require(recordId < records.length, "record does not exist");
        return records[recordId];
    }

    /// @notice 返回当前链上存证总数
    function getLogCount() external view returns (uint256) {
        return records.length;
    }
}