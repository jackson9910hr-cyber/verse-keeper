import { tokenize } from './tokenize';
import { groupUnits } from './units';

const show = (s: string) =>
  groupUnits(tokenize(s)).map((u) => `${u.before}[${u.word?.text ?? ''}]${u.after}`);

describe('groupUnits', () => {
  it('attaches trailing punctuation to the word', () => {
    expect(show('For God so loved the world,')).toEqual([
      '[For]',
      '[God]',
      '[so]',
      '[loved]',
      '[the]',
      '[world],',
    ]);
  });
  it('attaches opening quotes to the next word', () => {
    expect(show('He said, “Come to me.”')).toEqual([
      '[He]',
      '[said],',
      '“[Come]',
      '[to]',
      '[me].”',
    ]);
  });
  it('keeps free-standing punctuation as its own unit', () => {
    expect(show('wait — then')).toEqual(['[wait]', '—[]', '[then]']);
    expect(show('“…”')).toEqual(['“…”[]']);
  });
  it('splits words joined by an em dash into separate units', () => {
    expect(show('Jesus—wept')).toEqual(['[Jesus]—', '[wept]']);
  });
  it('returns nothing for empty text', () => {
    expect(groupUnits([])).toEqual([]);
  });
});
