import { fireEvent, waitFor } from '@testing-library/react-native';

import Home from '@/app/(tabs)/index';
import { cardsForVerse, startLearning } from '@/data/repositories/cards';
import { createProfile } from '@/data/repositories/profiles';
import { getVerse } from '@/data/repositories/verses';
import { completeOnboarding } from '@/data/services/app';
import { makeTestContext } from '@/data/testing/context';
import { PracticePanel } from '@/features/practice/PracticePanel';
import { bootstrap } from '@/providers/AppProvider';
import { renderWithApp } from '@/test-utils/renderWithApp';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useFocusEffect: jest.fn(),
}));

async function setup() {
  const ctx = await makeTestContext();
  await bootstrap(ctx);
  const me = await completeOnboarding(ctx, 'Dana');
  return { ctx, me };
}

describe('Home screen', () => {
  it('greets the active profile and shows the empty state before learning', async () => {
    const { ctx } = await setup();
    const { screen } = await renderWithApp(<Home />, { ctx });
    expect(await screen.findByText('Welcome, Dana')).toBeTruthy();
    expect(screen.getByTestId('due-count').props.children).toBe('0');
    expect(screen.getByText('Pick your first verse')).toBeTruthy();
    expect(screen.getByText('Choose this week’s verse')).toBeTruthy();
  });

  it('shows the due badge and a start button once a verse is learned', async () => {
    const { ctx, me } = await setup();
    const verse = (await getVerse(ctx, 'web-core-50:JHN.3.16'))!;
    await startLearning(ctx, me, verse);
    const { screen } = await renderWithApp(<Home />, { ctx });
    await waitFor(() => expect(screen.getByTestId('due-count').props.children).toBe('1'));
    expect(screen.getByTestId('start-review')).toBeTruthy();
  });

  it('switches profiles from the chips', async () => {
    const { ctx } = await setup();
    await createProfile(ctx, 'Kid');
    const { screen } = await renderWithApp(<Home />, { ctx });
    await fireEvent.press(await screen.findByLabelText('Switch to Kid'));
    expect(await screen.findByText('Welcome, Kid')).toBeTruthy();
  });
});

describe('PracticePanel', () => {
  it('reveals the answer, then grades with the chosen mode', async () => {
    const { ctx, me } = await setup();
    const verse = (await getVerse(ctx, 'web-core-50:JHN.3.16'))!;
    await startLearning(ctx, me, verse);
    const [card] = await cardsForVerse(ctx, me, verse.id);
    const onGrade = jest.fn();
    const { screen } = await renderWithApp(
      <PracticePanel item={{ card: card!, verse }} seed="t" onGrade={onGrade} />,
      { ctx },
    );
    expect(await screen.findByText('John 3:16')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('First letter'));
    expect(screen.getByText('F__')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('reveal'));
    await fireEvent.press(screen.getByTestId('grade-good'));
    expect(onGrade).toHaveBeenCalledWith('good', 'first_letter');
  });
});
