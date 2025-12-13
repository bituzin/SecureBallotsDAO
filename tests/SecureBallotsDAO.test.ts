
import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("SecureBallotsDAO Test Suite", () => {
  beforeEach(() => {
    simnet.setEpoch("4.0");
  });

  describe("Initialization", () => {
    it("ensures simnet is properly initialized", () => {
      expect(simnet.blockHeight).toBeDefined();
    });

    it("initializes with correct owner", () => {
      const proposalCount = simnet.callReadOnlyFn(
        "SecureBallotsDAO",
        "get-proposal-count",
        [],
        deployer
      );
      expect(proposalCount.result).toBeUint(0);
    });
  });

  describe("Voter Management", () => {
    it("allows owner to add voters", () => {
      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "add-voter",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents non-owner from adding voters", () => {
      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "add-voter",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR_NOT_AUTHORIZED
    });

    it("allows batch adding voters", () => {
      const voters = Cl.list([
        Cl.principal(wallet1),
        Cl.principal(wallet2),
        Cl.principal(wallet3),
      ]);

      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "batch-add-voters",
        [voters],
        deployer
      );
      expect(result).toBeOk(Cl.list([Cl.bool(true), Cl.bool(true), Cl.bool(true)]));
    });

    it("allows owner to set voter weight", () => {
      // First add voter
      simnet.callPublicFn(
        "SecureBallotsDAO",
        "add-voter",
        [Cl.principal(wallet1)],
        deployer
      );

      // Then set weight
      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "set-voter-weight",
        [Cl.principal(wallet1), Cl.uint(5)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));

      // Verify weight
      const weight = simnet.callReadOnlyFn(
        "SecureBallotsDAO",
        "get-voter-weight",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(weight.result).toBeUint(5);
    });

    it("allows owner to remove voter", () => {
      // Add voter first
      simnet.callPublicFn(
        "SecureBallotsDAO",
        "add-voter",
        [Cl.principal(wallet1)],
        deployer
      );

      // Remove voter
      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "remove-voter",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Proposal Creation", () => {
    it("allows owner to create proposal", () => {
      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "create-proposal",
        [
          Cl.stringAscii("Test Proposal"),
          Cl.stringAscii("This is a test proposal"),
          Cl.uint(1), // CATEGORY_GOVERNANCE
          Cl.uint(100), // blocks
          Cl.uint(50), // quorum
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("captures proposal with stacks-block-time (Clarity 4)", () => {
      simnet.callPublicFn(
        "SecureBallotsDAO",
        "create-proposal",
        [
          Cl.stringAscii("Time-based Proposal"),
          Cl.stringAscii("Testing Clarity 4 timestamp feature"),
          Cl.uint(2), // CATEGORY_TREASURY
          Cl.uint(200),
          Cl.uint(100),
        ],
        deployer
      );

      const proposal = simnet.callReadOnlyFn(
        "SecureBallotsDAO",
        "get-proposal",
        [Cl.uint(1)],
        deployer
      );

      expect(proposal.result).toBeSome();
    });

    it("prevents non-owner from creating proposal", () => {
      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "create-proposal",
        [
          Cl.stringAscii("Unauthorized"),
          Cl.stringAscii("This should fail"),
          Cl.uint(1),
          Cl.uint(100),
          Cl.uint(50),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(100)); // ERR_NOT_AUTHORIZED
    });

    it("allows owner to delete proposal", () => {
      // Create proposal first
      simnet.callPublicFn(
        "SecureBallotsDAO",
        "create-proposal",
        [
          Cl.stringAscii("To Delete"),
          Cl.stringAscii("This will be deleted"),
          Cl.uint(1),
          Cl.uint(100),
          Cl.uint(50),
        ],
        deployer
      );

      // Delete it
      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "delete-proposal",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to extend proposal deadline", () => {
      // Create proposal
      simnet.callPublicFn(
        "SecureBallotsDAO",
        "create-proposal",
        [
          Cl.stringAscii("Extendable"),
          Cl.stringAscii("This deadline will be extended"),
          Cl.uint(1),
          Cl.uint(100),
          Cl.uint(50),
        ],
        deployer
      );

      // Extend deadline
      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "extend-proposal-deadline",
        [Cl.uint(1), Cl.uint(50)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(simnet.blockHeight + 100 + 50));
    });
  });

  describe("Voting Process", () => {
    beforeEach(() => {
      // Add voters
      simnet.callPublicFn(
        "SecureBallotsDAO",
        "add-voter",
        [Cl.principal(wallet1)],
        deployer
      );

      // Create proposal
      simnet.callPublicFn(
        "SecureBallotsDAO",
        "create-proposal",
        [
          Cl.stringAscii("Voting Test"),
          Cl.stringAscii("Testing voting process"),
          Cl.uint(1),
          Cl.uint(100),
          Cl.uint(50),
        ],
        deployer
      );
    });

    it("allows valid voter to commit vote", () => {
      const voteHash = new Uint8Array(20).fill(1); // Mock hash

      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "commit-vote",
        [Cl.uint(1), Cl.buffer(voteHash)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents invalid voter from voting", () => {
      const voteHash = new Uint8Array(20).fill(1);

      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "commit-vote",
        [Cl.uint(1), Cl.buffer(voteHash)],
        wallet2 // Not added as voter
      );
      expect(result).toBeErr(Cl.uint(107)); // ERR_INVALID_VOTER
    });
  });

  describe("Vote Delegation", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        "SecureBallotsDAO",
        "batch-add-voters",
        [Cl.list([Cl.principal(wallet1), Cl.principal(wallet2)])],
        deployer
      );
    });

    it("allows voter to delegate voting power", () => {
      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "delegate-vote",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));

      // Verify delegation
      const delegation = simnet.callReadOnlyFn(
        "SecureBallotsDAO",
        "get-delegation",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(delegation.result).toBeSome(Cl.principal(wallet2));
    });

    it("allows voter to revoke delegation", () => {
      // First delegate
      simnet.callPublicFn(
        "SecureBallotsDAO",
        "delegate-vote",
        [Cl.principal(wallet2)],
        wallet1
      );

      // Then revoke
      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "revoke-delegation",
        [],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Proposal Statistics (Clarity 4)", () => {
    it("returns vote statistics", () => {
      // Create proposal
      simnet.callPublicFn(
        "SecureBallotsDAO",
        "create-proposal",
        [
          Cl.stringAscii("Stats Test"),
          Cl.stringAscii("Testing statistics"),
          Cl.uint(1),
          Cl.uint(100),
          Cl.uint(50),
        ],
        deployer
      );

      const stats = simnet.callReadOnlyFn(
        "SecureBallotsDAO",
        "get-vote-statistics",
        [Cl.uint(1)],
        deployer
      );
      expect(stats.result).toBeOk();
    });

    it("returns proposal status", () => {
      simnet.callPublicFn(
        "SecureBallotsDAO",
        "create-proposal",
        [
          Cl.stringAscii("Status Test"),
          Cl.stringAscii("Testing status"),
          Cl.uint(1),
          Cl.uint(100),
          Cl.uint(50),
        ],
        deployer
      );

      const status = simnet.callReadOnlyFn(
        "SecureBallotsDAO",
        "get-proposal-status",
        [Cl.uint(1)],
        deployer
      );
      expect(status.result).toBeOk(Cl.stringAscii("active"));
    });
  });

  describe("Admin Functions", () => {
    it("allows owner to close voting", () => {
      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "close-voting",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to open voting", () => {
      simnet.callPublicFn("SecureBallotsDAO", "close-voting", [], deployer);

      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "open-voting",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to set minimum quorum", () => {
      const { result } = simnet.callPublicFn(
        "SecureBallotsDAO",
        "set-minimum-quorum",
        [Cl.uint(200)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });
});
