import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { initI18n } from '@/i18n';

import { VerseForm, emptyForm, validateForm, type VerseFormValues } from './VerseForm';

beforeAll(() => {
  initI18n('en');
});

function Harness({ onSubmit }: { onSubmit: jest.Mock }) {
  const [values, setValues] = useState<VerseFormValues>(emptyForm);
  return <VerseForm values={values} onChange={setValues} onSubmit={onSubmit} lang="en" />;
}

describe('VerseForm', () => {
  it('shows validation errors and does not submit an empty verse', async () => {
    const onSubmit = jest.fn();
    await render(<Harness onSubmit={onSubmit} />);
    await fireEvent.press(screen.getByTestId('save-verse'));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('Enter Korean or English text')).toBeTruthy();
    expect(screen.getAllByText('Enter a valid value').length).toBeGreaterThanOrEqual(2);
  });

  it('submits a valid verse with tags', async () => {
    const onSubmit = jest.fn();
    await render(<Harness onSubmit={onSubmit} />);
    await fireEvent.changeText(screen.getByLabelText('Chapter'), '11');
    await fireEvent.changeText(screen.getByLabelText('Verse'), '35');
    await fireEvent.changeText(screen.getByLabelText('English text'), 'Jesus wept.');
    await fireEvent.changeText(screen.getByLabelText('Tags'), 'grief,');
    await fireEvent.press(screen.getByTestId('save-verse'));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        book: 'JHN',
        chapter: 11,
        verseStart: 35,
        verseEnd: null,
        textEn: 'Jesus wept.',
        textKo: null,
        tags: ['grief'],
      }),
    );
  });

  it('keeps numeric fields digits-only', async () => {
    const onSubmit = jest.fn();
    await render(<Harness onSubmit={onSubmit} />);
    await fireEvent.changeText(screen.getByLabelText('Chapter'), '1a2b');
    expect(screen.getByLabelText('Chapter').props.value).toBe('12');
  });
});

describe('validateForm', () => {
  it('treats an empty end verse as null and non-numbers as invalid', async () => {
    const ok = validateForm({ ...emptyForm, chapter: '3', verseStart: '16', textEn: 'x' });
    expect(ok.ok && ok.value.verseEnd).toBeNull();
    const bad = validateForm({ ...emptyForm, chapter: 'x', verseStart: '16', textEn: 'x' });
    expect(bad.ok).toBe(false);
  });
});
