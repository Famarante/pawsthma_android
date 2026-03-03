import { useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Linking, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useHousehold } from '../hooks/useHousehold';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';
import { G, SHADOWS } from '../constants/colors';
import { FONTS } from '../constants/fonts';
import { daysBetween, today } from '../utils/data';
import { Cat } from '../types';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentCat, homeKey, catId } = useHousehold();
  const saveCatInfo = useAppStore((s) => s.saveCatInfo);
  const uid = useAuthStore((s) => s.uid);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Cat>>({});

  if (!currentCat) return null;

  const cat = currentCat;
  const age = cat.birthDate ? Math.floor(daysBetween(cat.birthDate, today()) / 365) : null;

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('', t('photoPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled && result.assets[0].base64) {
      const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
      if (homeKey && catId) {
        await saveCatInfo({ photo: uri }, homeKey, catId, uid);
      }
    }
  };

  const startEdit = () => {
    setForm({
      name: cat.name,
      breed: cat.breed || '',
      birthDate: cat.birthDate || '',
      weight: cat.weight || undefined,
      gender: cat.gender || undefined,
      vetName: cat.vetName || '',
      vetClinic: cat.vetClinic || '',
      vetPhone: cat.vetPhone || '',
      vetAddress: cat.vetAddress || '',
      diagnosis: cat.diagnosis || '',
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!homeKey || !catId) return;
    const cleaned: Partial<Cat> = { ...form };
    if (cleaned.weight !== undefined) {
      cleaned.weight = Number(cleaned.weight) || undefined;
    }
    await saveCatInfo(cleaned, homeKey, catId, uid);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  const upd = (key: string, value: string | number | undefined) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // ─── Read-only view ─────────────────────────────────────────────────────────
  if (!editing) {
    return (
      <View style={[styles.bg, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={22} color={G.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile')}</Text>
          <TouchableOpacity style={styles.gearBtn}>
            <MaterialIcons name="settings" size={20} color={G.sub} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Cat avatar + name */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarInner}>
                {cat.photo ? (
                  <Image source={{ uri: cat.photo }} style={styles.avatarImage} />
                ) : (
                  <MaterialIcons name="pets" size={40} color={G.primary} />
                )}
              </View>
              <TouchableOpacity style={styles.editOverlay} onPress={pickPhoto}>
                <MaterialIcons name="edit" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.catName}>{cat.name}</Text>
            {(cat.breed || age !== null) && (
              <Text style={styles.catSub}>
                {[cat.breed, age !== null ? `${age} ${age === 1 ? 'year' : 'years'} old` : null].filter(Boolean).join(' · ')}
              </Text>
            )}
          </View>

          {/* Info badges */}
          <View style={styles.badgesRow}>
            {cat.weight && (
              <View style={styles.badge}>
                <MaterialIcons name="fitness-center" size={14} color={G.mint} />
                <Text style={styles.badgeText}>{cat.weight} kg</Text>
              </View>
            )}
            {cat.gender && (
              <View style={styles.badge}>
                <MaterialIcons name={cat.gender === 'male' ? 'male' : 'female'} size={14} color={G.mint} />
                <Text style={styles.badgeText}>{cat.gender === 'male' ? t('male') : t('female')}</Text>
              </View>
            )}
            {cat.birthDate && (
              <View style={styles.badge}>
                <MaterialIcons name="cake" size={14} color={G.mint} />
                <Text style={styles.badgeText}>{cat.birthDate}</Text>
              </View>
            )}
          </View>

          {/* Veterinarian card */}
          {(cat.vetName || cat.vetClinic) && (
            <View style={[styles.card, SHADOWS.card]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIcon}>
                  <MaterialIcons name="local-hospital" size={18} color={G.indigo} />
                </View>
                <Text style={styles.cardTitle}>{t('veterinarian')}</Text>
              </View>
              {cat.vetName && (
                <Text style={styles.vetName}>{cat.vetName}</Text>
              )}
              {cat.vetClinic && (
                <Text style={styles.vetDetail}>{cat.vetClinic}</Text>
              )}
              {cat.vetAddress && (
                <Text style={styles.vetDetail}>{cat.vetAddress}</Text>
              )}
              {cat.vetPhone && (
                <TouchableOpacity
                  style={[styles.callBtn, SHADOWS.soft]}
                  onPress={() => Linking.openURL(`tel:${cat.vetPhone}`)}
                >
                  <MaterialIcons name="phone" size={16} color="#FFFFFF" />
                  <Text style={styles.callText}>{cat.vetPhone}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Medications */}
          {cat.medications && cat.medications.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>{t('currentMedications')}</Text>
              {cat.medications.map((med, i) => (
                <View key={i} style={[styles.medCard, SHADOWS.card]}>
                  <View style={styles.medIcon}>
                    <MaterialIcons name="medication" size={18} color={G.mint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.medName}>{med.name}</Text>
                    <Text style={styles.medDetail}>{med.dosage} · {med.frequency}</Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Diagnosis */}
          {cat.diagnosis && (
            <View style={[styles.card, SHADOWS.card, { marginTop: 8 }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: 'rgba(255,126,103,0.08)' }]}>
                  <MaterialIcons name="assignment" size={18} color={G.primary} />
                </View>
                <Text style={styles.cardTitle}>{t('diagnosis')}</Text>
              </View>
              <Text style={styles.diagnosisText}>{cat.diagnosis}</Text>
            </View>
          )}

          {/* Edit Profile button */}
          <TouchableOpacity style={[styles.editBtn, SHADOWS.primary]} onPress={startEdit}>
            <Text style={styles.editBtnText}>{t('editProfile')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ─── Edit mode ──────────────────────────────────────────────────────────────
  return (
    <View style={[styles.bg, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
          <MaterialIcons name="close" size={22} color={G.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editProfile')}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Name */}
        <Text style={styles.fieldLabel}>{t('catName')}</Text>
        <TextInput
          style={styles.fieldInput}
          value={form.name || ''}
          onChangeText={(v) => upd('name', v)}
          placeholder={t('catName')}
          placeholderTextColor={G.muted}
          maxLength={30}
        />

        {/* Breed */}
        <Text style={styles.fieldLabel}>{t('catBreed')}</Text>
        <TextInput
          style={styles.fieldInput}
          value={(form.breed as string) || ''}
          onChangeText={(v) => upd('breed', v)}
          placeholder={t('catBreed')}
          placeholderTextColor={G.muted}
        />

        {/* Birth date */}
        <Text style={styles.fieldLabel}>{t('catBirthDate')}</Text>
        <TextInput
          style={styles.fieldInput}
          value={(form.birthDate as string) || ''}
          onChangeText={(v) => upd('birthDate', v)}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={G.muted}
          maxLength={10}
        />

        {/* Weight */}
        <Text style={styles.fieldLabel}>{t('catWeight')}</Text>
        <TextInput
          style={styles.fieldInput}
          value={form.weight !== undefined ? String(form.weight) : ''}
          onChangeText={(v) => upd('weight', v === '' ? undefined : v)}
          placeholder="e.g. 4.5"
          placeholderTextColor={G.muted}
          keyboardType="numeric"
        />

        {/* Gender */}
        <Text style={styles.fieldLabel}>{t('catGender')}</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderBtn, form.gender === 'male' && styles.genderBtnActive]}
            onPress={() => upd('gender', 'male')}
          >
            <MaterialIcons name="male" size={18} color={form.gender === 'male' ? '#FFFFFF' : G.sub} />
            <Text style={[styles.genderText, form.gender === 'male' && styles.genderTextActive]}>
              {t('male')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderBtn, form.gender === 'female' && styles.genderBtnActive]}
            onPress={() => upd('gender', 'female')}
          >
            <MaterialIcons name="female" size={18} color={form.gender === 'female' ? '#FFFFFF' : G.sub} />
            <Text style={[styles.genderText, form.gender === 'female' && styles.genderTextActive]}>
              {t('female')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Vet info section */}
        <Text style={[styles.sectionLabel, { marginTop: 8 }]}>{t('vetInfo')}</Text>

        <Text style={styles.fieldLabel}>{t('veterinarian')}</Text>
        <TextInput
          style={styles.fieldInput}
          value={(form.vetName as string) || ''}
          onChangeText={(v) => upd('vetName', v)}
          placeholder={t('veterinarian')}
          placeholderTextColor={G.muted}
        />

        <Text style={styles.fieldLabel}>Clinic</Text>
        <TextInput
          style={styles.fieldInput}
          value={(form.vetClinic as string) || ''}
          onChangeText={(v) => upd('vetClinic', v)}
          placeholder="Clinic name"
          placeholderTextColor={G.muted}
        />

        <Text style={styles.fieldLabel}>Phone</Text>
        <TextInput
          style={styles.fieldInput}
          value={(form.vetPhone as string) || ''}
          onChangeText={(v) => upd('vetPhone', v)}
          placeholder="Phone number"
          placeholderTextColor={G.muted}
          keyboardType="phone-pad"
        />

        <Text style={styles.fieldLabel}>Address</Text>
        <TextInput
          style={styles.fieldInput}
          value={(form.vetAddress as string) || ''}
          onChangeText={(v) => upd('vetAddress', v)}
          placeholder="Address"
          placeholderTextColor={G.muted}
        />

        {/* Diagnosis */}
        <Text style={styles.fieldLabel}>{t('diagnosis')}</Text>
        <TextInput
          style={[styles.fieldInput, { minHeight: 80, textAlignVertical: 'top' }]}
          value={(form.diagnosis as string) || ''}
          onChangeText={(v) => upd('diagnosis', v)}
          placeholder={t('diagnosis')}
          placeholderTextColor={G.muted}
          multiline
        />

        {/* Save + Cancel buttons */}
        <TouchableOpacity style={[styles.editBtn, SHADOWS.primary]} onPress={handleSave}>
          <Text style={styles.editBtnText}>{t('save')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <Text style={styles.cancelText}>{t('cancel')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: G.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: G.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: G.text, fontSize: 17, fontFamily: FONTS.bold },
  gearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: G.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16, paddingBottom: 40 },

  // Avatar
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: G.golden,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  avatarInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,126,103,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: G.golden,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  catName: { color: G.text, fontSize: 24, fontFamily: FONTS.extraBold },
  catSub: { color: G.sub, fontSize: 14, fontFamily: FONTS.regular, marginTop: 4 },

  // Badges
  badgesRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 24 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F7F6',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  badgeText: { color: '#2BA89E', fontSize: 12, fontFamily: FONTS.semiBold },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(139,92,246,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: G.text, fontSize: 16, fontFamily: FONTS.bold },
  vetName: { color: G.text, fontSize: 15, fontFamily: FONTS.semiBold, marginBottom: 4 },
  vetDetail: { color: G.sub, fontSize: 13, fontFamily: FONTS.regular, marginBottom: 2 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: G.indigo,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  callText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 14 },

  // Medications
  sectionLabel: {
    color: G.text,
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 12,
  },
  medCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  medIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: { color: G.text, fontSize: 14, fontFamily: FONTS.bold },
  medDetail: { color: G.sub, fontSize: 12, fontFamily: FONTS.regular, marginTop: 2 },

  // Diagnosis
  diagnosisText: { color: G.sub, fontSize: 14, fontFamily: FONTS.regular, lineHeight: 22 },

  // Edit button
  editBtn: {
    backgroundColor: G.golden,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  editBtnText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 16 },

  // Edit form fields
  fieldLabel: {
    color: G.sub,
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    marginBottom: 6,
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: G.border,
    borderRadius: 14,
    color: G.text,
    fontSize: 14,
    fontFamily: FONTS.regular,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: G.border,
    borderRadius: 14,
    paddingVertical: 12,
  },
  genderBtnActive: {
    backgroundColor: G.mint,
    borderColor: G.mint,
  },
  genderText: { color: G.sub, fontSize: 14, fontFamily: FONTS.medium },
  genderTextActive: { color: '#FFFFFF' },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: { color: G.sub, fontFamily: FONTS.medium, fontSize: 15 },
});
