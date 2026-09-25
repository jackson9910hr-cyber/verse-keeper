import { fireEvent, render, screen } from '@testing-library/react-native';

import { initI18n } from '@/i18n';
import { initialState } from '@/domain/srs/schedule';

import { ClozeView } from './ClozeView';
import { FirstLetterView } from './FirstLetterView';
import { GradeBar } from './GradeBar';

// WEB John 11:35 / Psalm 23:1 (public domain)
const PSA_23_1 = 'Yahweh is my shepherd: I shall lack nothing.';

beforeAll(() => {
  initI18n('en');
});

describe('GradeBar', () => {
  it('shows four grades with next-interval previews and reports the choice', async () => {
    const onGrade = jest.fn();
    await render(<GradeBar state={initialState('2026-09-25')} onGrade={onGrade} />);
    expect(screen.getByLabelText('Again, next review in 1 day')).toBeTruthy();
    expect(screen.getByLabelText('Easy, next review in 3 days')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('grade-good'));
    expect(onGrade).toHaveBeenCalledWith('good');
  });

  it('does not report presses while disabled', async () => {
    const onGrade = jest.fn();
    await render(<GradeBar state={initialState('2026-09-25')} onGrade={onGrade} disabled />);
    await fireEvent.press(screen.getByTestId('grade-easy'));
    expect(onGrade).not.toHaveBeenCalled();
  });
});

describe('ClozeView', () => {
  const props = {
    text: PSA_23_1,
    lang: 'en' as const,
    seed: 's',
    contentFirst: false,
    revealAll: false,
    typeMode: false,
  };

  it('hides every word at level 5 and keeps punctuation visible', async () => {
    await render(<ClozeView {...props} level={5} />);
    expect(screen.getAllByLabelText('Blank, double-tap to reveal')).toHaveLength(8);
    expect(screen.getByText(':')).toBeTruthy();
    expect(screen.queryByText('shepherd')).toBeNull();
  });

  it('reveals a word when its blank is pressed', async () => {
    await render(<ClozeView {...props} level={5} />);
    await fireEvent.press(screen.getAllByLabelText('Blank, double-tap to reveal')[0]!);
    expect(screen.getAllByLabelText('Blank, double-tap to reveal')).toHaveLength(7);
    expect(screen.getByText('Yahweh')).toBeTruthy();
  });

  it('hides ceil(20%) of the words at level 1', async () => {
    await render(<ClozeView {...props} level={1} />);
    expect(screen.getAllByLabelText('Blank, double-tap to reveal')).toHaveLength(2);
  });

  it('shows everything when revealAll is set', async () => {
    await render(<ClozeView {...props} level={5} revealAll />);
    expect(screen.queryAllByLabelText('Blank, double-tap to reveal')).toHaveLength(0);
    expect(screen.getByText('shepherd')).toBeTruthy();
  });

  it('checks typed answers in order', async () => {
    await render(<ClozeView {...props} level={5} typeMode />);
    await fireEvent.changeText(screen.getByLabelText('Type the missing word'), 'yahweh');
    await fireEvent.press(screen.getByText('Check'));
    expect(screen.getByText('Correct!')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Type the missing word'), 'was');
    await fireEvent.press(screen.getByText('Check'));
    expect(screen.getByText('Answer: is')).toBeTruthy();
  });
});

describe('FirstLetterView', () => {
  it('shows first letters until revealed', async () => {
    const { rerender } = await render(
      <FirstLetterView text="Jesus wept." koRule="syllable" showLength revealAll={false} />,
    );
    expect(screen.getByText('J____')).toBeTruthy();
    expect(screen.getByText('w___')).toBeTruthy();
    await rerender(<FirstLetterView text="Jesus wept." koRule="syllable" showLength revealAll />);
    expect(screen.getByText('Jesus')).toBeTruthy();
  });

  it('supports the Korean choseong rule', async () => {
    await render(
      <FirstLetterView text="우리는 걷는다" koRule="choseong" showLength revealAll={false} />,
    );
    expect(screen.getByText('ㅇㄹㄴ')).toBeTruthy();
  });
});
