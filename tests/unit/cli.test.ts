import { describe, it, expect, vi, beforeEach } from "vitest";
import { execSync } from "child_process";

/**
 * CLI Integration Tests
 *
 * These tests verify the CLI entry point works correctly
 */

describe("CLI", () => {
  const CLI_PATH = "node dist/cli.js";

  describe("Basic CLI functionality", () => {
    it("should display version", () => {
      const output = execSync(`${CLI_PATH} --version`, {
        encoding: "utf8",
        env: { ...process.env, NODE_ENV: "test" },
      });
      expect(output.trim()).toContain("1.0.0");
    });

    it("should display help", () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: "utf8",
        env: { ...process.env, NODE_ENV: "test" },
      });
      expect(output).toContain("Solana DeFi Intelligence CLI");
      expect(output).toContain("balance");
      expect(output).toContain("tokens");
      expect(output).toContain("price");
      expect(output).toContain("analyze");
    });

    it("should display command-specific help", () => {
      const output = execSync(`${CLI_PATH} balance --help`, {
        encoding: "utf8",
        env: { ...process.env, NODE_ENV: "test" },
      });
      expect(output).toContain("Get SOL balance for a wallet");
      expect(output).toContain("--json");
    });
  });

  describe("Error handling", () => {
    it("should handle invalid wallet address gracefully", () => {
      let errorThrown = false;
      try {
        execSync(`${CLI_PATH} balance invalid-wallet --json`, {
          encoding: "utf8",
          env: { ...process.env, NODE_ENV: "test" },
          stdio: "pipe",
        });
      } catch (error: any) {
        errorThrown = true;
        // Error was caught, which is expected
        expect(error).toBeDefined();
      }
      // Verify an error was thrown
      expect(errorThrown).toBe(true);
    });

    it("should handle missing required arguments", () => {
      try {
        execSync(`${CLI_PATH} balance`, {
          encoding: "utf8",
          env: { ...process.env, NODE_ENV: "test" },
          stdio: "pipe",
        });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.status).toBe(1);
      }
    });
  });

  describe("JSON output mode", () => {
    it("should support --json flag for balance command", () => {
      // This will fail due to invalid wallet, but should return JSON
      try {
        execSync(`${CLI_PATH} balance test --json`, {
          encoding: "utf8",
          env: { ...process.env, NODE_ENV: "test" },
          stdio: "pipe",
        });
      } catch (error: any) {
        const output = error.stdout || error.stderr;
        // Should contain JSON structure even on error
        expect(output).toContain("{");
        expect(output).toContain("error");
      }
    });
  });

  describe("Command availability", () => {
    const commands = [
      "balance",
      "tokens",
      "price",
      "tx",
      "analyze",
      "protocol",
      "top",
      "alert",
    ];

    it.each(commands)("should have %s command", (command) => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: "utf8",
        env: { ...process.env, NODE_ENV: "test" },
      });
      expect(output).toContain(command);
    });
  });
});
