import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { G } from '../constants/colors';
import { FONTS } from '../constants/fonts';

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
    backgroundColor: '#F1F5F9',
    borderRadius: 22,
    padding: 4,
    gap: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  btn: {
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  btnActive: { backgroundColor: G.primary },
  text: { color: G.muted, fontSize: 11, fontFamily: FONTS.bold },
  textActive: { color: '#FFFFFF' },
});
