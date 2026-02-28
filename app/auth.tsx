import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { G } from '../constants/colors';
import { LangToggle } from '../components/LangToggle';

export default function AuthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const user = useAuthStore((s) => s.user);
  const lang = useAuthStore((s) => s.lang);
  const setLang = useAuthStore((s) => s.setLang);

  useEffect(() => {
    if (user) router.replace('/');
  }, [user]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signup, setSignup] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!email.trim() || !password) {
      setErr(t('authError'));
      return;
    }
    const errKey = await signIn(email.trim(), password, signup);
    if (errKey) {
      setErr(t(errKey));
    }
    // Success: auth observer sets user in store → useEffect above navigates to /
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <LangToggle lang={lang} setLang={setLang} />
        <View style={styles.card}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>{t('authTitle')}</Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(v) => { setEmail(v); setErr(null); }}
            placeholder={t('authEmail')}
            placeholderTextColor={G.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.input, { marginBottom: 12 }]}
            value={password}
            onChangeText={(v) => { setPassword(v); setErr(null); }}
            placeholder={t('authPassword')}
            placeholderTextColor={G.muted}
            secureTextEntry
          />

          {err && <Text style={styles.err}>{err}</Text>}

          <TouchableOpacity style={styles.btn} onPress={submit}>
            <Text style={styles.btnText}>{signup ? t('authSignUp') : t('authSignIn')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => { setSignup((v) => !v); setErr(null); }}
          >
            <Text style={styles.switchText}>
              {signup ? t('authSwitchToSignIn') : t('authSwitchToSignUp')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: G.bg },
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: G.surface,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 22,
    padding: 20,
  },
  icon: { fontSize: 36, textAlign: 'center', marginBottom: 8 },
  title: {
    color: G.text,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 12,
    color: G.text,
    fontSize: 15,
    padding: 12,
    marginBottom: 10,
  },
  err: { color: G.coral, fontSize: 12, marginBottom: 12 },
  btn: {
    backgroundColor: G.amber,
    borderRadius: 14,
    padding: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  btnText: { color: '#0a0f1e', fontWeight: '700', fontSize: 16 },
  switchBtn: { padding: 9, alignItems: 'center' },
  switchText: { color: G.muted, fontSize: 12 },
});
