import { Stack, router, useLocalSearchParams, useNavigation } from 'expo-router';
import { usePreventRemove } from 'expo-router/react-navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { createVerse, getVerse, updateVerse } from '@/data/repositories/verses';
import type { Verse } from '@/domain/model';
import type { ValidVerse } from '@/domain/verse/verseInput';
import {
  VerseForm,
  emptyForm,
  formFromVerse,
  type VerseFormValues,
} from '@/features/verses/VerseForm';
import { useApp } from '@/providers/AppProvider';
import { Screen } from '@/ui/Screen';
import { ErrorState, Skeleton } from '@/ui/States';

export default function EditVerse() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t } = useTranslation();
  const { ctx, lang } = useApp();
  const [existing, setExisting] = useState<Verse | null | undefined>(id ? undefined : null);
  const [values, setValues] = useState<VerseFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [initial, setInitial] = useState(() => JSON.stringify(emptyForm));
  const navigation = useNavigation();

  useEffect(() => {
    if (!id) return;
    void getVerse(ctx, id).then((v) => {
      setExisting(v);
      if (v) {
        const f = formFromVerse(v);
        setInitial(JSON.stringify(f));
        setValues(f);
      }
    });
  }, [ctx, id]);

  const dirty = JSON.stringify(values) !== initial;
  usePreventRemove(dirty && !saving, ({ data }) => {
    Alert.alert(t('edit.discardTitle'), t('edit.discardBody'), [
      { text: t('edit.keepEditing'), style: 'cancel' },
      {
        text: t('edit.discard'),
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  const submit = async (valid: ValidVerse) => {
    setSaving(true);
    setSaveError(false);
    try {
      if (existing) await updateVerse(ctx, existing.id, valid);
      else await createVerse(ctx, valid);
      // `saving` is already true here, so the unsaved-changes guard lets this navigation through.
      router.back();
    } catch (e) {
      if (__DEV__) console.error(e);
      setSaveError(true);
      setSaving(false);
    }
  };

  if (existing === undefined)
    return (
      <Screen>
        <Skeleton lines={6} />
      </Screen>
    );
  const locked = existing?.source === 'pack';
  return (
    <Screen>
      <Stack.Screen options={{ title: existing ? t('edit.titleEdit') : t('edit.titleNew') }} />
      {saveError ? <ErrorState title={t('errors.generic')} /> : null}
      <VerseForm
        values={values}
        onChange={setValues}
        onSubmit={submit}
        lang={lang}
        lockReference={locked}
        lockEnglish={locked}
        saving={saving}
      />
    </Screen>
  );
}
