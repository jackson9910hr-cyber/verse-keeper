import { render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { DataContext } from '@/data/context';
import { saveSetting } from '@/data/settings';
import { makeTestContext } from '@/data/testing/context';
import { AppProvider, useApp } from '@/providers/AppProvider';

function Gate({ children }: { children: ReactElement }) {
  const { phase } = useApp();
  return phase.kind === 'ready' ? children : null;
}

/** Renders `ui` inside AppProvider backed by an in-memory SQLite DB (English UI). */
export async function renderWithApp(
  ui: ReactElement,
  options: { ctx?: DataContext & Awaited<ReturnType<typeof makeTestContext>> } = {},
) {
  const ctx = options.ctx ?? (await makeTestContext());
  await saveSetting(ctx.db, 'ui.language', 'en');
  const utils = await render(
    <AppProvider testContext={ctx}>
      <Gate>{ui}</Gate>
    </AppProvider>,
  );
  return { ...utils, ctx, screen };
}
