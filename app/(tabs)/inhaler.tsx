import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G, SHADOWS } from '../../constants/colors';
import { FONTS } from '../../constants/fonts';
import { fmt, today } from '../../utils/data';
import { AppHeader } from '../../components/AppHeader';
import { WhoBadge } from '../../components/WhoBadge';
import { InhalerLog } from '../../types';

export default function InhalerTab() {
  const { t } = useTranslation();
  const lang = useAuthStore((s) => s.lang);
  const uid = useAuthStore((s) => s.uid);
  const setModal = useAppStore((s) => s.setModal);
  const setInhalerForm = useAppStore((s) => s.setInhalerForm);
  const setEditInhalerId = useAppStore((s) => s.setEditInhalerId);
  const deleteInhaler = useAppStore((s) => s.deleteInhaler);
  const saveInhalerInfo = useAppStore((s) => s.saveInhalerInfo);
  const inhalerInfoForm = useAppStore((s) => s.inhalerInfoForm);
  const setInhalerInfoForm = useAppStore((s) => s.setInhalerInfoForm);
  const catId = useAppStore((s) => s.catId);
  const { homeKey, inhalerLogs, profiles, currentCat, ds, overdue, soon } = useHousehold();

  const [showSettings, setShowSettings] = useState(false);
  const [showCleanedPicker, setShowCleanedPicker] = useState(false);

  useEffect(() => {
    if (currentCat?.inhalerInfo) {
      setInhalerInfoForm(currentCat.inhalerInfo);
    }
  }, [currentCat?.id]);

  const sortedDesc = [...inhalerLogs].sort((a, b) => b.date.localeCompare(a.date));

  const interval = currentCat?.inhalerInfo.cleaningIntervalDays || 14;
  const pctLeft = Math.max(0, Math.round((1 - ds / Math.max(interval, 1)) * 100));

  // Today's log count
  const todayStr = today();
  const todayCount = inhalerLogs.filter((l) => l.date === todayStr).length;

  const handleEdit = (l: InhalerLog) => {
    setInhalerForm({
      date: l.date || '',
      breaths: Math.max(1, Number(l.breaths) || 1),
      dosage: l.dosage || '',
    });
    setEditInhalerId(l.id);
    setModal('editInhaler');
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      t('del'),
      t('deleteInhalerConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            if (!homeKey || !catId) return;
            await deleteInhaler(id, homeKey, catId, uid);
          },
        },
      ],
    );
  };

  const handleResetTimer = async () => {
    if (!homeKey || !catId) return;
    setInhalerInfoForm({ lastCleaned: todayStr });
    await saveInhalerInfo(homeKey, catId, uid);
  };

  return (
    <>
      <AppHeader />
      <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerLabel}>{t('deviceManagement')}</Text>
            <Text style={styles.screenTitle}>{t('inhalerHub')}</Text>
          </View>
          <TouchableOpacity
            style={styles.gearBtn}
            onPress={() => setShowSettings(!showSettings)}
          >
            <MaterialIcons name="settings" size={20} color={G.sub} />
          </TouchableOpacity>
        </View>

        {/* Active Device card */}
        <View style={[styles.deviceCard, SHADOWS.card]}>
          <View style={styles.deviceHeader}>
            <View style={[styles.dot, { backgroundColor: G.mint }]} />
            <Text style={styles.deviceLabel}>{t('activeDevice')}</Text>
          </View>
          <Text style={styles.deviceName}>
            {currentCat?.inhalerInfo.dosage || currentCat?.name + ' Chamber'}
          </Text>
          <View style={styles.pctBadge}>
            <Text style={styles.pctText}>{pctLeft}% Left</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('lastUsage')}</Text>
              <Text style={styles.statValue}>
                {sortedDesc[0] ? fmt(sortedDesc[0].date, lang) : '—'}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('dosesToday')}</Text>
              <Text style={styles.statValue}>{todayCount}</Text>
            </View>
          </View>
        </View>

        {/* Reset Timer */}
        <TouchableOpacity
          style={[styles.resetBtn, SHADOWS.mint]}
          onPress={handleResetTimer}
        >
          <MaterialIcons name="restart-alt" size={20} color="#FFFFFF" />
          <Text style={styles.resetText}>{t('resetTimer')}</Text>
        </TouchableOpacity>

        {/* Settings (collapsible) */}
        {showSettings && (
          <View style={[styles.settingsCard, SHADOWS.card]}>
            <Text style={styles.settingsTitle}>{t('deviceSettings')}</Text>

            <Text style={styles.fieldLabel}>{t('dosage')}</Text>
            <TextInput
              style={styles.input}
              value={inhalerInfoForm.dosage}
              onChangeText={(v) => setInhalerInfoForm({ dosage: v })}
              placeholder={t('dosageP')}
              placeholderTextColor={G.muted}
            />

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>{t('lastCleaned')}</Text>
            <TouchableOpacity style={styles.input} onPress={() => setShowCleanedPicker(true)}>
              <Text style={{ color: G.text, fontFamily: FONTS.regular }}>{inhalerInfoForm.lastCleaned}</Text>
            </TouchableOpacity>
            {showCleanedPicker && (
              <DateTimePicker
                value={new Date(inhalerInfoForm.lastCleaned + 'T12:00:00')}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(_, d) => {
                  setShowCleanedPicker(false);
                  if (d) setInhalerInfoForm({ lastCleaned: d.toISOString().split('T')[0] });
                }}
              />
            )}

            <Text style={[styles.fieldLabel, { marginTop: 14 }]}>{t('cleanEvery')}</Text>
            <TextInput
              style={styles.input}
              value={String(inhalerInfoForm.cleaningIntervalDays)}
              onChangeText={(v) => setInhalerInfoForm({ cleaningIntervalDays: Number(v) || 14 })}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={[styles.saveSettingsBtn, SHADOWS.mint]}
              onPress={async () => {
                if (!homeKey || !catId) return;
                await saveInhalerInfo(homeKey, catId, uid);
              }}
            >
              <Text style={styles.saveSettingsText}>{t('saveSettings')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Usage History */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>{t('usageHistory')}</Text>
          <Text style={styles.countBadge}>{inhalerLogs.length} {t('uses')}</Text>
        </View>

        {sortedDesc.slice(0, 10).map((l) => (
          <View key={l.id} style={[styles.logCard, SHADOWS.card]}>
            <View style={styles.logIcon}>
              <MaterialIcons name="medication" size={18} color={G.mint} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logTitle}>{l.dosage || t('dosage')}</Text>
              <View style={styles.logMeta}>
                <Text style={styles.logMetaText}>{t('breaths', { count: l.breaths })}</Text>
                <WhoBadge addedBy={l.addedBy} profiles={profiles} />
              </View>
            </View>
            <View style={styles.logRight}>
              <Text style={styles.logTime}>{fmt(l.date, lang)}</Text>
              <View style={styles.logActions}>
                <TouchableOpacity onPress={() => handleEdit(l)}>
                  <MaterialIcons name="edit" size={16} color={G.sub} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(l.id)}>
                  <MaterialIcons name="delete-outline" size={16} color={G.coral} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {!inhalerLogs.length && (
          <View style={styles.empty}>
            <MaterialIcons name="medication" size={48} color={G.dim} />
            <Text style={styles.emptyText}>No inhaler uses recorded yet</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: G.bg },
  content: { padding: 16, paddingBottom: 24 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLabel: {
    color: G.mint,
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  screenTitle: {
    color: G.text,
    fontSize: 22,
    fontFamily: FONTS.extraBold,
  },
  gearBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: G.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Device card
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.20)',
  },
  deviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  deviceLabel: {
    color: G.sub,
    fontSize: 11,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  deviceName: {
    color: G.text,
    fontSize: 18,
    fontFamily: FONTS.extraBold,
    marginBottom: 8,
  },
  pctBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E0F7F6',
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  pctText: { color: '#2BA89E', fontSize: 12, fontFamily: FONTS.bold },

  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1 },
  statLabel: { color: G.muted, fontSize: 11, fontFamily: FONTS.semiBold, marginBottom: 2 },
  statValue: { color: G.text, fontSize: 15, fontFamily: FONTS.bold },
  statDivider: { width: 1, height: 30, backgroundColor: G.border, marginHorizontal: 16 },

  // Reset timer
  resetBtn: {
    backgroundColor: G.mint,
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  resetText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 15 },

  // Settings
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  settingsTitle: {
    color: G.text,
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 16,
  },
  fieldLabel: { color: G.sub, fontSize: 13, fontFamily: FONTS.semiBold, marginBottom: 8 },
  input: {
    backgroundColor: G.bgInput,
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 14,
    color: G.text,
    fontSize: 16,
    fontFamily: FONTS.regular,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  saveSettingsBtn: {
    backgroundColor: G.mint,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  saveSettingsText: { color: '#FFFFFF', fontFamily: FONTS.bold, fontSize: 15 },

  // Section header
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionLabel: {
    color: G.text,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  countBadge: { color: G.sub, fontSize: 13, fontFamily: FONTS.regular },

  // Log card
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F7F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logTitle: { color: G.text, fontSize: 14, fontFamily: FONTS.bold },
  logMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  logMetaText: { color: G.sub, fontSize: 12, fontFamily: FONTS.regular },
  logRight: { alignItems: 'flex-end', gap: 6 },
  logTime: { color: G.muted, fontSize: 11, fontFamily: FONTS.semiBold },
  logActions: { flexDirection: 'row', gap: 10 },

  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, gap: 12 },
  emptyText: { color: G.sub, fontSize: 15, fontFamily: FONTS.medium },
});
