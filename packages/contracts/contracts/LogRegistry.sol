// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title LogRegistry
/// @notice 用于毕业设计“基于区块链的可信任务日志审计系统”的日志存证合约
/// @author Charlie Dai
/// @dev 设计目标是“稳定、清晰、容易讲解”，因此只保留最核心的链上存证能力，避免过度复杂：
/// 1. 支持把日志哈希、任务 ID、提交时间、提交者地址写入链上；
/// 2. 使用 AccessControl 对写入权限进行控制；
/// 3. 支持按日志编号和任务 ID 查询；
/// 4. 通过事件为后续后端服务或前端展示提供可追踪的链上凭据。
contract LogRegistry is AccessControl {
    /// @notice 允许写入日志存证记录的角色
    /// @dev 在毕业设计场景中，这个角色通常可以分配给后端服务账户或受信任的日志采集组件
    bytes32 public constant LOGGER_ROLE = keccak256("LOGGER_ROLE");

    /// @notice 单条日志链上存证记录
    /// @dev 该结构体对应论文中“链上日志摘要记录”的核心数据模型
    struct LogRecord {
        /// @notice 业务任务编号，用于把一组日志记录归属到具体任务
        string taskId;
        /// @notice 日志原文的哈希摘要，链上不保存原文，只保存摘要以降低存储成本
        bytes32 logHash;
        /// @notice 记录写入区块链时的区块时间戳
        uint256 createdAt;
        /// @notice 实际执行写入操作的钱包地址
        address submitter;
    }

    /// @notice 所有日志存证记录，数组下标即日志编号 recordId
    LogRecord[] private records;

    /// @notice 任务 ID 到日志编号列表的映射
    /// @dev 这样可以通过任务 ID 反向定位该任务下的所有链上日志记录
    mapping(string => uint256[]) private taskIdToRecordIds;

    /// @notice 当一条新日志成功写入链上时触发该事件
    /// @param recordId 新记录的编号
    /// @param taskId 任务编号
    /// @param logHash 日志哈希摘要
    /// @param submitter 提交者地址
    /// @param createdAt 写入链上的时间戳
    event LogStored(
        uint256 indexed recordId,
        string indexed taskId,
        bytes32 indexed logHash,
        address submitter,
        uint256 createdAt
    );

    /// @notice 初始化合约并设置默认管理员与初始日志写入角色
    /// @param admin 默认管理员地址，拥有授予和撤销角色的权限
    /// @param logger 初始日志写入账户地址，部署后即可直接用于写入日志存证
    constructor(address admin, address logger) {
        require(admin != address(0), "admin is required");
        require(logger != address(0), "logger is required");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(LOGGER_ROLE, logger);
    }

    /// @notice 写入一条日志哈希存证记录
    /// @dev 只有拥有 LOGGER_ROLE 的地址才允许调用该函数，避免任意地址随意写入污染链上数据
    /// @param taskId 业务任务编号
    /// @param logHash 日志原文计算得到的哈希值
    /// @return recordId 新写入记录的编号
    function storeLog(
        string calldata taskId,
        bytes32 logHash
    ) external onlyRole(LOGGER_ROLE) returns (uint256 recordId) {
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

        taskIdToRecordIds[taskId].push(recordId);

        emit LogStored(recordId, taskId, logHash, msg.sender, block.timestamp);
    }

    /// @notice 根据日志编号查询单条链上记录
    /// @param recordId 日志编号
    /// @return 对应的日志记录结构体
    function getLog(uint256 recordId) external view returns (LogRecord memory) {
        require(recordId < records.length, "record does not exist");
        return records[recordId];
    }

    /// @notice 根据任务 ID 查询其对应的全部日志编号
    /// @param taskId 业务任务编号
    /// @return 该任务下所有链上日志的编号列表
    function getRecordIdsByTaskId(string calldata taskId) external view returns (uint256[] memory) {
        require(bytes(taskId).length > 0, "taskId is required");
        return taskIdToRecordIds[taskId];
    }

    /// @notice 根据任务 ID 查询其对应的全部日志记录
    /// @dev 为了便于后端或前端直接读取展示，这里返回完整记录数组，而不是只返回编号
    /// @param taskId 业务任务编号
    /// @return result 该任务下的所有日志记录
    function getLogsByTaskId(string calldata taskId) external view returns (LogRecord[] memory result) {
        require(bytes(taskId).length > 0, "taskId is required");

        uint256[] storage recordIds = taskIdToRecordIds[taskId];
        result = new LogRecord[](recordIds.length);

        for (uint256 i = 0; i < recordIds.length; i++) {
            result[i] = records[recordIds[i]];
        }
    }

    /// @notice 返回指定任务下的日志数量
    /// @param taskId 业务任务编号
    /// @return 该任务下当前已有的日志数量
    function getTaskLogCount(string calldata taskId) external view returns (uint256) {
        require(bytes(taskId).length > 0, "taskId is required");
        return taskIdToRecordIds[taskId].length;
    }

    /// @notice 返回当前链上日志存证总数
    /// @return 当前全部记录数量
    function getLogCount() external view returns (uint256) {
        return records.length;
    }
}