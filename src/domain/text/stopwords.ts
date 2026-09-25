/** Function words for "content words first" cloze — docs/algorithms.md §3.4. */

export const EN_STOPWORDS: ReadonlySet<string> = new Set(
  (
    'a an the and or but nor of to in on at by for with from as into onto unto upon about ' +
    "is are was were be been being am it its it's that this these those " +
    'i me my mine we us our you your yours he him his she her they them their ' +
    'not no so if then than which who whom whose what when where shall will would should can could may might ' +
    'has have had do does did all also there here thee thou thy thine ye'
  ).split(' '),
);

export const KO_FUNCTION_WORDS: ReadonlySet<string> = new Set(
  (
    '그 이 저 또 및 곧 그리고 그러나 그러므로 그런즉 그런데 그러면 하지만 또한 오직 이제 ' +
    '이는 이것은 그것은 그가 그는 내가 나는 너희가 너희는 우리가 우리는 저희가 ' +
    '것은 것이 것을 것이라 것이니라 때에 가운데 위하여'
  ).split(' '),
);
