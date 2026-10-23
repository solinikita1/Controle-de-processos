import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { MicrosoftLoginModal } from "../src/components/MicrosoftLoginModal";
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
test("login opens and closes without hooks error and delegates to real provider", async () => {
  let called = 0;
  const props = {
    onClose: () => {},
    currentUser: null,
    onLogin: async () => {
      called++;
    },
    onLogout: async () => {},
  };
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(<MicrosoftLoginModal {...props} isOpen={false} />);
  });
  await act(async () =>
    root.update(<MicrosoftLoginModal {...props} isOpen={true} />),
  );
  assert.equal(
    root.root.findAllByType("input").length,
    0,
    "No password or impersonation inputs",
  );
  await act(async () => root.root.findByType("button").props.onClick());
  assert.equal(called, 1);
  await act(async () =>
    root.update(<MicrosoftLoginModal {...props} isOpen={false} />),
  );
  await act(async () => root.unmount());
});
test("provider failure is visible and login remains retryable", async () => {
  let root!: ReactTestRenderer;
  await act(async () => {
    root = create(
      <MicrosoftLoginModal
        isOpen
        onClose={() => {}}
        currentUser={null}
        onLogin={async () => {
          throw new Error("configuration missing");
        }}
        onLogout={async () => {}}
      />,
    );
  });
  await act(async () => root.root.findByType("button").props.onClick());
  assert.equal(
    root.root.findByProps({ role: "alert" }).children.join(""),
    "configuration missing",
  );
  assert.equal(root.root.findByType("button").props.disabled, false);
  await act(async () => root.unmount());
});
