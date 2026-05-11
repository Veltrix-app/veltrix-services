import test from "node:test";
import assert from "node:assert/strict";

import { buildProjectWorldTheme } from "./project-world-theme";

test("project world theme resolves explicit brand accent into premium css variables", () => {
  const theme = buildProjectWorldTheme({
    brandAccent: "purple",
    brandMood: "cosmic premium",
    logo: "https://cdn.example.com/logo.png",
    bannerUrl: "https://cdn.example.com/banner.png",
    category: "Gaming",
    chain: "Base",
    isFeatured: true,
  });

  assert.equal(theme.tone, "violet");
  assert.equal(theme.label, "Cosmic Premium theme");
  assert.equal(theme.signature, "Logo and banner powered");
  assert.equal(theme.hasCustomMedia, true);
  assert.match(theme.cssVars["--project-world-hero"], /196,181,253/);
});

test("project world theme infers cyan DeFi worlds from category and chain", () => {
  const theme = buildProjectWorldTheme({
    brandAccent: null,
    brandMood: null,
    logo: null,
    bannerUrl: null,
    category: "DeFi",
    chain: "Base",
    isFeatured: false,
  });

  assert.equal(theme.tone, "cyan");
  assert.equal(theme.signature, "Accent generated");
  assert.equal(theme.cssVars["--project-world-primary"], "103 232 249");
});

test("project world theme gives featured projects aurora fallback", () => {
  const theme = buildProjectWorldTheme({
    brandAccent: null,
    brandMood: null,
    logo: null,
    bannerUrl: null,
    category: null,
    chain: null,
    isFeatured: true,
  });

  assert.equal(theme.tone, "aurora");
  assert.equal(theme.label, "Featured theme");
});
