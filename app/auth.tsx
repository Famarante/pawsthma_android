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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { G, SHADOWS, GRADIENTS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { LangToggle } from '../components/LangToggle';
import { FB_ON, fbResetPassword } from '../services/firebase';

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
  const [showPassword, setShowPassword] = useState(false);
  const [signup, setSignup] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t('forgotPassword'), t('resetPasswordNeedEmail'));
      return;
    }
    try {
      await fbResetPassword(email.trim());
      Alert.alert(t('forgotPassword'), t('resetPasswordSent'));
    } catch {
      Alert.alert(t('forgotPassword'), t('resetPasswordError'));
    }
  };

  const submit = async () => {
    if (!email.trim() || !password) {
      setErr(t('authError'));
      return;
    }
    const errKey = await signIn(email.trim(), password, signup);
    if (errKey) {
      setErr(t(errKey));
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.bgSplash} style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          {/* Lang toggle top-right */}
          <View style={styles.langRow}>
            <LangToggle lang={lang} setLang={setLang} compact />
          </View>

          {/* Logo */}
          <View style={styles.logoMoment}>
            <View style={[styles.logoCircle, SHADOWS.primary]}>
              <MaterialIcons name="pets" size={40} color={G.primary} />
            </View>
            <Text style={styles.wordmark}>Pawsthma</Text>
            <Text style={styles.tagline}>Breathe easy, little friend.</Text>
          </View>

          {/* Email field */}
          <View style={styles.fieldWrap}>
            <View style={styles.inputRow}>
              <MaterialIcons name="mail-outline" size={20} color={G.muted} style={styles.inputIcon} />
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
            </View>
          </View>

          {/* Password field */}
          <View style={styles.fieldWrap}>
            <View style={styles.inputRow}>
              <MaterialIcons name="lock-outline" size={20} color={G.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={(v) => { setPassword(v); setErr(null); }}
                placeholder={t('authPassword')}
                placeholderTextColor={G.muted}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={G.muted}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot password */}
          {!signup && (
            <TouchableOpacity style={styles.forgotRow} onPress={handleForgotPassword}>
              <Text style={styles.forgotText}>{t('forgotPassword')}</Text>
            </TouchableOpacity>
          )}

          {err && <Text style={styles.err}>{err}</Text>}

          {/* Sign In button */}
          <TouchableOpacity style={[styles.btn, SHADOWS.primary]} onPress={submit}>
            <Text style={styles.btnText}>{signup ? t('authSignUp') : t('authSignIn')}</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
          </TouchableOpacity>

          {/* OR divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Switch mode */}
          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => { setSignup((v) => !v); setErr(null); }}
          >
            <Text style={styles.switchText}>
              {signup ? t('authSwitchToSignIn') : t('authSwitchToSignUp')}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 16,
  },
  langRow: { position: 'absolute', top: 52, right: 16 },
  logoMoment: { alignItems: 'center', marginBottom: 36 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  wordmark: {
    color: G.text,
    fontSize: 30,
    fontFamily: FONTS.extraBold,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: { color: G.muted, fontSize: 14, fontFamily: FONTS.regular },
  fieldWrap: {
    width: '100%',
    maxWidth: 400,
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1,
    color: G.text,
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingVertical: 16,
  },
  eyeBtn: { padding: 4 },
  forgotRow: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  forgotText: { color: G.muted, fontSize: 13, fontFamily: FONTS.medium },
  err: {
    color: G.coral,
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginBottom: 12,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: G.primary,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  btnText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: G.border,
  },
  dividerText: {
    color: G.muted,
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginHorizontal: 16,
  },
  switchBtn: { padding: 9, alignItems: 'center' },
  switchText: {
    color: '#FFB74D',
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
});
