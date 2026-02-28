import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { useAuthStore } from '../../stores/authStore';
import { useHousehold } from '../../hooks/useHousehold';
import { G, SEV } from '../../constants/colors';
import { fmt, fmtDuration } from '../../utils/data';
import { AppHeader } from '../../components/AppHeader';
import { AttackModal } from '../../components/modals/AttackModal';
import { InhalerModal } from '../../components/modals/InhalerModal';
import { ProfileManager } from '../../components/ProfileManager';
import { WhoBadge } from '../../components/WhoBadge';
import { Attack } from '../../types';

export default function AttacksTab() {
  const { t } = useTranslation();
  const lang = useAuthStore((s) => s.lang);
  const uid = useAuthStore((s) => s.uid);
  const setModal = useAppStore((s) => s.setModal);
  const setAttackForm = useAppStore((s) => s.setAttackForm);
  const setEditAttackId = useAppStore((s) => s.setEditAttackId);
  const deleteAttack = useAppStore((s) => s.deleteAttack);
  const catId = useAppStore((s) => s.catId);
  const { homeKey, attacks, profiles } = useHousehold();

  const sortedDesc = [...attacks].sort((a, b) => b.date.localeCompare(a.date));

  const handleEdit = (a: Attack) => {
    const totalSec = Math.max(0, Math.round(Number(a.duration || 0) * 60));
    setAttackForm({
      date: a.date || '',
      severity: (['mild', 'moderate', 'severe'] as const).includes(a.severity as any)
        ? (a.severity as 'mild' | 'moderate' | 'severe')
        : 'mild',
      durationMin: String(Math.floor(totalSec / 60)),
      durationSec: String(totalSec % 60),
      notes: a.notes || '',
    });
    setEditAttackId(a.id);
    setModal('editAttack');
  };

  const handleDelete = (id: number) => {
    Alert.alert(
      t('del'),
      t('deleteAttackConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: async () => {
            if (!homeKey || !catId) return;
            await deleteAttack(id, homeKey, catId, uid);
          },
        },
      ],
    );
  };

  return (
    <>
      <AppHeader />
      <ScrollView style={styles.bg} contentContainerStyle={styles.content}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.sectionLabel}>{t('attackLog')}</Text>
          <Text style={{ color: G.muted, fontSize: 12 }}>{attacks.length} {t('total')}</Text>
        </View>

        {sortedDesc.map((a, i) => (
          <View
            key={a.id}
            style={[styles.card, { borderLeftColor: SEV[a.severity] }]}
          >
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTopLeft}>
                  <Text style={styles.dateText}>{fmt(a.date, lang)}</Text>
                  <WhoBadge addedBy={a.addedBy} profiles={profiles} />
                </View>
                <Text style={styles.duration}>⏱ {fmtDuration(a.duration, lang)}</Text>
                {a.notes ? (
                  <Text style={styles.notes}>{a.notes}</Text>
                ) : null}
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.sevBadge, { backgroundColor: `${SEV[a.severity]}18` }]}>
                  <Text style={[styles.sevText, { color: SEV[a.severity] }]}>
                    {t(`sevLabels.${a.severity}`)}
                  </Text>
                </View>
                <View style={styles.actionBtns}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(a)}>
                    <Text style={{ color: G.muted, fontSize: 10 }}>{t('edit')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(a.id)}>
                    <Text style={{ color: G.coral, fontSize: 10 }}>{t('del')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ))}

        {!attacks.length && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 32 }}>🌿</Text>
            <Text style={{ color: G.muted, fontSize: 14, marginTop: 8 }}>No attacks recorded yet</Text>
          </View>
        )}
      </ScrollView>

      <AttackModal />
      <InhalerModal />
      <ProfileManager />
    </>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: G.bg },
  content: { padding: 16, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 },
  sectionLabel: { color: G.muted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  card: {
    backgroundColor: G.surface,
    borderWidth: 1,
    borderColor: G.border,
    borderLeftWidth: 3,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTopLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  dateText: { color: G.text, fontWeight: '600', fontSize: 15 },
  duration: { color: G.muted, fontSize: 12, marginTop: 4 },
  notes: { color: 'rgba(240,236,228,0.65)', fontSize: 12, marginTop: 5, fontStyle: 'italic' },
  cardRight: { flexDirection: 'column', alignItems: 'flex-end', gap: 8, marginLeft: 8 },
  sevBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  sevText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  actionBtns: { flexDirection: 'row', gap: 6 },
  editBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: G.border,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  deleteBtn: {
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.33)',
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  empty: { alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
});
