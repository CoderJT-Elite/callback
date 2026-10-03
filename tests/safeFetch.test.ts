import { describe, it, expect } from "vitest";
import { isPrivateOrReservedIP, safeFetch, SSRFError } from "../lib/net/safeFetch";

describe("P2 safeFetch: SSRF & IP Range Validation", () => {
  it("flags private IPv4 ranges", () => {
    expect(isPrivateOrReservedIP("10.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIP("10.255.255.255")).toBe(true);
    expect(isPrivateOrReservedIP("172.16.0.1")).toBe(true);
    expect(isPrivateOrReservedIP("172.31.255.255")).toBe(true);
    expect(isPrivateOrReservedIP("192.168.1.1")).toBe(true);
  });

  it("flags loopback and zero addresses", () => {
    expect(isPrivateOrReservedIP("127.0.0.1")).toBe(true);
    expect(isPrivateOrReservedIP("127.255.255.255")).toBe(true);
    expect(isPrivateOrReservedIP("0.0.0.0")).toBe(true);
  });

  it("flags cloud metadata & link-local addresses", () => {
    expect(isPrivateOrReservedIP("169.254.169.254")).toBe(true);
    expect(isPrivateOrReservedIP("169.254.1.1")).toBe(true);
  });

  it("flags CGNAT address space", () => {
    expect(isPrivateOrReservedIP("100.64.0.1")).toBe(true);
    expect(isPrivateOrReservedIP("100.127.255.255")).toBe(true);
    expect(isPrivateOrReservedIP("100.63.255.255")).toBe(false);
  });

  it("flags IPv6 loopback, link-local, and unique local", () => {
    expect(isPrivateOrReservedIP("::1")).toBe(true);
    expect(isPrivateOrReservedIP("0:0:0:0:0:0:0:1")).toBe(true);
    expect(isPrivateOrReservedIP("fe80::1")).toBe(true);
    expect(isPrivateOrReservedIP("fc00::1")).toBe(true);
    expect(isPrivateOrReservedIP("fd12:3456:789a::1")).toBe(true);
  });

  it("allows standard public IP addresses", () => {
    expect(isPrivateOrReservedIP("8.8.8.8")).toBe(false);
    expect(isPrivateOrReservedIP("1.1.1.1")).toBe(false);
    expect(isPrivateOrReservedIP("142.250.190.46")).toBe(false);
  });

  it("blocks non-http/https protocols", async () => {
    await expect(safeFetch("file:///etc/passwd")).rejects.toThrow(SSRFError);
    await expect(safeFetch("ftp://ftp.example.com")).rejects.toThrow(SSRFError);
    await expect(safeFetch("gopher://example.com")).rejects.toThrow(SSRFError);
  });

  it("blocks non-standard ports", async () => {
    await expect(safeFetch("http://1.1.1.1:8080/")).rejects.toThrow(SSRFError);
    await expect(safeFetch("http://1.1.1.1:22/")).rejects.toThrow(SSRFError);
  });

  it("blocks requests directly targeting localhost or metadata IPs", async () => {
    await expect(safeFetch("http://127.0.0.1/")).rejects.toThrow(SSRFError);
    await expect(safeFetch("http://169.254.169.254/latest/meta-data/")).rejects.toThrow(SSRFError);
    await expect(safeFetch("http://localhost/")).rejects.toThrow(SSRFError);
  });
});
