import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { G } from '../constants/colors';

interface Props {
  lang: string;
  setLang: (lang: string) => void;
  compact?: boolean;
}

export function LangToggle({ lang, setLang, compact }: Props) {
  const { i18n } = useTranslation();

  const handleSet = (l: string) => {
    setLang(l);
    i18n.changeLanguage(l);
  };

  return (
    <View style={[styles.container, compact && { marginBottom: 0 }]}>
      {(['en', 'pt'] as const).map((l) => (
        <TouchableOpacity
          key={l}
          style={[styles.btn, lang === l && styles.btnActive]}
          onPress={() => handleSet(l)}
        >
          <Text style={[styles.text, lang === l && styles.textActive]}>
            {l === 'en' ? '🇬🇧 EN' : '🇵🇹 PT'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 3,
    gap: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  btn: {
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 9,
  },
  btnActive: { backgroundColor: G.amber },
  text: { color: G.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  textActive: { color: '#0a0f1e' },
});
