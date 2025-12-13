# SecureBallotsDAO

**Professional-grade DAO voting system with Clarity 4 support**

A secure, transparent, and feature-rich decentralized autonomous organization (DAO) voting system built on the Stacks blockchain using Clarity 4, the latest version of the Clarity smart contract language.

## 🌟 Features

### Core Voting Features
- **Weighted Voting System**: Assign different voting weights to different voters based on their roles or stake
- **Commit-Reveal Scheme**: Anonymous voting using cryptographic commitments to prevent vote manipulation
- **Time-Based Voting**: Proposals with configurable deadlines and automatic expiration
- **Vote Delegation**: Allow voters to delegate their voting power to trusted representatives
- **Proposal Categories**: Organize proposals by type (Governance, Treasury, Technical)
- **Quorum Requirements**: Configurable minimum vote thresholds for proposal passage

### Clarity 4 Features Utilized

This project leverages the following Clarity 4 features:

1. **`stacks-block-time`** - Captures timestamps for proposal creation and vote revelation, enabling precise time-based logic
2. **Enhanced Type System** - Improved error handling and data structures
3. **Native Epoch 4.0 Support** - Built specifically for Clarity version 4

### Advanced Functionality
- ✅ Proposal lifecycle management (create, delete, extend, execute)
- ✅ Batch voter operations for efficient management
- ✅ Comprehensive statistics and status reporting
- ✅ Vote commitment and revelation tracking
- ✅ Delegation system with revocation
- ✅ Owner-controlled voting periods
- ✅ Minimum quorum enforcement

## 📋 Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) v2.0+
- Node.js v18+
- npm or yarn

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SecureBallotsDAO
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Verify Clarinet installation**
   ```bash
   clarinet --version
   ```

## 🧪 Running Tests

The project includes a comprehensive test suite covering all contract functionality.

**Run all tests:**
```bash
npm test
```

**Run tests with coverage and cost analysis:**
```bash
npm run test:report
```

**Run tests in watch mode:**
```bash
npm run test:watch
```

## 📦 Project Structure

```
SecureBallotsDAO/
├── contracts/
│   └── SecureBallotsDAO.clar    # Main smart contract
├── tests/
│   └── SecureBallotsDAO.test.ts # Comprehensive test suite
├── settings/
│   └── Devnet.toml              # Devnet configuration
├── Clarinet.toml                # Clarinet project configuration
├── package.json                 # Node.js dependencies
├── vitest.config.js             # Testing configuration
└── tsconfig.json                # TypeScript configuration
```

## 📖 Contract API

### Read-Only Functions

#### `get-proposal (proposal-id uint)`
Returns proposal details for a given ID.

**Returns:** `(optional {...})`

#### `get-voter-weight (voter principal)`
Returns the voting weight of a specific voter.

**Returns:** `uint`

#### `get-proposal-status (proposal-id uint)`
Returns the current status of a proposal ("active", "passed", "failed", or "executed").

**Returns:** `(response string-ascii uint)`

#### `get-vote-statistics (proposal-id uint)`
Returns comprehensive voting statistics including vote count, quorum, and percentage.

**Returns:** `(response {...} uint)`

#### `has-voted (voter principal, proposal-id uint)`
Checks if a voter has already voted on a proposal.

**Returns:** `bool`

#### `is-valid-voter (voter principal)`
Checks if an address is a registered voter.

**Returns:** `bool`

#### `get-delegation (delegator principal)`
Returns the delegate for a given voter, if any.

**Returns:** `(optional principal)`

### Public Functions

#### Proposal Management

**`create-proposal`**
```clarity
(create-proposal 
  (title (string-ascii 256))
  (description (string-ascii 1024))
  (category uint)
  (blocks uint)
  (quorum uint))
```
Creates a new proposal. Only callable by contract owner.

**Parameters:**
- `title`: Proposal title (max 256 characters)
- `description`: Detailed description (max 1024 characters)
- `category`: 1=Governance, 2=Treasury, 3=Technical
- `blocks`: Number of blocks until expiration
- `quorum`: Minimum votes required for passage

**`delete-proposal (proposal-id uint)`**
Deletes an unexecuted proposal. Only callable by owner.

**`extend-proposal-deadline (proposal-id uint, additional-blocks uint)`**
Extends a proposal's voting period. Only callable by owner.

**`execute-proposal (proposal-id uint)`**
Marks a passed proposal as executed. Only callable by owner.

#### Voter Management

**`add-voter (voter principal)`**
Adds a single voter to the registry. Only callable by owner.

**`batch-add-voters (voters (list 50 principal))`**
Adds multiple voters at once. Only callable by owner.

**`remove-voter (voter principal)`**
Removes a voter from the registry. Only callable by owner.

**`set-voter-weight (voter principal, weight uint)`**
Sets the voting weight for a voter. Only callable by owner.

#### Voting Functions

**`commit-vote (proposal-id uint, vote-hash (buff 20))`**
Commits a vote using a cryptographic hash. Two-phase voting for privacy.

**`reveal-vote (proposal-id uint, nonce (buff 32))`**
Reveals a committed vote with the original nonce. Verifies commitment and records vote.

**`delegate-vote (delegate principal)`**
Delegates voting power to another registered voter.

**`revoke-delegation ()`**
Revokes an existing vote delegation.

#### Admin Functions

**`close-voting ()`**
Temporarily closes all voting. Only callable by owner.

**`open-voting ()`**
Reopens voting after closing. Only callable by owner.

**`set-minimum-quorum (quorum uint)`**
Sets the global minimum quorum. Only callable by owner.

## 🔒 Security Features

1. **Owner-Only Functions**: Critical functions restricted to contract owner
2. **Voter Registry**: Only pre-approved addresses can vote
3. **Commit-Reveal Scheme**: Prevents vote manipulation and front-running
4. **Duplicate Vote Prevention**: Each voter can only vote once per proposal
5. **Expiration Checks**: Automatic proposal expiration based on block height
6. **Input Validation**: Comprehensive validation of all inputs

## 🎯 Usage Example

### 1. Add Voters

```typescript
// Add multiple voters at once
const voters = [addr1, addr2, addr3];
await contract.callPublic("batch-add-voters", [Cl.list(voters)]);

// Set voting weight for important stakeholders
await contract.callPublic("set-voter-weight", [addr1, Cl.uint(5)]);
```

### 2. Create a Proposal

```typescript
await contract.callPublic("create-proposal", [
  Cl.stringAscii("Increase Treasury Budget"),
  Cl.stringAscii("Proposal to increase treasury allocation by 20%"),
  Cl.uint(2), // CATEGORY_TREASURY
  Cl.uint(1440), // ~10 days
  Cl.uint(100), // Minimum 100 votes needed
]);
```

### 3. Vote on a Proposal

```typescript
// Step 1: Commit vote
const nonce = generateRandomBytes(32);
const proposalId = 1;
const commitment = hash160(concat(nonce, proposalId));

await contract.callPublic("commit-vote", [
  Cl.uint(proposalId),
  Cl.buffer(commitment),
]);

// Step 2: Reveal vote (after commit phase)
await contract.callPublic("reveal-vote", [
  Cl.uint(proposalId),
  Cl.buffer(nonce),
]);
```

### 4. Check Proposal Status

```typescript
const status = await contract.callReadOnly("get-proposal-status", [
  Cl.uint(1),
]);

const stats = await contract.callReadOnly("get-vote-statistics", [
  Cl.uint(1),
]);
```

## 🛠️ Development

### Code Style

The codebase follows Clarity best practices:
- Descriptive function and variable names
- Comprehensive error handling
- Clear comments and documentation
- Secure-by-default design patterns

### Adding New Features

1. Update the contract in `contracts/SecureBallotsDAO.clar`
2. Add corresponding tests in `tests/SecureBallotsDAO.test.ts`
3. Run the test suite to verify
4. Update documentation

## 📊 Error Codes

| Code | Constant | Description |
|------|----------|-------------|
| u100 | ERR_NOT_AUTHORIZED | Caller not authorized for this action |
| u101 | ERR_ALREADY_VOTED | Voter has already voted on this proposal |
| u102 | ERR_INVALID_PROPOSAL | Proposal ID does not exist |
| u103 | ERR_VOTING_CLOSED | Voting is currently closed |
| u104 | ERR_INVALID_WEIGHT | Invalid voter weight (must be > 0) |
| u105 | ERR_INVALID_COMMITMENT | Vote commitment not found or invalid |
| u106 | ERR_INVALID_INPUT | Invalid input parameters |
| u107 | ERR_INVALID_VOTER | Voter not registered |
| u108 | ERR_PROPOSAL_EXPIRED | Proposal voting period has ended |
| u109 | ERR_PROPOSAL_NOT_FOUND | Proposal does not exist |
| u110 | ERR_QUORUM_NOT_MET | Proposal did not meet quorum |
| u111 | ERR_INVALID_DELEGATION | Invalid delegation parameters |
| u112 | ERR_PROPOSAL_NOT_EXPIRED | Proposal still active |

## 🔄 Clarity 4 Migration

This project has been upgraded from Clarity 3 to Clarity 4. Key changes:

### Dependency Updates
- Migrated from `@hirosystems/clarinet-sdk` to `@stacks/clarinet-sdk` v3.10.0
- Using `@stacks/transactions` v6.12.0
- Updated `vitest.config.js` to import from `vitest/config`

### Contract Changes
- Set `clarity_version = 4` and `epoch = 4.0` in `Clarinet.toml`
- Implemented `stacks-block-time` for timestamp tracking
- Enhanced error handling with new error constants

## 📄 License

ISC

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run the test suite
5. Submit a pull request

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Review the [Clarity documentation](https://docs.stacks.co/clarity)
- Check [Stacks Discord](https://discord.gg/stacks)

## 🙏 Acknowledgments

- Built with [Clarinet](https://github.com/hirosystems/clarinet)
- Powered by [Stacks Blockchain](https://www.stacks.co/)
- Clarity 4 features from [SIP-033 and SIP-034](https://github.com/stacksgov/sips)
