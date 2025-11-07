# 部署到 Sepolia FHEVM 测试网指南

## ⚠️ 重要提示

这个项目使用 **FHEVM (Fully Homomorphic Encryption Virtual Machine)**，需要部署到 Zama 的 FHEVM Sepolia 测试网，而不是普通的 Sepolia。

## 📋 准备工作

### 1. 获取 Sepolia 测试币

访问以下水龙头获取测试 ETH：
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

**需要量**：至少 0.5 Sepolia ETH

### 2. 配置环境变量

在项目根目录运行：

```bash
npx hardhat vars set MNEMONIC
# 输入你的钱包助记词（12个单词）

npx hardhat vars set INFURA_API_KEY
# 输入你的 Infura API Key（从 https://infura.io 获取）
```

### 3. 验证钱包地址

```bash
npx hardhat vars get MNEMONIC
# 确保助记词正确

# 查看部署者地址
npx hardhat accounts --network sepolia
```

## 🚀 部署步骤

### 方法1：部署所有合约

```bash
cd D:\Cursor-Ku\demo1\pro1
npm install
npx hardhat deploy --network sepolia --tags poll
```

### 方法2：仅部署投票合约

```bash
npx hardhat deploy --network sepolia --tags EncryptedPredictionPoll
```

## 📝 部署后操作

### 1. 查看部署地址

```bash
npx hardhat poll:address --network sepolia
```

### 2. 查看投票信息

```bash
npx hardhat poll:info --network sepolia
```

### 3. 更新前端配置

部署成功后，运行：

```bash
cd frontend
npm run genabi
```

这会自动更新：
- `frontend/abi/EncryptedPredictionPollABI.ts`
- `frontend/abi/EncryptedPredictionPollAddresses.ts`

### 4. 提交并推送

```bash
git add frontend/abi/ deployments/
git commit -m "chore: update contract deployment addresses"
git push origin main
```

## ✅ 验证部署

### 在 Etherscan 查看

访问：`https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS`

### 测试合约

```bash
# 查看投票详情
npx hardhat poll:info --network sepolia

# 投票（需要测试）
npx hardhat poll:vote --network sepolia --option 0
```

## 🔧 故障排除

### 错误: Insufficient funds
**解决**：从水龙头获取更多 Sepolia ETH

### 错误: Invalid API Key
**解决**：检查 INFURA_API_KEY 是否正确设置

### 错误: Nonce too high
**解决**：重置 MetaMask 账户
- Settings → Advanced → Clear activity tab data

## 📚 相关资源

- [FHEVM 文档](https://docs.zama.ai/fhevm)
- [Hardhat Deploy](https://github.com/wighawag/hardhat-deploy)
- [Sepolia Faucet](https://sepoliafaucet.com/)

## 🆘 需要帮助？

如果遇到问题，请检查：
1. 钱包是否有足够的测试币
2. 助记词是否正确设置
3. Infura API Key 是否有效
4. 网络配置是否正确

